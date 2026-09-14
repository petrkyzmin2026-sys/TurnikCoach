from __future__ import annotations
import base64, hashlib, hmac, json, os, secrets, sqlite3
from collections import defaultdict
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import DefaultDict
from fastapi import FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field, field_validator

DB_PATH=Path(os.getenv('MESSENGER_DB','/tmp/messenger.db'))
app=FastAPI(title='Petr Messenger',version='1.1.1')
app.add_middleware(CORSMiddleware,allow_origins=['*'],allow_methods=['*'],allow_headers=['*'])

@contextmanager
def db():
    c=sqlite3.connect(DB_PATH,check_same_thread=False); c.row_factory=sqlite3.Row
    try: yield c; c.commit()
    finally: c.close()

def init():
    with db() as c:
        c.executescript('''
        CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE COLLATE NOCASE,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS tokens(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL,created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT,sender_id INTEGER NOT NULL,recipient_id INTEGER NOT NULL,text TEXT NOT NULL,created_at TEXT NOT NULL,read_at TEXT);
        CREATE INDEX IF NOT EXISTS msg_pair ON messages(sender_id,recipient_id,id);
        ''')
init()

def now(): return datetime.now(timezone.utc).isoformat()
def hp(p):
    s=secrets.token_bytes(16); d=hashlib.pbkdf2_hmac('sha256',p.encode(),s,200000)
    return f'pbkdf2$200000${base64.b64encode(s).decode()}${base64.b64encode(d).decode()}'
def vp(p,e):
    try:
        _,it,s,d=e.split('$'); a=hashlib.pbkdf2_hmac('sha256',p.encode(),base64.b64decode(s),int(it)); return hmac.compare_digest(a,base64.b64decode(d))
    except: return False

def user_for_token(t):
    with db() as c:
        r=c.execute('SELECT u.id,u.username FROM tokens t JOIN users u ON u.id=t.user_id WHERE t.token=?',(t,)).fetchone(); return dict(r) if r else None

def auth(h):
    if not h or not h.startswith('Bearer '): raise HTTPException(401,'Требуется авторизация')
    u=user_for_token(h[7:])
    if not u: raise HTTPException(401,'Недействительная сессия')
    return u

class Cred(BaseModel):
    username:str=Field(min_length=1,max_length=64)
    password:str=Field(min_length=4,max_length=128)
    @field_validator('username')
    @classmethod
    def validate_username(cls,v):
        v=v.strip()
        if not v: raise ValueError('Логин не может быть пустым')
        if any(ord(ch)<32 for ch in v): raise ValueError('Недопустимые символы в логине')
        return v
class Send(BaseModel):
    recipient_id:int
    text:str=Field(min_length=1,max_length=4000)

class Manager:
    def __init__(self): self.a:DefaultDict[int,set[WebSocket]]=defaultdict(set)
    async def connect(self,uid,w): await w.accept(); self.a[uid].add(w)
    async def disconnect(self,uid,w):
        self.a[uid].discard(w)
        if not self.a[uid]: self.a.pop(uid,None)
    async def send(self,uid,p):
        txt=json.dumps(p,ensure_ascii=False)
        for w in list(self.a.get(uid,set())):
            try: await w.send_text(txt)
            except: self.a[uid].discard(w)
    def online(self,uid): return bool(self.a.get(uid))
M=Manager()

@app.get('/health')
def health(): return {'ok':True,'version':'1.1.1'}
@app.post('/auth/register')
def register(x:Cred):
    with db() as c:
        try: cur=c.execute('INSERT INTO users(username,password_hash,created_at) VALUES(?,?,?)',(x.username,hp(x.password),now()))
        except sqlite3.IntegrityError: raise HTTPException(409,'Такой пользователь уже существует')
        token=secrets.token_urlsafe(32); c.execute('INSERT INTO tokens VALUES(?,?,?)',(token,cur.lastrowid,now()))
        return {'token':token,'user':{'id':cur.lastrowid,'username':x.username}}
@app.post('/auth/login')
def login(x:Cred):
    with db() as c:
        r=c.execute('SELECT * FROM users WHERE username=? COLLATE NOCASE',(x.username,)).fetchone()
        if not r or not vp(x.password,r['password_hash']): raise HTTPException(401,'Неверный логин или пароль')
        token=secrets.token_urlsafe(32); c.execute('INSERT INTO tokens VALUES(?,?,?)',(token,r['id'],now()))
        return {'token':token,'user':{'id':r['id'],'username':r['username']}}
