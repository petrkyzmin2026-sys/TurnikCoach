from __future__ import annotations

import asyncio
import math
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

from curl_cffi import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse

BASE='https://api.sofascore.com/api/v1'
app=FastAPI(title='Football Totals',version='0.1.0')

HEADERS={
    'User-Agent':'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36',
    'Accept':'application/json,text/plain,*/*',
    'Referer':'https://www.sofascore.com/'
}


def sf_get(path:str)->dict[str,Any]:
    try:
        r=requests.get(BASE+path,headers=HEADERS,impersonate='chrome',timeout=20)
        if r.status_code!=200:
            raise HTTPException(502,f'Источник статистики вернул {r.status_code}')
        return r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502,f'Ошибка получения статистики: {e}')


def completed(events:list[dict])->list[dict]:
    out=[]
    for e in events:
        st=e.get('status',{}).get('type')
        hs=e.get('homeScore',{}).get('current')
        as_=e.get('awayScore',{}).get('current')
        if st=='finished' and isinstance(hs,(int,float)) and isinstance(as_,(int,float)):
            out.append(e)
    return out


def weighted_mean(vals:list[float])->float:
    if not vals: return 0.0
    ws=[0.88**i for i in range(len(vals))]
    return sum(v*w for v,w in zip(vals,ws))/sum(ws)


def team_features(events:list[dict],team_id:int)->dict[str,float]:
    ev=completed(events)[:12]
    gf=[]; ga=[]; t=[]; h1=[]
    for e in ev:
        home=e.get('homeTeam',{}).get('id')==team_id
        hs=float(e.get('homeScore',{}).get('current',0)); aas=float(e.get('awayScore',{}).get('current',0))
        hp=e.get('homeScore',{}).get('period1'); ap=e.get('awayScore',{}).get('period1')
        gf.append(hs if home else aas); ga.append(aas if home else hs); t.append(hs+aas)
        if isinstance(hp,(int,float)) and isinstance(ap,(int,float)):
            h1.append(float(hp+ap))
    return {
        'n':len(ev),
        'gf':weighted_mean(gf),
        'ga':weighted_mean(ga),
        'total':weighted_mean(t),
        'h1':weighted_mean(h1),
    }


def pois_cdf(k:int,lam:float)->float:
    if lam<=0: return 1.0
    return sum(math.exp(-lam)*(lam**i)/math.factorial(i) for i in range(k+1))


def over_prob(line:float,lam:float)->float:
    k=int(math.floor(line))
    return max(0.0,min(1.0,1.0-pois_cdf(k,lam)))


def pct(x:float)->int:
    return int(round(max(0,min(1,x))*100))


def model(home:dict[str,float],away:dict[str,float])->dict[str,Any]:
    # Expected match goals: attack/defence blend + total-goal stabilizer.
    attack=(home['gf']+away['ga']+away['gf']+home['ga'])/2
    env=(home['total']+away['total'])/2
    lam=max(0.35,min(5.0,0.70*attack+0.30*env))
    # First-half expectation from observed first-half totals; fall back to 45% of match rate.
    h1vals=[x for x in (home['h1'],away['h1']) if x>0]
    h1raw=sum(h1vals)/len(h1vals) if h1vals else lam*0.45
    lam_h1=max(0.15,min(2.6,0.75*h1raw+0.25*lam*0.45))
    match=[]
    for line in (1.5,2.5,3.5):
        ov=over_prob(line,lam); match.append({'line':line,'over':pct(ov),'under':pct(1-ov)})
    first=[]
    for line in (0.5,1.5):
        ov=over_prob(line,lam_h1); first.append({'line':line,'over':pct(ov),'under':pct(1-ov)})
    candidates=[]
    for scope,rows in [('1 тайм',first),('матч',match)]:
        for r in rows:
            candidates.append({'scope':scope,'label':f"ТБ {r['line']}",'prob':r['over']})
            candidates.append({'scope':scope,'label':f"ТМ {r['line']}",'prob':r['under']})
    candidates.sort(key=lambda x:x['prob'],reverse=True)
    conf=min(100,int(round((home['n']+away['n'])/24*100)))
    return {'lambda_match':round(lam,2),'lambda_h1':round(lam_h1,2),'first_half':first,'match':match,'best':candidates[:3],'confidence':conf}


@app.get('/health')
def health():
    return {'ok':True,'version':'0.1.0'}

@app.get('/api/matches')
def matches(date:str):
    data=sf_get(f'/sport/football/scheduled-events/{date}')
    out=[]
    for e in data.get('events',[]):
        # Scheduled / not started only; finished/live still shown with status.
        out.append({
            'id':e.get('id'),
            'home':e.get('homeTeam',{}).get('name'),
            'away':e.get('awayTeam',{}).get('name'),
            'home_id':e.get('homeTeam',{}).get('id'),
            'away_id':e.get('awayTeam',{}).get('id'),
            'tournament':e.get('tournament',{}).get('name'),
            'country':e.get('tournament',{}).get('category',{}).get('name'),
            'start':e.get('startTimestamp'),
            'status':e.get('status',{}).get('type'),
        })
    return {'date':date,'count':len(out),'matches':out}

