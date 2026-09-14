package ru.matchstats.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends Activity {
    private static final String SOFA = "https://api.sofascore.com/api/v1";
    private static final String ODDS = "https://api.odds-api.io/v3";
    private static final String PREFS = "denzl_prefs";
    private static final String KEY_ODDS = "odds_api_key";
    private static final String BOOKMAKERS = "Bet365,Unibet";
    private static final int BG=Color.rgb(10,15,20), CARD=Color.rgb(20,28,36), CARD2=Color.rgb(26,36,46);
    private static final int TEXT=Color.rgb(240,244,247), MUTED=Color.rgb(145,157,169), GREEN=Color.rgb(38,166,91), ACCENT=Color.rgb(64,145,255), RED=Color.rgb(220,80,80);

    private final ExecutorService io=Executors.newFixedThreadPool(4);
    private final AtomicBoolean loading=new AtomicBoolean(false);
    private final List<Match> lineMatches=new ArrayList<>();
    private final List<Match> liveMatches=new ArrayList<>();
    private boolean liveMode=false;
    private String statusText="Загрузка реальных событий…";
    private boolean lastError=false;

    @Override protected void onCreate(Bundle b){
        super.onCreate(b);
        render();
        loadMatches(false);
    }

    @Override protected void onDestroy(){ io.shutdownNow(); super.onDestroy(); }

    private String oddsKey(){ return getSharedPreferences(PREFS,Context.MODE_PRIVATE).getString(KEY_ODDS,"").trim(); }

    private void showKeyDialog(){
        final EditText input=new EditText(this);
        input.setSingleLine(true);
        input.setHint("API key Odds-API.io");
        input.setText(oddsKey());
        input.setSelectAllOnFocus(true);
        int p=dp(18); LinearLayout box=new LinearLayout(this); box.setPadding(p,p,p,0); box.addView(input,new LinearLayout.LayoutParams(-1,-2));
        new AlertDialog.Builder(this)
                .setTitle("Odds-API.io Free")
                .setMessage("Вставьте бесплатный API-ключ. Он сохраняется только на этом телефоне.")
                .setView(box)
                .setPositiveButton("СОХРАНИТЬ",(d,w)->{
                    getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit().putString(KEY_ODDS,input.getText().toString().trim()).apply();
                    statusText="Ключ Odds-API.io сохранён"; lastError=false; render();
                })
                .setNegativeButton("ОТМЕНА",null)
                .setNeutralButton("УДАЛИТЬ",(d,w)->{
                    getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit().remove(KEY_ODDS).apply();
                    statusText="Ключ Odds-API.io удалён"; lastError=false; render();
                }).show();
    }

    private void loadMatches(boolean live){
        if(!loading.compareAndSet(false,true))return;
        statusText=live?"Обновление LIVE…":"Загрузка линии…"; lastError=false; render();
        io.execute(()->{
            String key=oddsKey();
            try{
                List<Match> out=new ArrayList<>();
                String source="SofaScore";
                Exception sofaError=null;
                try{
                    out=loadFromSofa(live);
                }catch(Exception ex){ sofaError=ex; }

                if(out.isEmpty() && sofaError!=null && !key.isEmpty()){
                    out=loadEventsFromOddsFallback(live,key);
                    source="Odds-API.io резерв";
                }else if(sofaError!=null && out.isEmpty()){
                    throw new Exception("SofaScore: "+safeMsg(sofaError)+"; задайте ключ Odds-API.io для резерва");
                }

                if(!key.isEmpty() && !out.isEmpty()){
                    try{
                        enrichWithOddsApi(out,live,key);
                        source=source+" + Odds-API.io";
                    }catch(Exception ex){
                        source=source+"; Odds-API.io недоступен: "+safeMsg(ex);
                    }
                }

                final List<Match> result=out; final String src=source;
                runOnUiThread(()->{
                    List<Match> target=live?liveMatches:lineMatches; target.clear(); target.addAll(result);
                    if(result.isEmpty()) statusText=live?"Сейчас нет футбольных матчей LIVE":"На сегодня матчи не получены";
                    else statusText="Матчей: "+result.size()+" · "+src;
                    lastError=false; loading.set(false); render();
                });
            }catch(Exception ex){
                runOnUiThread(()->{
                    statusText="Ошибка: "+safeMsg(ex); lastError=true; loading.set(false); render();
                });
            }
        });
    }

    private List<Match> loadFromSofa(boolean live)throws Exception{
        String endpoint;
        if(live) endpoint=SOFA+"/sport/football/events/live";
        else{
            SimpleDateFormat sdf=new SimpleDateFormat("yyyy-MM-dd",Locale.US); sdf.setTimeZone(TimeZone.getDefault());
            endpoint=SOFA+"/sport/football/scheduled-events/"+sdf.format(new Date());
        }
        JSONObject root=getObject(endpoint,true);
        JSONArray events=root.optJSONArray("events");
        List<Match> out=new ArrayList<>();
        if(events==null)return out;
        for(int i=0;i<events.length()&&out.size()<20;i++){
            JSONObject e=events.optJSONObject(i); if(e==null)continue;
            JSONObject st=e.optJSONObject("status"); String type=st==null?"":st.optString("type","");
            if(!live && !(type.equals("notstarted")||type.equals("scheduled")))continue;
            Match m=parseSofaEvent(e,live); if(m==null)continue;
            try{ applySofaOdds(m,getObject(SOFA+"/event/"+m.id+"/odds/1/all",true)); }catch(Exception ignored){}
            if(live) try{ applyStatistics(m,getObject(SOFA+"/event/"+m.id+"/statistics",true)); }catch(Exception ignored){}
            out.add(m);
        }
        return out;
    }

    private List<Match> loadEventsFromOddsFallback(boolean live,String key)throws Exception{
        List<Match> out=new ArrayList<>();
        if(live){
            JSONArray a=getArray(ODDS+"/events?apiKey="+enc(key)+"&sport=football&status=live&limit=50",false);
            addOddsEvents(out,a,true);
        }else{
            String[] leagues={"england-premier-league","spain-la-liga","germany-bundesliga","italy-serie-a","uefa-champions-league"};
            for(String league:leagues){
                try{
                    JSONArray a=getArray(ODDS+"/events?apiKey="+enc(key)+"&sport=football&league="+enc(league)+"&status=pending&limit=10",false);
                    addOddsEvents(out,a,false);
                }catch(Exception ignored){}
                if(out.size()>=20)break;
            }
        }
        return out;
    }

    private void addOddsEvents(List<Match> out,JSONArray a,boolean live){
        if(a==null)return;
        for(int i=0;i<a.length()&&out.size()<20;i++){
            JSONObject e=a.optJSONObject(i); if(e==null)continue;
            Match m=new Match(); m.oddsEventId=e.optLong("id",-1); m.home=e.optString("home","—"); m.away=e.optString("away","—");
            JSONObject l=e.optJSONObject("league"); m.league=l==null?"Футбол":l.optString("name","Футбол");
            m.oddsSource="Odds-API.io";
            JSONObject scores=e.optJSONObject("scores"); if(scores!=null){m.homeGoals=scores.optInt("home",-1);m.awayGoals=scores.optInt("away",-1);}
            String date=e.optString("date",""); m.startTimestamp=parseIso(date);
            out.add(m);
        }
    }

    private void enrichWithOddsApi(List<Match> matches,boolean live,String key)throws Exception{
        List<Long> ids=new ArrayList<>();
        JSONArray liveEvents=null;
        if(live){
            try{ liveEvents=getArray(ODDS+"/events?apiKey="+enc(key)+"&sport=football&status=live&limit=100",false); }catch(Exception ignored){}
        }
        for(Match m:matches){
            if(ids.size()>=10)break;
            long id=m.oddsEventId;
            if(id<=0){
                if(live && liveEvents!=null) id=findOddsEventId(liveEvents,m);
                else{
                    try{
                        JSONArray search=getArray(ODDS+"/events/search?apiKey="+enc(key)+"&query="+enc(m.home),false);
                        id=findOddsEventId(search,m);
                    }catch(Exception ignored){}
                }
            }
            if(id>0){m.oddsEventId=id;ids.add(id);}
        }
        if(ids.isEmpty())return;
        StringBuilder sb=new StringBuilder(); for(Long id:ids){if(sb.length()>0)sb.append(',');sb.append(id);}
        JSONArray multi=getArray(ODDS+"/odds/multi?apiKey="+enc(key)+"&eventIds="+sb+"&bookmakers="+enc(BOOKMAKERS),false);
        for(int i=0;i<multi.length();i++){
            JSONObject oe=multi.optJSONObject(i); if(oe==null)continue; long id=oe.optLong("id",-1);
            for(Match m:matches) if(m.oddsEventId==id){ applyOddsApi(m,oe); break; }
        }
    }

    private long findOddsEventId(JSONArray arr,Match m){
        if(arr==null)return -1; String h=norm(m.home),a=norm(m.away);
        for(int i=0;i<arr.length();i++){
            JSONObject e=arr.optJSONObject(i); if(e==null)continue;
            String eh=norm(e.optString("home","")),ea=norm(e.optString("away",""));
            if(similar(h,eh)&&similar(a,ea))return e.optLong("id",-1);
        }
        return -1;
    }

    private void applyOddsApi(Match m,JSONObject root){
        JSONObject bms=root.optJSONObject("bookmakers"); if(bms==null)return;
        JSONArray markets=null; String chosen="";
        String[] preferred={"Bet365","Unibet"};
        for(String b:preferred){JSONArray a=bms.optJSONArray(b);if(a!=null){markets=a;chosen=b;break;}}
        if(markets==null){JSONArray names=bms.names();if(names!=null&&names.length()>0){chosen=names.optString(0);markets=bms.optJSONArray(chosen);}}
        if(markets==null)return;
        boolean any=false;
        for(int i=0;i<markets.length();i++){
            JSONObject mk=markets.optJSONObject(i); if(mk==null)continue; String name=mk.optString("name","").toLowerCase(Locale.ROOT); JSONArray odds=mk.optJSONArray("odds"); if(odds==null)continue;
            boolean h1=name.contains("half")||name.startsWith("1h")||name.contains("1st");
            if((name.equals("ml")||name.contains("moneyline"))&&!h1&&odds.length()>0){JSONObject o=odds.optJSONObject(0);if(o!=null){double[] v={num(o,"home"),num(o,"draw"),num(o,"away")}; if(valid3(v)){m.o1=v[0];m.ox=v[1];m.o2=v[2];fair3(m,v,false);any=true;}}}
            else if(h1&&(name.contains("ml")||name.contains("moneyline")||name.contains("result"))&&odds.length()>0){JSONObject o=odds.optJSONObject(0);if(o!=null){double[] v={num(o,"home"),num(o,"draw"),num(o,"away")}; if(valid3(v)){m.h1o1=v[0];m.h1ox=v[1];m.h1o2=v[2];fair3(m,v,true);any=true;}}}
            if(name.contains("total")){
                for(int j=0;j<odds.length();j++){
                    JSONObject o=odds.optJSONObject(j); if(o==null)continue; String line=String.valueOf(o.opt("hdp")); double over=num(o,"over"),under=num(o,"under"); if(over<=1||under<=1)continue;
                    if(h1&&line.startsWith("0.5")){m.h1OOver05=over;m.h1OUnder05=under;fair2(m,new double[]{over,under},5,true);any=true;}
                    else if(h1&&line.startsWith("1.5")){m.h1OOver15=over;m.h1OUnder15=under;fair2(m,new double[]{over,under},15,true);any=true;}
                    else if(!h1&&line.startsWith("2.5")){m.oOver25=over;m.oUnder25=under;fair2(m,new double[]{over,under},25,false);any=true;}
                    else if(!h1&&line.startsWith("1.5")){m.oOver15=over;m.oUnder15=under;fair2(m,new double[]{over,under},15,false);any=true;}
                }
            }
        }
        if(any)m.oddsSource="Odds-API.io · "+chosen;
    }

    private JSONObject getObject(String url,boolean sofa)throws Exception{ return new JSONObject(getText(url,sofa)); }
    private JSONArray getArray(String url,boolean sofa)throws Exception{ return new JSONArray(getText(url,sofa)); }
    private String getText(String url,boolean sofa)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection(); c.setConnectTimeout(9000);c.setReadTimeout(12000);c.setRequestMethod("GET");
        c.setRequestProperty("Accept","application/json, text/plain, */*");
        c.setRequestProperty("User-Agent","Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36");
        if(sofa){c.setRequestProperty("Referer","https://www.sofascore.com/");c.setRequestProperty("Origin","https://www.sofascore.com");c.setRequestProperty("Accept-Language","ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7");}
        int code=c.getResponseCode(); if(code<200||code>=300){c.disconnect();throw new Exception("HTTP "+code+" · "+host(url));}
        BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream())); StringBuilder b=new StringBuilder();String s;while((s=r.readLine())!=null)b.append(s);r.close();c.disconnect();return b.toString();
    }

    private Match parseSofaEvent(JSONObject e,boolean live){
        long id=e.optLong("id",-1);if(id<0)return null;JSONObject h=e.optJSONObject("homeTeam"),a=e.optJSONObject("awayTeam");if(h==null||a==null)return null;
        Match m=new Match();m.id=id;m.home=h.optString("name","—");m.away=a.optString("name","—");JSONObject t=e.optJSONObject("tournament");String league=t==null?"Футбол":t.optString("name","Футбол");JSONObject cat=t==null?null:t.optJSONObject("category");m.league=cat==null?league:cat.optString("name","")+" · "+league;m.startTimestamp=e.optLong("startTimestamp",0);
        JSONObject hs=e.optJSONObject("homeScore"),as=e.optJSONObject("awayScore");m.homeGoals=hs==null?-1:hs.optInt("current",-1);m.awayGoals=as==null?-1:as.optInt("current",-1);m.h1HomeGoals=hs==null?-1:hs.optInt("period1",-1);m.h1AwayGoals=as==null?-1:as.optInt("period1",-1);
        if(live){JSONObject time=e.optJSONObject("time");long start=time==null?0:time.optLong("currentPeriodStartTimestamp",0);if(start>0){int elapsed=(int)((System.currentTimeMillis()/1000-start)/60);JSONObject st=e.optJSONObject("status");String period=st==null?"":st.optString("period","");m.minute=period.contains("2")?Math.min(90,45+Math.max(0,elapsed)):Math.min(45,Math.max(0,elapsed));}}
        return m;
    }

    private void applySofaOdds(Match m,JSONObject root){
        JSONArray markets=root.optJSONArray("markets");if(markets==null)return;boolean any=false;
        for(int i=0;i<markets.length();i++){JSONObject mk=markets.optJSONObject(i);if(mk==null)continue;String name=mk.optString("marketName","").toLowerCase(Locale.ROOT);JSONArray ch=mk.optJSONArray("choices");if(ch==null)continue;boolean h1=name.contains("1st half")||name.contains("first half")||name.contains("1-й тайм");
            if((name.equals("full time")||name.contains("match result"))&&!h1){double[] o=choiceOdds(ch);if(valid3(o)){m.o1=o[0];m.ox=o[1];m.o2=o[2];fair3(m,o,false);any=true;}}
            else if(h1&&(name.contains("result")||name.contains("1x2")||name.contains("half time"))){double[] o=choiceOdds(ch);if(valid3(o)){m.h1o1=o[0];m.h1ox=o[1];m.h1o2=o[2];fair3(m,o,true);any=true;}}
            if(name.contains("2.5")&&!h1&&(name.contains("total")||name.contains("goals"))){double[] o=overUnder(ch,"2.5");if(valid2(o)){m.oOver25=o[0];m.oUnder25=o[1];fair2(m,o,25,false);any=true;}}
            if(name.contains("1.5")&&!h1&&(name.contains("total")||name.contains("goals"))){double[] o=overUnder(ch,"1.5");if(valid2(o)){m.oOver15=o[0];m.oUnder15=o[1];fair2(m,o,15,false);any=true;}}
            if(h1&&name.contains("0.5")){double[] o=overUnder(ch,"0.5");if(valid2(o)){m.h1OOver05=o[0];m.h1OUnder05=o[1];fair2(m,o,5,true);any=true;}}
            if(h1&&name.contains("1.5")){double[] o=overUnder(ch,"1.5");if(valid2(o)){m.h1OOver15=o[0];m.h1OUnder15=o[1];fair2(m,o,15,true);any=true;}}
        }
        if(any)m.oddsSource="SofaScore";
    }

    private double[] choiceOdds(JSONArray ch){double[] out={0,0,0};for(int i=0;i<ch.length();i++){JSONObject x=ch.optJSONObject(i);if(x==null)continue;String n=x.optString("name","").trim().toLowerCase(Locale.ROOT);double o=decimalOdds(x);if(n.equals("1"))out[0]=o;else if(n.equals("x"))out[1]=o;else if(n.equals("2"))out[2]=o;}return out;}
    private double[] overUnder(JSONArray ch,String line){double[] out={0,0};for(int i=0;i<ch.length();i++){JSONObject x=ch.optJSONObject(i);if(x==null)continue;String n=x.optString("name","").toLowerCase(Locale.ROOT);if(!n.contains(line)&&ch.length()>2)continue;double o=decimalOdds(x);if(n.contains("over")||n.contains("больше")||n.contains("тб"))out[0]=o;if(n.contains("under")||n.contains("меньше")||n.contains("тм"))out[1]=o;}return out;}
    private double decimalOdds(JSONObject x){double d=x.optDouble("decimalValue",0);if(d>1)return d;String f=x.optString("fractionalValue","");try{String[] p=f.split("/");if(p.length==2)return 1.0+Double.parseDouble(p[0])/Double.parseDouble(p[1]);}catch(Exception ignored){}return 0;}
    private boolean valid3(double[]o){return o[0]>1&&o[1]>1&&o[2]>1;} private boolean valid2(double[]o){return o[0]>1&&o[1]>1;}
    private void fair3(Match m,double[]o,boolean h1){if(!valid3(o))return;double a=1/o[0],b=1/o[1],c=1/o[2],s=a+b+c;int p1=(int)Math.round(a/s*100),px=(int)Math.round(b/s*100),p2=100-p1-px;if(h1){m.h1p1=p1;m.h1px=px;m.h1p2=p2;}else{m.p1=p1;m.px=px;m.p2=p2;}}
    private void fair2(Match m,double[]o,int line,boolean h1){if(!valid2(o))return;double a=1/o[0],b=1/o[1],s=a+b;int over=(int)Math.round(a/s*100),under=100-over;if(h1&&line==5){m.h1Over05=over;m.h1Under05=under;}else if(h1){m.h1Over15=over;m.h1Under15=under;}else if(line==25){m.over25=over;m.under25=under;}else{m.over15=over;m.under15=under;}}

    private void applyStatistics(Match m,JSONObject root){JSONArray periods=root.optJSONArray("statistics");if(periods==null)return;for(int i=0;i<periods.length();i++){JSONObject p=periods.optJSONObject(i);if(p==null||!p.optString("period","").equals("ALL"))continue;JSONArray groups=p.optJSONArray("groups");if(groups==null)continue;for(int g=0;g<groups.length();g++){JSONObject gr=groups.optJSONObject(g);JSONArray items=gr==null?null:gr.optJSONArray("statisticsItems");if(items==null)continue;for(int k=0;k<items.length();k++){JSONObject it=items.optJSONObject(k);if(it==null)continue;String key=it.optString("key","");String val=it.optString("home","—")+" — "+it.optString("away","—");if(key.equals("ballPossession"))m.possession=val;if(key.equals("shotsOnGoal"))m.shotsOn=val;if(key.equals("totalShotsOnGoal")||key.equals("totalShots"))m.shots=val;if(key.toLowerCase(Locale.ROOT).contains("expectedgoals"))m.xg=val;}}}}

    private void render(){
        LinearLayout root=vertical();root.setBackgroundColor(BG);root.setPadding(dp(14),dp(12),dp(14),dp(12));root.addView(text("DENZL",26,TEXT,true));TextView sub=text("SofaScore + Odds-API.io Free · вероятность % + коэффициент",12,MUTED,false);sub.setPadding(0,0,0,dp(9));root.addView(sub);
        LinearLayout tabs=new LinearLayout(this);tabs.setWeightSum(2);Button line=tabButton("ЛИНИЯ",!liveMode),live=tabButton("LIVE",liveMode);tabs.addView(line,new LinearLayout.LayoutParams(0,dp(48),1));tabs.addView(live,new LinearLayout.LayoutParams(0,dp(48),1));root.addView(tabs);line.setOnClickListener(v->{liveMode=false;loadMatches(false);});live.setOnClickListener(v->{liveMode=true;loadMatches(true);});
        LinearLayout tools=new LinearLayout(this);tools.setWeightSum(liveMode?2:1);Button keyBtn=smallTab(oddsKey().isEmpty()?"КЛЮЧ ODDS-API.IO":"КЛЮЧ НАСТРОЕН",!oddsKey().isEmpty());tools.addView(keyBtn,new LinearLayout.LayoutParams(0,dp(42),1));keyBtn.setOnClickListener(v->showKeyDialog());if(liveMode){Button refresh=smallTab(loading.get()?"ОБНОВЛЕНИЕ…":"ОБНОВИТЬ LIVE",false);refresh.setEnabled(!loading.get());refresh.setOnClickListener(v->loadMatches(true));tools.addView(refresh,new LinearLayout.LayoutParams(0,dp(42),1));}LinearLayout.LayoutParams tp=new LinearLayout.LayoutParams(-1,dp(42));tp.setMargins(0,dp(8),0,0);root.addView(tools,tp);
        TextView state=text(statusText,11,lastError?RED:(loading.get()?ACCENT:GREEN),true);state.setGravity(Gravity.CENTER);state.setPadding(0,dp(7),0,dp(2));root.addView(state);
        ScrollView scroll=new ScrollView(this);LinearLayout list=vertical();for(Match m:(liveMode?liveMatches:lineMatches))list.addView(matchCard(m));scroll.addView(list);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));TextView note=text("SofaScore — основной источник событий и статистики. Odds-API.io — резерв и контроль коэффициентов. LIVE обновляется только по кнопке. Ключ хранится только на телефоне.",10,MUTED,false);note.setPadding(0,dp(6),0,0);root.addView(note);setContentView(root);
    }

    private View matchCard(Match m){LinearLayout c=vertical();c.setPadding(dp(12),dp(10),dp(12),dp(10));c.setBackground(roundRect(CARD,16));LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.setMargins(0,dp(9),0,0);c.setLayoutParams(cp);LinearLayout top=new LinearLayout(this);TextView l=text(m.league,11,MUTED,false),tm=text(m.minute>0?m.minute+"'":formatTime(m.startTimestamp),11,m.minute>0?GREEN:MUTED,true);top.addView(l,new LinearLayout.LayoutParams(0,-2,1));top.addView(tm);c.addView(top);String score=(m.homeGoals>=0&&m.awayGoals>=0)?"   "+m.homeGoals+":"+m.awayGoals:"";TextView teams=text(m.home+" — "+m.away+score,17,TEXT,true);teams.setPadding(0,dp(7),0,dp(3));c.addView(teams);TextView src=text("КФ: "+(m.oddsSource.isEmpty()?"—":m.oddsSource),10,MUTED,false);src.setPadding(0,0,0,dp(6));c.addView(src);LinearLayout mt=new LinearLayout(this);mt.setWeightSum(2);Button full=smallTab("МАТЧ",true),first=smallTab("1-Й ТАЙМ",false);mt.addView(full,new LinearLayout.LayoutParams(0,dp(40),1));mt.addView(first,new LinearLayout.LayoutParams(0,dp(40),1));c.addView(mt);LinearLayout host=vertical();host.addView(fullMarket(m));c.addView(host);full.setOnClickListener(v->{host.removeAllViews();host.addView(fullMarket(m));full.setBackground(roundRect(ACCENT,10));first.setBackground(roundRect(CARD2,10));});first.setOnClickListener(v->{host.removeAllViews();host.addView(firstMarket(m));first.setBackground(roundRect(ACCENT,10));full.setBackground(roundRect(CARD2,10));});TextView det=text("Статистика",13,ACCENT,true);det.setGravity(Gravity.CENTER);det.setPadding(0,dp(10),0,dp(3));c.addView(det);det.setOnClickListener(v->toggleStats(c,det,m));return c;}
    private View fullMarket(Match m){LinearLayout b=vertical();b.setPadding(0,dp(8),0,0);b.addView(outcomes(m.p1,m.px,m.p2,m.o1,m.ox,m.o2));addTotal(b,"ТОТАЛ 2.5","ТБ 2.5",m.over25,m.oOver25,"ТМ 2.5",m.under25,m.oUnder25);addTotal(b,"ТОТАЛ 1.5","ТБ 1.5",m.over15,m.oOver15,"ТМ 1.5",m.under15,m.oUnder15);return b;}
    private View firstMarket(Match m){LinearLayout b=vertical();b.setPadding(0,dp(8),0,0);b.addView(outcomes(m.h1p1,m.h1px,m.h1p2,m.h1o1,m.h1ox,m.h1o2));addTotal(b,"1-Й ТАЙМ · ТОТАЛ 0.5","ТБ 0.5",m.h1Over05,m.h1OOver05,"ТМ 0.5",m.h1Under05,m.h1OUnder05);addTotal(b,"1-Й ТАЙМ · ТОТАЛ 1.5","ТБ 1.5",m.h1Over15,m.h1OOver15,"ТМ 1.5",m.h1Under15,m.h1OUnder15);return b;}
    private View outcomes(int a,int b,int c,double oa,double ob,double oc){LinearLayout r=new LinearLayout(this);r.setWeightSum(3);r.addView(probBox("П1",a,oa,false),new LinearLayout.LayoutParams(0,dp(66),1));r.addView(probBox("X",b,ob,false),new LinearLayout.LayoutParams(0,dp(66),1));r.addView(probBox("П2",c,oc,false),new LinearLayout.LayoutParams(0,dp(66),1));return r;}
    private void addTotal(LinearLayout p,String title,String la,int lp,double lo,String ra,int rp,double ro){TextView t=text(title,11,MUTED,true);t.setPadding(0,dp(10),0,dp(4));p.addView(t);LinearLayout r=new LinearLayout(this);r.setWeightSum(2);boolean lg=lp>=58&&lp>rp,rg=rp>=58&&rp>lp;r.addView(probBox(la,lp,lo,lg),new LinearLayout.LayoutParams(0,dp(66),1));r.addView(probBox(ra,rp,ro,rg),new LinearLayout.LayoutParams(0,dp(66),1));p.addView(r);}
    private View probBox(String lab,int p,double o,boolean hi){LinearLayout b=vertical();b.setGravity(Gravity.CENTER);b.setBackground(roundRect(hi?GREEN:CARD2,11));b.addView(text(lab,12,hi?Color.WHITE:MUTED,true));String ps=p<0?"—":p+"%",os=o<=1?"—":String.format(Locale.US,"%.2f",o);b.addView(text(ps+" ("+os+")",15,Color.WHITE,true));return b;}
    private void toggleStats(LinearLayout c,TextView ctl,Match m){Object tag=ctl.getTag();if(tag instanceof View){c.removeView((View)tag);ctl.setTag(null);return;}LinearLayout b=vertical();b.setPadding(dp(10),dp(8),dp(10),dp(8));b.setBackground(roundRect(CARD2,10));b.addView(stat("Удары",m.shots));b.addView(stat("В створ",m.shotsOn));b.addView(stat("Владение",m.possession));b.addView(stat("xG",m.xg));c.addView(b);ctl.setTag(b);}
    private View stat(String a,String b){LinearLayout r=new LinearLayout(this);TextView l=text(a,12,MUTED,false),v=text(b==null?"—":b,12,TEXT,true);r.addView(l,new LinearLayout.LayoutParams(0,-2,1));r.addView(v);return r;}

    private String safeMsg(Exception ex){String m=ex.getMessage();return(m==null||m.trim().isEmpty())?ex.getClass().getSimpleName():m;}
    private String host(String u){try{return new URL(u).getHost();}catch(Exception e){return"источник";}}
    private String enc(String s){try{return URLEncoder.encode(s,"UTF-8");}catch(Exception e){return s;}}
    private double num(JSONObject o,String k){Object v=o.opt(k);if(v==null)return 0;try{return Double.parseDouble(String.valueOf(v));}catch(Exception e){return 0;}}
    private String norm(String s){return s==null?"":s.toLowerCase(Locale.ROOT).replaceAll("[^a-zа-я0-9]","");}
    private boolean similar(String a,String b){return a.equals(b)||(a.length()>4&&b.contains(a))||(b.length()>4&&a.contains(b));}
    private long parseIso(String s){try{SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX",Locale.US);Date d=f.parse(s);return d==null?0:d.getTime()/1000;}catch(Exception e){return 0;}}
    private String formatTime(long ts){if(ts<=0)return"—";SimpleDateFormat f=new SimpleDateFormat("HH:mm",Locale.getDefault());return f.format(new Date(ts*1000));}
    private LinearLayout vertical(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private Button tabButton(String s,boolean on){Button b=new Button(this);b.setText(s);b.setTextColor(Color.WHITE);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setBackground(roundRect(on?ACCENT:CARD,12));return b;}
    private Button smallTab(String s,boolean on){Button b=tabButton(s,on);b.setTextSize(11);return b;}
    private TextView text(String s,float z,int c,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}
    private GradientDrawable roundRect(int c,int r){GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(dp(r));return d;}
    private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}

    static class Match{
        long id,startTimestamp,oddsEventId=-1;String league,home,away,shots="—",shotsOn="—",possession="—",xg="—",oddsSource="";int minute=0,homeGoals=-1,awayGoals=-1,h1HomeGoals=-1,h1AwayGoals=-1;
        int p1=-1,px=-1,p2=-1,over25=-1,under25=-1,over15=-1,under15=-1,h1p1=-1,h1px=-1,h1p2=-1,h1Over05=-1,h1Under05=-1,h1Over15=-1,h1Under15=-1;
        double o1,ox,o2,oOver25,oUnder25,oOver15,oUnder15,h1o1,h1ox,h1o2,h1OOver05,h1OUnder05,h1OOver15,h1OUnder15;
    }
}