@app.get('/me')
def me(authorization:str|None=Header(None)): return auth(authorization)
@app.get('/users')
def users(authorization:str|None=Header(None)):
    u=auth(authorization)
    with db() as c:
        return [dict(r)|{'online':M.online(r['id'])} for r in c.execute('SELECT id,username FROM users WHERE id<>? ORDER BY username',(u['id'],)).fetchall()]

async def save(uid,rid,text):
    with db() as c:
        if not c.execute('SELECT 1 FROM users WHERE id=?',(rid,)).fetchone(): raise HTTPException(404,'Пользователь не найден')
        cur=c.execute('INSERT INTO messages(sender_id,recipient_id,text,created_at) VALUES(?,?,?,?)',(uid,rid,text.strip(),now()))
        r=c.execute('SELECT * FROM messages WHERE id=?',(cur.lastrowid,)).fetchone(); m=dict(r)
    await M.send(rid,{'type':'message','message':m}); return m

@app.post('/messages')
async def send(x:Send,authorization:str|None=Header(None)):
    u=auth(authorization); return await save(u['id'],x.recipient_id,x.text)
@app.get('/messages/{peer_id}')
async def history(peer_id:int,authorization:str|None=Header(None)):
    u=auth(authorization); stamp=now()
    with db() as c:
        c.execute('UPDATE messages SET read_at=COALESCE(read_at,?) WHERE sender_id=? AND recipient_id=?',(stamp,peer_id,u['id']))
        rows=c.execute('SELECT * FROM messages WHERE (sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?) ORDER BY id',(u['id'],peer_id,peer_id,u['id'])).fetchall()
        ids=[r['id'] for r in rows if r['sender_id']==peer_id]
    if ids: await M.send(peer_id,{'type':'read','reader_id':u['id'],'message_ids':ids,'read_at':stamp})
    return [dict(r) for r in rows]
@app.get('/dialogs')
def dialogs(authorization:str|None=Header(None)):
    u=auth(authorization); uid=u['id']; out=[]
    with db() as c:
        peers=c.execute('''SELECT CASE WHEN sender_id=? THEN recipient_id ELSE sender_id END peer_id,MAX(id) mid FROM messages WHERE sender_id=? OR recipient_id=? GROUP BY peer_id''',(uid,uid,uid)).fetchall()
        for p in peers:
            usr=c.execute('SELECT id,username FROM users WHERE id=?',(p['peer_id'],)).fetchone(); m=c.execute('SELECT * FROM messages WHERE id=?',(p['mid'],)).fetchone()
            unread=c.execute('SELECT COUNT(*) n FROM messages WHERE sender_id=? AND recipient_id=? AND read_at IS NULL',(p['peer_id'],uid)).fetchone()['n']
            out.append({'id':usr['id'],'title':usr['username'],'online':M.online(usr['id']),'unread_count':unread,'last_message':dict(m)})
    return sorted(out,key=lambda x:x['last_message']['id'],reverse=True)

@app.websocket('/ws')
async def ws(w:WebSocket,token:str):
    u=user_for_token(token)
    if not u: await w.close(code=4401); return
    uid=u['id']; await M.connect(uid,w)
    try:
        while True:
            d=json.loads(await w.receive_text())
            if d.get('type')=='message':
                m=await save(uid,int(d['recipient_id']),str(d['text'])); await w.send_text(json.dumps({'type':'message','message':m},ensure_ascii=False))
            elif d.get('type')=='typing': await M.send(int(d['recipient_id']),{'type':'typing','user_id':uid,'typing':bool(d.get('typing',True))})
            else: await w.send_text('{"type":"pong"}')
    except WebSocketDisconnect: pass
    finally: await M.disconnect(uid,w)