@app.get('/api/predict/{event_id}')
def predict(event_id:int):
    event=sf_get(f'/event/{event_id}').get('event',{})
    hid=event.get('homeTeam',{}).get('id'); aid=event.get('awayTeam',{}).get('id')
    if not hid or not aid: raise HTTPException(404,'Не удалось определить команды')
    he=sf_get(f'/team/{hid}/events/last/0').get('events',[])
    ae=sf_get(f'/team/{aid}/events/last/0').get('events',[])
    hf=team_features(he,hid); af=team_features(ae,aid)
    m=model(hf,af)
    return {
        'event_id':event_id,
        'home':event.get('homeTeam',{}).get('name'),
        'away':event.get('awayTeam',{}).get('name'),
        'tournament':event.get('tournament',{}).get('name'),
        'home_form':hf,'away_form':af,
        **m,
        'note':'Вероятности являются оценкой статистической модели и не гарантируют исход.'
    }

HTML=r'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Football Totals</title><style>
*{box-sizing:border-box}body{margin:0;background:#0b1220;color:#f3f4f6;font-family:system-ui,-apple-system,sans-serif}.top{position:sticky;top:0;z-index:5;background:#111827;padding:14px 14px 10px;border-bottom:1px solid #263244}.title{font-weight:800;font-size:20px}.sub{font-size:12px;color:#9ca3af;margin-top:3px}.bar{display:flex;gap:8px;margin-top:10px}.bar input,.bar button{padding:11px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#fff}.bar input{flex:1}.bar button{background:#2563eb;border:0;font-weight:700}.list{padding:10px}.card{background:#111827;border:1px solid #263244;border-radius:14px;padding:13px;margin-bottom:10px}.league{font-size:11px;color:#93a4b8;margin-bottom:6px}.teams{font-size:16px;font-weight:750}.time{font-size:12px;color:#9ca3af;margin-top:4px}.calc{margin-top:10px;width:100%;padding:10px;border:0;border-radius:10px;background:#1d4ed8;color:#fff;font-weight:700}.pred{display:none;margin-top:12px;border-top:1px solid #263244;padding-top:10px}.sec{font-weight:800;margin:10px 0 6px}.chips{display:flex;flex-wrap:wrap;gap:6px}.chip{padding:7px 9px;border-radius:10px;background:#1f2937;font-size:13px}.best{background:#064e3b;border:1px solid #10b981}.muted{color:#9ca3af;font-size:11px;margin-top:9px}.err{color:#fca5a5;font-size:12px;margin-top:8px}.loading{text-align:center;color:#9ca3af;padding:30px}</style></head><body>
<div class="top"><div class="title">Football Totals</div><div class="sub">Тоталы 1-го тайма и матча с вероятностью модели</div><div class="bar"><input id="date" type="date"><button onclick="loadMatches()">Матчи</button></div></div><div id="list" class="list"></div>
<script>
const $=x=>document.getElementById(x);const d=new Date();$('date').value=d.toISOString().slice(0,10);
function tm(ts){if(!ts)return'';return new Date(ts*1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
async function loadMatches(){let date=$('date').value;$('list').innerHTML='<div class="loading">Загрузка матчей…</div>';try{let r=await fetch('/api/matches?date='+date);let j=await r.json();if(!r.ok)throw Error(j.detail||'Ошибка');$('list').innerHTML=j.matches.map(m=>`<div class="card"><div class="league">${m.country||''} · ${m.tournament||''}</div><div class="teams">${m.home} — ${m.away}</div><div class="time">${tm(m.start)} · ${m.status||''}</div><button class="calc" onclick="calc(${m.id},this)">Рассчитать тоталы</button><div class="pred" id="p${m.id}"></div></div>`).join('')||'<div class="loading">Матчей нет</div>'}catch(e){$('list').innerHTML='<div class="loading err">'+e.message+'</div>'}}
function chips(rows){return rows.map(r=>`<span class="chip">ТБ ${r.line} (${r.over}%)</span><span class="chip">ТМ ${r.line} (${r.under}%)</span>`).join('')}
async function calc(id,b){let p=$('p'+id);p.style.display='block';p.innerHTML='<div class="muted">Получаю последние матчи и считаю модель…</div>';b.disabled=true;try{let r=await fetch('/api/predict/'+id);let j=await r.json();if(!r.ok)throw Error(j.detail||'Ошибка');p.innerHTML=`<div class="sec">Наиболее вероятно</div><div class="chips">${j.best.map(x=>`<span class="chip best">${x.scope}: ${x.label} (${x.prob}%)</span>`).join('')}</div><div class="sec">1-й тайм</div><div class="chips">${chips(j.first_half)}</div><div class="sec">Весь матч</div><div class="chips">${chips(j.match)}</div><div class="muted">Ожидаемые голы: 1Т ${j.lambda_h1}, матч ${j.lambda_match}. Данных для расчёта: ${j.home_form.n}+${j.away_form.n} матчей. Уверенность по объёму выборки: ${j.confidence}%.</div><div class="muted">${j.note}</div>`}catch(e){p.innerHTML='<div class="err">'+e.message+'</div>'}finally{b.disabled=false}}
loadMatches();</script></body></html>'''

@app.get('/')
def root(): return {'ok':True,'app':'/app/'}
@app.get('/app/')
def ui(): return HTMLResponse(HTML)
