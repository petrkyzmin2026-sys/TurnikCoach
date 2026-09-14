package ru.matchstats.app;

import android.app.Activity;
import android.app.AlertDialog;
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
    private static final String SOFA="https://api.sofascore.com/api/v1";
    private static final String APIF="https://v3.football.api-sports.io";
    private static final String PREFS="denzl_prefs", KEY_APIF="api_football_key";
    private static final int BG=Color.rgb(10,15,20),CARD=Color.rgb(20,28,36),CARD2=Color.rgb(26,36,46),TEXT=Color.rgb(240,244,247),MUTED=Color.rgb(145,157,169),GREEN=Color.rgb(38,166,91),ACCENT=Color.rgb(64,145,255),RED=Color.rgb(220,80,80),AMBER=Color.rgb(225,155,45);

    private final ExecutorService io=Executors.newFixedThreadPool(4);
    private final AtomicBoolean loading=new AtomicBoolean(false);
    private final List<Match> lineMatches=new ArrayList<>(), liveMatches=new ArrayList<>();
    private boolean liveMode=false;
    private String statusText="Загрузка реальных событий…", sourceText="";

    @Override protected void onCreate(Bundle b){super.onCreate(b);render();loadMatches(false);}
    @Override protected void onDestroy(){io.shutdownNow();super.onDestroy();}

    private String apiKey(){return getSharedPreferences(PREFS,MODE_PRIVATE).getString(KEY_APIF,"").trim();}
    private void showApiKeyDialog(){
        EditText input=new EditText(this);input.setHint("API-Football key");input.setSingleLine(true);input.setText(apiKey());
        LinearLayout box=new LinearLayout(this);int p=dp(20);box.setPadding(p,p/2,p,p/2);box.addView(input,new LinearLayout.LayoutParams(-1,-2));
        new AlertDialog.Builder(this).setTitle("API-FOOTBALL").setMessage("Ключ хранится только на этом телефоне.").setView(box)
                .setPositiveButton("СОХРАНИТЬ",(d,w)->{getSharedPreferences(PREFS,MODE_PRIVATE).edit().putString(KEY_APIF,input.getText().toString().trim()).apply();statusText=apiKey().isEmpty()?"Ключ API-Football не задан":"Ключ API-Football сохранён";render();})
                .setNegativeButton("ОТМЕНА",null).show();
    }

    private void loadMatches(boolean live){
        if(!loading.compareAndSet(false,true))return;
        statusText=live?"Обновление LIVE…":"Загрузка линии…";sourceText="";render();
        io.execute(()->{
            List<Match> out=new ArrayList<>();String error="";boolean sofaOk=false;
            try{out=loadSofa(live);sofaOk=true;sourceText="SofaScore";}catch(Exception ex){error=err(ex,"SofaScore");}
            String key=apiKey();
            try{
                if(out.isEmpty()&&!key.isEmpty()){out=loadApiFootballFixtures(live,key);sourceText="API-Football (резерв)";}
                if(!out.isEmpty()&&!key.isEmpty()){enrichApiFootballOdds(out,live,key);if(sofaOk)sourceText="SofaScore + API-Football";}
            }catch(Exception ex){if(out.isEmpty())error+=(error.isEmpty()?"":" · ")+err(ex,"API-Football");}
            final List<Match> result=out;final String finalError=error;
            runOnUiThread(()->{
                List<Match> target=live?liveMatches:lineMatches;target.clear();target.addAll(result);
                if(result.isEmpty()) statusText=!finalError.isEmpty()?finalError+(apiKey().isEmpty()?" · задайте ключ API-Football":""):(live?"Сейчас нет футбольных матчей LIVE":"На сегодня будущие матчи не получены");
                else statusText=(live?"LIVE: ":"ЛИНИЯ: ")+result.size()+" матчей · "+sourceText;
                loading.set(false);render();
            });
        });
    }

    private List<Match> loadSofa(boolean live)throws Exception{
        String endpoint=live?SOFA+"/sport/football/events/live":SOFA+"/sport/football/scheduled-events/"+today();
        JSONObject root=getJson(endpoint,null);JSONArray events=root.optJSONArray("events");List<Match> out=new ArrayList<>();if(events==null)return out;
        for(int i=0;i<events.length()&&out.size()<40;i++){
            JSONObject e=events.optJSONObject(i);if(e==null)continue;JSONObject st=e.optJSONObject("status");String type=st==null?"":st.optString("type","");
            if(!live&&!("notstarted".equals(type)||"scheduled".equals(type)))continue;
            if(live&&("finished".equals(type)||"canceled".equals(type)||"postponed".equals(type)))continue;
            Match m=parseSofa(e,live);if(m==null)continue;
            try{applySofaOdds(m,getJson(SOFA+"/event/"+m.id+"/odds/1/all",null));}catch(Exception ignored){}
            if(live)try{applySofaStats(m,getJson(SOFA+"/event/"+m.id+"/statistics",null));}catch(Exception ignored){}
            out.add(m);
        }
        return out;
    }

    private Match parseSofa(JSONObject e,boolean live){
        long id=e.optLong("id",-1);JSONObject h=e.optJSONObject("homeTeam"),a=e.optJSONObject("awayTeam");if(id<0||h==null||a==null)return null;
        Match m=new Match();m.id=id;m.home=h.optString("name","—");m.away=a.optString("name","—");JSONObject t=e.optJSONObject("tournament");String league=t==null?"Футбол":t.optString("name","Футбол");JSONObject cat=t==null?null:t.optJSONObject("category");m.league=cat==null?league:cat.optString("name","")+" · "+league;m.startTimestamp=e.optLong("startTimestamp",0);
        JSONObject hs=e.optJSONObject("homeScore"),as=e.optJSONObject("awayScore");m.homeGoals=hs==null?-1:hs.optInt("current",-1);m.awayGoals=as==null?-1:as.optInt("current",-1);
        if(live){JSONObject tm=e.optJSONObject("time");long s=tm==null?0:tm.optLong("currentPeriodStartTimestamp",0);JSONObject st=e.optJSONObject("status");String p=st==null?"":st.optString("period","");if(s>0){int el=(int)((System.currentTimeMillis()/1000-s)/60);m.minute=p.contains("2")?Math.min(120,45+Math.max(0,el)):Math.min(60,Math.max(0,el));}}
        return m;
    }

    private List<Match> loadApiFootballFixtures(boolean live,String key)throws Exception{
        JSONObject root=getJson(live?APIF+"/fixtures?live=all":APIF+"/fixtures?date="+today(),key);JSONArray arr=root.optJSONArray("response");List<Match> out=new ArrayList<>();if(arr==null)return out;
        long now=System.currentTimeMillis()/1000;
        for(int i=0;i<arr.length()&&out.size()<40;i++){
            JSONObject o=arr.optJSONObject(i);if(o==null)continue;JSONObject fx=o.optJSONObject("fixture"),teams=o.optJSONObject("teams"),league=o.optJSONObject("league"),goals=o.optJSONObject("goals");if(fx==null||teams==null)continue;JSONObject st=fx.optJSONObject("status");String shortSt=st==null?"":st.optString("short","");
            if(!live&&!("NS".equals(shortSt)||"TBD".equals(shortSt)))continue;
            if(live&&(shortSt.equals("FT")||shortSt.equals("AET")||shortSt.equals("PEN")||shortSt.equals("PST")||shortSt.equals("CANC")))continue;
            JSONObject home=teams.optJSONObject("home"),away=teams.optJSONObject("away");if(home==null||away==null)continue;Match m=new Match();m.apiFootballId=fx.optLong("id",-1);m.home=home.optString("name","—");m.away=away.optString("name","—");m.league=league==null?"Футбол":league.optString("country","")+" · "+league.optString("name","Футбол");m.startTimestamp=fx.optLong("timestamp",0);if(!live&&m.startTimestamp>0&&m.startTimestamp<now-60)continue;m.minute=st==null?0:st.optInt("elapsed",0);m.homeGoals=goals==null?-1:goals.optInt("home",-1);m.awayGoals=goals==null?-1:goals.optInt("away",-1);out.add(m);
        }
        return out;
    }

    private void enrichApiFootballOdds(List<Match> matches,boolean live,String key)throws Exception{
        List<Match> fixtures=loadApiFootballFixtures(live,key);int calls=0;
        for(Match m:matches){if(calls>=12)break;Match f=findMatch(m,fixtures);if(f==null||f.apiFootballId<0)continue;m.apiFootballId=f.apiFootballId;
            try{JSONObject root=getJson(APIF+(live?"/odds/live?fixture=":"/odds?fixture=")+m.apiFootballId,key);if(live)applyApiFootballLiveOdds(m,root);else applyApiFootballPrematchOdds(m,root);calls++;}catch(Exception ignored){}
        }
    }

    private Match findMatch(Match m,List<Match> list){String h=norm(m.home),a=norm(m.away);for(Match x:list){String xh=norm(x.home),xa=norm(x.away);if((xh.equals(h)&&xa.equals(a))||(similar(xh,h)&&similar(xa,a)))return x;}return null;}
    private boolean similar(String a,String b){return a.length()>4&&b.length()>4&&(a.contains(b)||b.contains(a));}
    private String norm(String s){return s==null?"":s.toLowerCase(Locale.ROOT).replaceAll("[^a-zа-я0-9]","");}

    private void applyApiFootballPrematchOdds(Match m,JSONObject root){
        JSONArray resp=root.optJSONArray("response");if(resp==null)return;
        for(int r=0;r<resp.length();r++){JSONObject entry=resp.optJSONObject(r);JSONArray books=entry==null?null:entry.optJSONArray("bookmakers");if(books==null)continue;for(int b=0;b<books.length();b++){JSONObject book=books.optJSONObject(b);JSONArray bets=book==null?null:book.optJSONArray("bets");if(bets==null)continue;parseBetArray(m,bets,false);if(m.hasFullMarket())return;}}
    }

    private void applyApiFootballLiveOdds(Match m,JSONObject root){
        JSONArray resp=root.optJSONArray("response");if(resp==null)return;
        for(int r=0;r<resp.length();r++){
            JSONObject entry=resp.optJSONObject(r);if(entry==null)continue;
            JSONArray bets=entry.optJSONArray("odds");
            if(bets==null)bets=entry.optJSONArray("bets");
            if(bets!=null)parseBetArray(m,bets,true);
            JSONArray books=entry.optJSONArray("bookmakers");
            if(books!=null)for(int b=0;b<books.length();b++){JSONObject book=books.optJSONObject(b);JSONArray bb=book==null?null:book.optJSONArray("bets");if(bb!=null)parseBetArray(m,bb,true);}
            if(m.hasAnyOdds())return;
        }
    }

    private void parseBetArray(Match m,JSONArray bets,boolean live){
        for(int i=0;i<bets.length();i++){
            JSONObject bet=bets.optJSONObject(i);if(bet==null)continue;String name=bet.optString("name","").toLowerCase(Locale.ROOT);JSONArray vals=bet.optJSONArray("values");if(vals==null)continue;boolean h1=name.contains("1st half")||name.contains("first half")||name.contains("half time");
            if(!h1&&(name.contains("match winner")||name.contains("1x2")||name.equals("winner")||name.contains("winner 1x2")))applyThreeWay(m,vals,false);
            else if(h1&&(name.contains("winner")||name.contains("1x2")||name.contains("result")))applyThreeWay(m,vals,true);
            if(!h1&&(name.contains("over/under")||name.contains("total")||name.contains("goals"))){applyTotal(m,vals,"2.5",false,25);applyTotal(m,vals,"1.5",false,15);}
            if(h1&&(name.contains("over/under")||name.contains("total")||name.contains("goals"))){applyTotal(m,vals,"0.5",true,5);applyTotal(m,vals,"1.5",true,15);}
        }
    }

    private void applyThreeWay(Match m,JSONArray vals,boolean h1){double[] o={0,0,0};for(int i=0;i<vals.length();i++){JSONObject v=vals.optJSONObject(i);if(v==null||v.optBoolean("suspended",false))continue;String n=v.optString("value","").trim().toLowerCase(Locale.ROOT);double odd=num(v.optString("odd","0"));if(n.equals("home")||n.equals("1")||n.contains("home"))o[0]=odd;else if(n.equals("draw")||n.equals("x"))o[1]=odd;else if(n.equals("away")||n.equals("2")||n.contains("away"))o[2]=odd;}if(h1){if(o[0]>1)m.h1o1=o[0];if(o[1]>1)m.h1ox=o[1];if(o[2]>1)m.h1o2=o[2];fair3(m,new double[]{m.h1o1,m.h1ox,m.h1o2},true);}else{if(o[0]>1)m.o1=o[0];if(o[1]>1)m.ox=o[1];if(o[2]>1)m.o2=o[2];fair3(m,new double[]{m.o1,m.ox,m.o2},false);}}

    private void applyTotal(Match m,JSONArray vals,String line,boolean h1,int code){double over=0,under=0;for(int i=0;i<vals.length();i++){JSONObject v=vals.optJSONObject(i);if(v==null||v.optBoolean("suspended",false))continue;String n=v.optString("value","").toLowerCase(Locale.ROOT);String handicap=v.optString("handicap","");boolean lineOk=n.contains(line)||handicap.equals(line)||handicap.equals(line.replace(".0",""));if(!lineOk)continue;double odd=num(v.optString("odd","0"));if(n.contains("over"))over=odd;if(n.contains("under"))under=odd;}if(h1&&code==5){if(over>1)m.h1OOver05=over;if(under>1)m.h1OUnder05=under;fair2(m,new double[]{m.h1OOver05,m.h1OUnder05},5,true);}else if(h1){if(over>1)m.h1OOver15=over;if(under>1)m.h1OUnder15=under;fair2(m,new double[]{m.h1OOver15,m.h1OUnder15},15,true);}else if(code==25){if(over>1)m.oOver25=over;if(under>1)m.oUnder25=under;fair2(m,new double[]{m.oOver25,m.oUnder25},25,false);}else{if(over>1)m.oOver15=over;if(under>1)m.oUnder15=under;fair2(m,new double[]{m.oOver15,m.oUnder15},15,false);}}

    private JSONObject getJson(String url,String key)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(8000);c.setReadTimeout(10000);c.setRequestMethod("GET");c.setRequestProperty("Accept","application/json");c.setRequestProperty("User-Agent","Mozilla/5.0 (Android) DENZL/0.8");if(key!=null&&!key.isEmpty())c.setRequestProperty("x-apisports-key",key);int code=c.getResponseCode();if(code<200||code>=300)throw new Exception("HTTP "+code+" · "+new URL(url).getHost());BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream()));StringBuilder sb=new StringBuilder();String s;while((s=r.readLine())!=null)sb.append(s);r.close();c.disconnect();JSONObject j=new JSONObject(sb.toString());Object errors=j.opt("errors");if(errors instanceof JSONObject&&((JSONObject)errors).length()>0)throw new Exception("API: "+errors);if(errors instanceof JSONArray&&((JSONArray)errors).length()>0)throw new Exception("API: "+errors);return j;
    }

    private void applySofaOdds(Match m,JSONObject root){JSONArray markets=root.optJSONArray("markets");if(markets==null)return;for(int i=0;i<markets.length();i++){JSONObject mk=markets.optJSONObject(i);if(mk==null)continue;String n=mk.optString("marketName","").toLowerCase(Locale.ROOT);JSONArray ch=mk.optJSONArray("choices");if(ch==null)continue;boolean h1=n.contains("1st half")||n.contains("first half");if((n.equals("full time")||n.contains("match result"))&&!h1){double[]o=choiceOdds(ch);m.o1=o[0];m.ox=o[1];m.o2=o[2];fair3(m,o,false);}else if(h1&&(n.contains("result")||n.contains("1x2")||n.contains("half time"))){double[]o=choiceOdds(ch);m.h1o1=o[0];m.h1ox=o[1];m.h1o2=o[2];fair3(m,o,true);}if(!h1&&n.contains("2.5")){double[]o=overUnder(ch,"2.5");m.oOver25=o[0];m.oUnder25=o[1];fair2(m,o,25,false);}if(!h1&&n.contains("1.5")){double[]o=overUnder(ch,"1.5");m.oOver15=o[0];m.oUnder15=o[1];fair2(m,o,15,false);}if(h1&&n.contains("0.5")){double[]o=overUnder(ch,"0.5");m.h1OOver05=o[0];m.h1OUnder05=o[1];fair2(m,o,5,true);}if(h1&&n.contains("1.5")){double[]o=overUnder(ch,"1.5");m.h1OOver15=o[0];m.h1OUnder15=o[1];fair2(m,o,15,true);}}}
    private double[] choiceOdds(JSONArray ch){double[]o={0,0,0};for(int i=0;i<ch.length();i++){JSONObject x=ch.optJSONObject(i);if(x==null)continue;String n=x.optString("name","").trim().toLowerCase(Locale.ROOT);double d=decimalOdds(x);if(n.equals("1"))o[0]=d;else if(n.equals("x"))o[1]=d;else if(n.equals("2"))o[2]=d;}return o;}
    private double[] overUnder(JSONArray ch,String line){double[]o={0,0};for(int i=0;i<ch.length();i++){JSONObject x=ch.optJSONObject(i);if(x==null)continue;String n=x.optString("name","").toLowerCase(Locale.ROOT);if(!n.contains(line)&&ch.length()>2)continue;double d=decimalOdds(x);if(n.contains("over")||n.contains("тб"))o[0]=d;if(n.contains("under")||n.contains("тм"))o[1]=d;}return o;}
    private double decimalOdds(JSONObject x){double d=x.optDouble("decimalValue",0);if(d>1)return d;String f=x.optString("fractionalValue","");try{String[]p=f.split("/");if(p.length==2)return 1+Double.parseDouble(p[0])/Double.parseDouble(p[1]);}catch(Exception ignored){}return 0;}
    private void fair3(Match m,double[]o,boolean h1){if(o[0]<=1||o[1]<=1||o[2]<=1)return;double a=1/o[0],b=1/o[1],c=1/o[2],s=a+b+c;int p1=(int)Math.round(a/s*100),px=(int)Math.round(b/s*100),p2=100-p1-px;if(h1){m.h1p1=p1;m.h1px=px;m.h1p2=p2;}else{m.p1=p1;m.px=px;m.p2=p2;}}
    private void fair2(Match m,double[]o,int code,boolean h1){if(o[0]<=1||o[1]<=1)return;double a=1/o[0],b=1/o[1],s=a+b;int over=(int)Math.round(a/s*100),under=100-over;if(h1&&code==5){m.h1Over05=over;m.h1Under05=under;}else if(h1){m.h1Over15=over;m.h1Under15=under;}else if(code==25){m.over25=over;m.under25=under;}else{m.over15=over;m.under15=under;}}
    private void applySofaStats(Match m,JSONObject root){JSONArray ps=root.optJSONArray("statistics");if(ps==null)return;for(int i=0;i<ps.length();i++){JSONObject p=ps.optJSONObject(i);if(p==null||!"ALL".equals(p.optString("period","")))continue;JSONArray gs=p.optJSONArray("groups");if(gs==null)continue;for(int g=0;g<gs.length();g++){JSONObject go=gs.optJSONObject(g);JSONArray its=go==null?null:go.optJSONArray("statisticsItems");if(its==null)continue;for(int k=0;k<its.length();k++){JSONObject it=its.optJSONObject(k);if(it==null)continue;String key=it.optString("key","");String val=it.optString("home","—")+" — "+it.optString("away","—");if(key.equals("ballPossession"))m.possession=val;if(key.equals("shotsOnGoal"))m.shotsOn=val;if(key.equals("totalShots")||key.equals("totalShotsOnGoal"))m.shots=val;if(key.toLowerCase(Locale.ROOT).contains("expectedgoals"))m.xg=val;}}}}

    private void render(){
        LinearLayout root=vertical();root.setBackgroundColor(BG);root.setPadding(dp(14),dp(12),dp(14),dp(12));root.addView(text("DENZL",26,TEXT,true));TextView sub=text("ЛИНИЯ отдельно · LIVE отдельно · вероятность % + коэффициент",12,MUTED,false);sub.setPadding(0,0,0,dp(10));root.addView(sub);
        LinearLayout tabs=new LinearLayout(this);tabs.setWeightSum(2);Button line=tabButton("ЛИНИЯ",!liveMode),live=tabButton("LIVE",liveMode);tabs.addView(line,new LinearLayout.LayoutParams(0,dp(48),1));tabs.addView(live,new LinearLayout.LayoutParams(0,dp(48),1));root.addView(tabs);line.setOnClickListener(v->{liveMode=false;loadMatches(false);});live.setOnClickListener(v->{liveMode=true;loadMatches(true);});
        Button key=new Button(this);key.setText(apiKey().isEmpty()?"ЗАДАТЬ КЛЮЧ API-FOOTBALL":"API-FOOTBALL: КЛЮЧ СОХРАНЁН");key.setTextColor(Color.WHITE);key.setTypeface(Typeface.DEFAULT,Typeface.BOLD);key.setBackground(roundRect(CARD2,12));LinearLayout.LayoutParams kp=new LinearLayout.LayoutParams(-1,dp(44));kp.setMargins(0,dp(8),0,0);root.addView(key,kp);key.setOnClickListener(v->showApiKeyDialog());
        if(liveMode){Button refresh=new Button(this);refresh.setText(loading.get()?"ОБНОВЛЕНИЕ…":"ОБНОВИТЬ LIVE");refresh.setEnabled(!loading.get());refresh.setTextColor(Color.WHITE);refresh.setTypeface(Typeface.DEFAULT,Typeface.BOLD);refresh.setBackground(roundRect(ACCENT,12));LinearLayout.LayoutParams rp=new LinearLayout.LayoutParams(-1,dp(46));rp.setMargins(0,dp(8),0,0);root.addView(refresh,rp);refresh.setOnClickListener(v->loadMatches(true));}
        TextView state=text(statusText,12,loading.get()?ACCENT:(statusText.toLowerCase(Locale.ROOT).contains("ошиб")?RED:GREEN),true);state.setGravity(Gravity.CENTER);state.setPadding(0,dp(8),0,dp(2));root.addView(state);
        ScrollView scroll=new ScrollView(this);LinearLayout list=vertical();for(Match m:(liveMode?liveMatches:lineMatches))list.addView(matchCard(m));scroll.addView(list);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));TextView note=text("SofaScore — основной источник. API-Football — резерв и LIVE-коэффициенты. Матчи LIVE не скрываются по минуте.",10,MUTED,false);note.setPadding(0,dp(6),0,0);root.addView(note);setContentView(root);
    }

    private View matchCard(Match m){
        LinearLayout c=vertical();c.setPadding(dp(12),dp(10),dp(12),dp(10));c.setBackground(roundRect(CARD,16));LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.setMargins(0,dp(9),0,0);c.setLayoutParams(cp);
        LinearLayout top=new LinearLayout(this);TextView l=text(m.league,11,MUTED,false);String minuteText=m.minute>0?m.minute+"'":formatTime(m.startTimestamp);int mc=liveMode&&m.minute>=80?AMBER:(m.minute>0?GREEN:MUTED);TextView tm=text(minuteText,11,mc,true);top.addView(l,new LinearLayout.LayoutParams(0,-2,1));top.addView(tm);c.addView(top);
        String score=(m.homeGoals>=0&&m.awayGoals>=0)?"   "+m.homeGoals+":"+m.awayGoals:"";TextView teams=text(m.home+" — "+m.away+score,17,TEXT,true);teams.setPadding(0,dp(7),0,dp(5));c.addView(teams);
        if(liveMode&&m.minute>=80){TextView late=text("ПОЗДНИЙ LIVE",10,AMBER,true);late.setPadding(0,0,0,dp(5));c.addView(late);}
        if(liveMode&&!m.hasAnyOdds()){TextView no=text("LIVE-коэффициенты по этому матчу источник сейчас не отдал",11,MUTED,false);no.setPadding(0,0,0,dp(5));c.addView(no);}
        LinearLayout mt=new LinearLayout(this);mt.setWeightSum(2);Button full=smallTab("МАТЧ",true),first=smallTab("1-Й ТАЙМ",false);mt.addView(full,new LinearLayout.LayoutParams(0,dp(40),1));mt.addView(first,new LinearLayout.LayoutParams(0,dp(40),1));c.addView(mt);LinearLayout host=vertical();host.addView(fullMarket(m));c.addView(host);full.setOnClickListener(v->{host.removeAllViews();host.addView(fullMarket(m));full.setBackground(roundRect(ACCENT,10));first.setBackground(roundRect(CARD2,10));});first.setOnClickListener(v->{host.removeAllViews();host.addView(firstMarket(m));first.setBackground(roundRect(ACCENT,10));full.setBackground(roundRect(CARD2,10));});TextView det=text("Статистика",13,ACCENT,true);det.setGravity(Gravity.CENTER);det.setPadding(0,dp(10),0,dp(3));c.addView(det);det.setOnClickListener(v->toggleStats(c,det,m));return c;
    }

    private View fullMarket(Match m){LinearLayout b=vertical();b.setPadding(0,dp(8),0,0);b.addView(outcomes(m.p1,m.px,m.p2,m.o1,m.ox,m.o2));addTotal(b,"ТОТАЛ 2.5","ТБ 2.5",m.over25,m.oOver25,"ТМ 2.5",m.under25,m.oUnder25);addTotal(b,"ТОТАЛ 1.5","ТБ 1.5",m.over15,m.oOver15,"ТМ 1.5",m.under15,m.oUnder15);return b;}
    private View firstMarket(Match m){LinearLayout b=vertical();b.setPadding(0,dp(8),0,0);if(liveMode&&m.minute>45){TextView done=text("1-Й ТАЙМ ЗАВЕРШЁН",12,MUTED,true);done.setGravity(Gravity.CENTER);done.setPadding(0,dp(8),0,dp(8));b.addView(done);}b.addView(outcomes(m.h1p1,m.h1px,m.h1p2,m.h1o1,m.h1ox,m.h1o2));addTotal(b,"1-Й ТАЙМ · ТОТАЛ 0.5","ТБ 0.5",m.h1Over05,m.h1OOver05,"ТМ 0.5",m.h1Under05,m.h1OUnder05);addTotal(b,"1-Й ТАЙМ · ТОТАЛ 1.5","ТБ 1.5",m.h1Over15,m.h1OOver15,"ТМ 1.5",m.h1Under15,m.h1OUnder15);return b;}
    private View outcomes(int a,int b,int c,double oa,double ob,double oc){LinearLayout r=new LinearLayout(this);r.setWeightSum(3);r.addView(probBox("П1",a,oa,false),new LinearLayout.LayoutParams(0,dp(66),1));r.addView(probBox("X",b,ob,false),new LinearLayout.LayoutParams(0,dp(66),1));r.addView(probBox("П2",c,oc,false),new LinearLayout.LayoutParams(0,dp(66),1));return r;}
    private void addTotal(LinearLayout p,String title,String la,int lp,double lo,String ra,int rp,double ro){TextView t=text(title,11,MUTED,true);t.setPadding(0,dp(10),0,dp(4));p.addView(t);LinearLayout r=new LinearLayout(this);r.setWeightSum(2);boolean lg=lp>=58&&lp>rp,rg=rp>=58&&rp>lp;r.addView(probBox(la,lp,lo,lg),new LinearLayout.LayoutParams(0,dp(66),1));r.addView(probBox(ra,rp,ro,rg),new LinearLayout.LayoutParams(0,dp(66),1));p.addView(r);}
    private View probBox(String lab,int p,double o,boolean hi){LinearLayout b=vertical();b.setGravity(Gravity.CENTER);b.setBackground(roundRect(hi?GREEN:CARD2,11));b.addView(text(lab,12,hi?Color.WHITE:MUTED,true));String ps=p<0?"—":p+"%",os=o<=1?"—":String.format(Locale.US,"%.2f",o);b.addView(text(ps+" ("+os+")",15,Color.WHITE,true));return b;}
    private void toggleStats(LinearLayout c,TextView ctl,Match m){Object tag=ctl.getTag();if(tag instanceof View){c.removeView((View)tag);ctl.setTag(null);return;}LinearLayout b=vertical();b.setPadding(dp(10),dp(8),dp(10),dp(8));b.setBackground(roundRect(CARD2,10));b.addView(stat("Удары",m.shots));b.addView(stat("В створ",m.shotsOn));b.addView(stat("Владение",m.possession));b.addView(stat("xG",m.xg));c.addView(b);ctl.setTag(b);}
    private View stat(String a,String b){LinearLayout r=new LinearLayout(this);TextView l=text(a,12,MUTED,false),v=text(b==null?"—":b,12,TEXT,true);r.addView(l,new LinearLayout.LayoutParams(0,-2,1));r.addView(v);return r;}

    private String err(Exception ex,String src){String m=ex.getMessage();return src+": "+(m==null?ex.getClass().getSimpleName():m);}
    private double num(String s){try{return Double.parseDouble(s.replace(',','.'));}catch(Exception e){return 0;}}
    private String today(){SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd",Locale.US);f.setTimeZone(TimeZone.getDefault());return f.format(new Date());}
    private String formatTime(long ts){if(ts<=0)return"—";SimpleDateFormat f=new SimpleDateFormat("HH:mm",Locale.getDefault());return f.format(new Date(ts*1000));}
    private LinearLayout vertical(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private Button tabButton(String s,boolean on){Button b=new Button(this);b.setText(s);b.setTextColor(Color.WHITE);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setBackground(roundRect(on?ACCENT:CARD,12));return b;}
    private Button smallTab(String s,boolean on){Button b=tabButton(s,on);b.setTextSize(12);return b;}
    private TextView text(String s,float z,int c,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}
    private GradientDrawable roundRect(int c,int r){GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(dp(r));return d;}
    private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}

    static class Match{
        long id=-1,apiFootballId=-1,startTimestamp;String league,home,away,shots="—",shotsOn="—",possession="—",xg="—";int minute=0,homeGoals=-1,awayGoals=-1;
        int p1=-1,px=-1,p2=-1,over25=-1,under25=-1,over15=-1,under15=-1,h1p1=-1,h1px=-1,h1p2=-1,h1Over05=-1,h1Under05=-1,h1Over15=-1,h1Under15=-1;
        double o1,ox,o2,oOver25,oUnder25,oOver15,oUnder15,h1o1,h1ox,h1o2,h1OOver05,h1OUnder05,h1OOver15,h1OUnder15;
        boolean hasAnyOdds(){return o1>1||ox>1||o2>1||oOver25>1||oUnder25>1||oOver15>1||oUnder15>1||h1o1>1||h1OOver05>1;}
        boolean hasFullMarket(){return o1>1&&ox>1&&o2>1&&oOver25>1&&oUnder25>1;}
    }
}