HTML=r'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Messenger</title><style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui;background:#111827;color:#f9fafb}button,input{font:inherit}.wrap{height:100vh;display:flex;flex-direction:column}.top{padding:14px 16px;background:#1f2937;font-weight:700}.auth{max-width:420px;margin:auto;width:100%;padding:22px}.auth input{width:100%;padding:13px;margin:7px 0;border:1px solid #374151;border-radius:12px;background:#111827;color:white}.row{display:flex;gap:8px}.btn{padding:12px 14px;border:0;border-radius:12px;background:#2563eb;color:white}.ghost{background:#374151}.main{display:none;flex:1;min-height:0}.people{width:38%;max-width:330px;border-right:1px solid #374151;overflow:auto}.person{padding:14px;border-bottom:1px solid #1f2937}.person.on{background:#1f2937}.chat{flex:1;display:flex;flex-direction:column}.head{padding:13px;border-bottom:1px solid #374151}.msgs{flex:1;overflow:auto;padding:12px}.m{max-width:78%;padding:9px 12px;border-radius:15px;margin:6px 0;background:#374151}.mine{margin-left:auto;background:#2563eb}.send{display:flex;gap:8px;padding:10px;border-top:1px solid #374151}.send input{flex:1;padding:12px;border-radius:12px;border:1px solid #374151;background:#111827;color:white}.small{font-size:12px;color:#9ca3af}.err{color:#fca5a5;min-height:22px}@media(max-width:650px){.people{width:42%}.person{padding:11px}.m{max-width:88%}}</style></head><body><div class="wrap"><div class="top">Petr Messenger</div><div id="auth" class="auth"><h2>Вход</h2><input id="user" placeholder="Логин"><input id="pass" type="password" placeholder="Пароль, не менее 4 символов"><div class="row"><button class="btn" onclick="login(false)">Войти</button><button class="btn ghost" onclick="login(true)">Регистрация</button></div><p id="err" class="err"></p></div><div id="main" class="main"><div class="people" id="people"></div><div class="chat"><div class="head" id="head">Выберите пользователя</div><div class="msgs" id="msgs"></div><div class="send"><input id="text" placeholder="Сообщение" onkeydown="if(event.key==='Enter')send()"><button class="btn" onclick="send()">➤</button></div></div></div></div><script>
let token=localStorage.token||'',me=JSON.parse(localStorage.me||'null'),peer=null,ws=null;
const $=id=>document.getElementById(id); const H=()=>({'Authorization':'Bearer '+token,'Content-Type':'application/json'});
function errText(j,status){if(typeof j.detail==='string')return j.detail;if(Array.isArray(j.detail)&&j.detail.length){let d=j.detail[0];return d.msg?d.msg.replace(/^Value error, /,''):JSON.stringify(d)}return 'Ошибка '+status}
async function api(p,opt={}){let r=await fetch(p,{...opt,headers:{...H(),...(opt.headers||{})}});let j=await r.json().catch(()=>({}));if(!r.ok)throw Error(errText(j,r.status));return j}
async function login(reg){try{$('err').textContent='';let username=$('user').value.trim(),password=$('pass').value;if(!username)throw Error('Введите логин');if(password.length<4)throw Error('Пароль должен содержать не менее 4 символов');let j=await api(reg?'/auth/register':'/auth/login',{method:'POST',body:JSON.stringify({username,password})});token=j.token;me=j.user;localStorage.token=token;localStorage.me=JSON.stringify(me);start()}catch(e){$('err').textContent=e.message}}
function start(){$('auth').style.display='none';$('main').style.display='flex';loadUsers().catch(e=>alert(e.message));connect()}
async function loadUsers(){let a=await api('/users');$('people').innerHTML=a.map(u=>`<div class="person" id="u${u.id}" onclick='openPeer(${JSON.stringify(u)})'><b>${esc(u.username)}</b><div class="small">${u.online?'в сети':'не в сети'}</div></div>`).join('')||'<div class="person">Других пользователей пока нет</div>'}
async function openPeer(u){peer=u;document.querySelectorAll('.person').forEach(x=>x.classList.remove('on'));$('u'+u.id)?.classList.add('on');$('head').textContent=u.username;let a=await api('/messages/'+u.id);render(a)}
function render(a){$('msgs').innerHTML=a.map(m=>`<div class="m ${m.sender_id===me.id?'mine':''}">${esc(m.text)}<div class="small">${new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div></div>`).join('');$('msgs').scrollTop=$('msgs').scrollHeight}
function esc(s){return (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function connect(){if(ws)ws.close();let proto=location.protocol==='https:'?'wss':'ws';ws=new WebSocket(`${proto}://${location.host}/ws?token=${encodeURIComponent(token)}`);ws.onmessage=e=>{let d=JSON.parse(e.data);if(d.type==='message'&&peer&&((d.message.sender_id===peer.id)||(d.message.recipient_id===peer.id)))openPeer(peer);if(d.type==='message')loadUsers()};ws.onclose=()=>setTimeout(connect,2500)}
function send(){let t=$('text').value.trim();if(!t||!peer)return;$('text').value='';if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'message',recipient_id:peer.id,text:t}));else api('/messages',{method:'POST',body:JSON.stringify({recipient_id:peer.id,text:t})}).then(()=>openPeer(peer))}
if(token&&me)start();
</script></body></html>'''
@app.get('/')
def root(): return {'ok':True,'app':'/app/'}
@app.get('/app/')
def web(): return HTMLResponse(HTML)
