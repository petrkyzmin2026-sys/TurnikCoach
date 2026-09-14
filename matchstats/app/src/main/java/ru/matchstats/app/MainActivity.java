package ru.matchstats.app;

import android.app.Activity;
import android.app.AlertDialog;
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

    private final ExecutorService io=Executors.newFixedThreadPool(5);
    private final AtomicBoolean loading=new AtomicBoolean(false);
    private final List<Match> lineMatches=new ArrayList<>(),liveMatches=new ArrayList<>();
    private boolean liveMode=false;
    private String statusText="Загрузка событий…",sourceText="";

    @Override protected void onCreate(Bundle b){super.onCreate(b);render();loadMatches(false);}
    @Override protected void onDestroy(){io.shutdownNow();super.onDestroy();}

    private String apiKey(){return getSharedPreferences(PREFS,MODE_PRIVATE).getString(KEY_APIF,"").trim();}
    private void showApiKeyDialog(){
        EditText input=new EditText(this);input.setHint("API-Football key — необязательно");input.setSingleLine(true);input.setText(apiKey());
        LinearLayout box=new LinearLayout(this);int p=dp(20);box.setPadding(p,p/2,p,p/2);box.addView(input,new LinearLayout.LayoutParams(-1,-2));
        new AlertDialog.Builder(this).setTitle("РЫНОК — НЕОБЯЗАТЕЛЬНО")
                .setMessage("DENZL работает без ключа. Ключ нужен только для дополнительного сравнения с букмекерским рынком и хранится на телефоне.")
                .setView(box)
                .setPositiveButton("СОХРАНИТЬ",(d,w)->{getSharedPreferences(PREFS,MODE_PRIVATE).edit().putString(KEY_APIF,input.getText().toString().trim()).apply();statusText=apiKey().isEmpty()?"Рынок отключён — расчёт DENZL работает":"Рыночный контроль включён";render();})
                .setNeutralButton("УДАЛИТЬ КЛЮЧ",(d,w)->{getSharedPreferences(PREFS,MODE_PRIVATE).edit().remove(KEY_APIF).apply();statusText="Рынок отключён — расчёт DENZL работает";render();})
                .setNegativeButton("ОТМЕНА",null).show();
    }

    private void loadMatches(boolean live){
        if(!loading.compareAndSet(false,true))return;
        statusText=live?"Обновление LIVE…":"Загрузка линии…";sourceText="";render();
        io.execute(()->{
            List<Match> out=new ArrayList<>();String error="";
            try{out=loadSofa(live);sourceText="SofaScore · модель DENZL";}catch(Exception ex){error=err(ex,"SofaScore");}
            String key=apiKey();
            if(!out.isEmpty()&&!key.isEmpty()){
                try{enrichApiFootballOdds(out,live,key);sourceText+=" + рынок";}catch(Exception ignored){}
            }
            final List<Match> result=out;final String finalError=error;
            runOnUiThread(()->{
                List<Match> target=live?liveMatches:lineMatches;target.clear();target.addAll(result);
                if(result.isEmpty()) statusText=!finalError.isEmpty()?finalError:(live?"Сейчас нет футбольных матчей LIVE":"Будущие матчи не получены");
                else statusText=(live?"LIVE: ":"ЛИНИЯ: ")+result.size()+" матчей · "+sourceText;
                loading.set(false);render();
            });
        });
    }

    private List<Match> loadSofa(boolean live)throws Exception{
        String endpoint=live?SOFA+"/sport/football/events/live":SOFA+"/sport/football/scheduled-events/"+today();
        JSONObject root=getSofa(endpoint);JSONArray events=root.optJSONArray("events");List<Match> out=new ArrayList<>();if(events==null)return out;
        long now=System.currentTimeMillis()/1000;
        for(int i=0;i<events.length()&&out.size()<40;i++){
            JSONObject e=events.optJSONObject(i);if(e==null)continue;JSONObject st=e.optJSONObject("status");String type=st==null?"":st.optString("type","");
            if(!live&&!("notstarted".equals(type)||"scheduled".equals(type)))continue;
            if(live&&("finished".equals(type)||"canceled".equals(type)||"postponed".equals(type)))continue;
            Match m=parseSofa(e,live);if(m==null)continue;
            if(!live&&m.startTimestamp>0&&m.startTimestamp<now-60)continue;
            try{applyPregameForm(m,getSofa(SOFA+"/event/"+m.id+"/pregame-form"));}catch(Exception ignored){defaultPregame(m);}
            if(live)try{applySofaStats(m,getSofa(SOFA+"/event/"+m.id+"/statistics"));}catch(Exception ignored){}
            calculateModel(m,live);
            try{applySofaMarket(m,getSofa(SOFA+"/event/"+m.id+"/odds/1/all"));}catch(Exception ignored){}
            out.add(m);
        }
        return out;
    }

    private Match parseSofa(JSONObject e,boolean live){
        long id=e.optLong("id",-1);JSONObject h=e.optJSONObject("homeTeam"),a=e.optJSONObject("awayTeam");if(id<0||h==null||a==null)return null;
        Match m=new Match();m.id=id;m.home=h.optString("name","—");m.away=a.optString("name","—");
        JSONObject t=e.optJSONObject("tournament");String league=t==null?"Футбол":t.optString("name","Футбол");JSONObject cat=t==null?null:t.optJSONObject("category");m.league=cat==null?league:cat.optString("name","")+" · "+league;m.startTimestamp=e.optLong("startTimestamp",0);
        JSONObject hs=e.optJSONObject("homeScore"),as=e.optJSONObject("awayScore");m.homeGoals=hs==null?-1:hs.optInt("current",-1);m.awayGoals=as==null?-1:as.optInt("current",-1);m.h1HomeGoals=hs==null?-1:hs.optInt("period1",-1);m.h1AwayGoals=as==null?-1:as.optInt("period1",-1);
        if(live){JSONObject tm=e.optJSONObject("time");long s=tm==null?0:tm.optLong("currentPeriodStartTimestamp",0);JSONObject st=e.optJSONObject("status");String p=st==null?"":st.optString("period","");if(s>0){int el=(int)((System.currentTimeMillis()/1000-s)/60);m.minute=p.contains("2")?Math.min(120,45+Math.max(0,el)):Math.min(60,Math.max(0,el));}}
        return m;
    }

    private void applyPregameForm(Match m,JSONObject root){
        JSONObject h=root.optJSONObject("homeTeam"),a=root.optJSONObject("awayTeam");
        if(h==null||a==null){defaultPregame(m);return;}
        m.homeStrength=formStrength(h,true);m.awayStrength=formStrength(a,false);
    }
    private double formStrength(JSONObject t,boolean home){
        JSONArray f=t.optJSONArray("form");double pts=0;int n=0;if(f!=null)for(int i=0;i<f.length();i++){String x=f.optString(i,"");if("W".equals(x))pts+=3;else if("D".equals(x))pts+=1;n++;}
        double form=n>0?pts/(3.0*n):0.5;int pos=t.optInt("position",0);double position=pos>0?clamp(1.0-(pos-1)/19.0,0,1):0.5;double v=number(t.optString("value",""));double value=v>0?clamp(v/45.0,0,1):0.5;
        return clamp(0.58*form+0.27*position+0.15*value+(home?0.035:0),0.08,0.92);
    }
    private void defaultPregame(Match m){m.homeStrength=0.54;m.awayStrength=0.46;}

    private void applySofaStats(Match m,JSONObject root){
        JSONArray ps=root.optJSONArray("statistics");if(ps==null)return;
        for(int i=0;i<ps.length();i++){JSONObject p=ps.optJSONObject(i);if(p==null||!"ALL".equals(p.optString("period","")))continue;JSONArray gs=p.optJSONArray("groups");if(gs==null)continue;
            for(int g=0;g<gs.length();g++){JSONObject go=gs.optJSONObject(g);JSONArray its=go==null?null:go.optJSONArray("statisticsItems");if(its==null)continue;
                for(int k=0;k<its.length();k++){JSONObject it=its.optJSONObject(k);if(it==null)continue;String key=it.optString("key","");double hv=statValue(it,"home"),av=statValue(it,"away");String val=it.optString("home","—")+" — "+it.optString("away","—");
                    if(key.equals("ballPossession")){m.possession=val;m.posH=hv;m.posA=av;}
                    if(key.equals("shotsOnGoal")){m.shotsOn=val;m.sotH=hv;m.sotA=av;}
                    if(key.equals("totalShots")||key.equals("totalShotsOnGoal")){m.shots=val;m.shotsH=hv;m.shotsA=av;}
                    if(key.toLowerCase(Locale.ROOT).contains("expectedgoals")){m.xg=val;m.xgH=hv;m.xgA=av;}
                }
            }
        }
    }
    private double statValue(JSONObject o,String side){double v=o.optDouble(side+"Value",Double.NaN);if(!Double.isNaN(v))return v;String s=o.optString(side,"0").replace("%","").replace(',','.');return number(s);}

    private void calculateModel(Match m,boolean live){
        double diff=m.homeStrength-m.awayStrength;
        double lh=clamp(1.42+1.05*diff,0.45,2.65),la=clamp(1.14-0.90*diff,0.35,2.45);
        if(live){
            int min=Math.max(0,m.minute);double remaining=clamp((90.0-min)/90.0,0,1);double pressure=0;
            if(m.xgH+m.xgA>0)pressure+=0.34*(m.xgH-m.xgA);
            if(m.sotH+m.sotA>0)pressure+=0.055*(m.sotH-m.sotA);
            if(m.shotsH+m.shotsA>0)pressure+=0.018*(m.shotsH-m.shotsA);
            if(m.posH+m.posA>0)pressure+=0.004*(m.posH-m.posA);
            lh=clamp(lh*remaining*(1+pressure),0.03,2.8);la=clamp(la*remaining*(1-pressure),0.03,2.8);
            int gh=Math.max(0,m.homeGoals),ga=Math.max(0,m.awayGoals);setOutcomeProbs(m,gh,ga,lh,la,false);setTotalProbs(m,gh+ga,lh+la,false);
            if(min<=45){double remH=clamp((45.0-min)/45.0,0,1);setOutcomeProbs(m,gh,ga,clamp(lh*remH/Math.max(remaining,0.05),0.02,1.8),clamp(la*remH/Math.max(remaining,0.05),0.02,1.8),true);setHalfTotals(m,gh+ga,clamp((lh+la)*remH/Math.max(remaining,0.05),0.03,2.8));}
            else if(m.h1HomeGoals>=0&&m.h1AwayGoals>=0)setCompletedHalf(m);
        }else{
            setOutcomeProbs(m,0,0,lh,la,false);setTotalProbs(m,0,lh+la,false);
            setOutcomeProbs(m,0,0,lh*0.46,la*0.46,true);setHalfTotals(m,0,(lh+la)*0.46);
        }
    }

    private void setOutcomeProbs(Match m,int baseH,int baseA,double lh,double la,boolean half){
        double p1=0,px=0,p2=0;for(int h=0;h<=8;h++)for(int a=0;a<=8;a++){double p=pois(h,lh)*pois(a,la);int fh=baseH+h,fa=baseA+a;if(fh>fa)p1+=p;else if(fh==fa)px+=p;else p2+=p;}
        double s=p1+px+p2;if(s<=0)return;int a=(int)Math.round(p1/s*100),b=(int)Math.round(px/s*100),c=100-a-b;if(half){m.h1p1=a;m.h1px=b;m.h1p2=c;}else{m.p1=a;m.px=b;m.p2=c;}
    }
    private void setTotalProbs(Match m,int goals,double lambda,boolean ignored){m.over15=probOver(goals,lambda,1);m.under15=100-m.over15;m.over25=probOver(goals,lambda,2);m.under25=100-m.over25;}
    private void setHalfTotals(Match m,int goals,double lambda){m.h1Over05=probOver(goals,lambda,0);m.h1Under05=100-m.h1Over05;m.h1Over15=probOver(goals,lambda,1);m.h1Under15=100-m.h1Over15;}
    private void setCompletedHalf(Match m){int h=m.h1HomeGoals,a=m.h1AwayGoals;m.h1p1=h>a?100:0;m.h1px=h==a?100:0;m.h1p2=h<a?100:0;int g=h+a;m.h1Over05=g>0?100:0;m.h1Under05=100-m.h1Over05;m.h1Over15=g>1?100:0;m.h1Under15=100-m.h1Over15;}
    private int probOver(int current,double lambda,int threshold){if(current>threshold)return 100;double p=0;for(int add=0;add<=10;add++)if(current+add>threshold)p+=pois(add,lambda);return (int)Math.round(clamp(p,0,1)*100);}
    private double pois(int k,double l){double f=1;for(int i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f;}

    private void applySofaMarket(Match m,JSONObject root){JSONArray markets=root.optJSONArray("markets");if(markets==null)return;for(int i=0;i<markets.length();i++){JSONObject mk=markets.optJSONObject(i);if(mk==null)continue;String n=mk.optString("marketName","").toLowerCase(Locale.ROOT);JSONArray ch=mk.optJSONArray("choices");if(ch==null)continue;boolean h1=n.contains("1st half")||n.contains("first half");if((n.equals("full time")||n.contains("match result"))&&!h1)storeThreeWayMarket(m,choiceOdds(ch),false);else if(h1&&(n.contains("result")||n.contains("1x2")||n.contains("half time")))storeThreeWayMarket(m,choiceOdds(ch),true);if(!h1&&n.contains("2.5"))storeTotalMarket(m,overUnder(ch,"2.5"),25,false);if(!h1&&n.contains("1.5"))storeTotalMarket(m,overUnder(ch,"1.5"),15,false);if(h1&&n.contains("0.5"))storeTotalMarket(m,overUnder(ch,"0.5"),5,true);if(h1&&n.contains("1.5"))storeTotalMarket(m,overUnder(ch,"1.5"),15,true);}}
    private double[] choiceOdds(JSONArray ch){double[] o={0,0,0};for(int i=0;i<ch.length();i++){JSONObject x=ch.optJSONObject(i);if(x==null)continue;String n=x.optString("name","").trim().toLowerCase(Locale.ROOT);double d=decimalOdds(x);if(n.equals("1"))o[0]=d;else if(n.equals("x"))o[1]=d;else if(n.equals("2"))o[2]=d;}return o;}
    private double[] overUnder(JSONArray ch,String line){double[] o={0,0};for(int i=0;i<ch.length();i++){JSONObject x=ch.optJSONObject(i);if(x==null)continue;String n=x.optString("name","").toLowerCase(Locale.ROOT);if(!n.contains(line)&&ch.length()>2)continue;double d=decimalOdds(x);if(n.contains("over")||n.contains("тб"))o[0]=d;if(n.contains("under")||n.contains("тм"))o[1]=d;}return o;}
    private double decimalOdds(JSONObject x){double d=x.optDouble("decimalValue",0);if(d>1)return d;String f=x.optString("fractionalValue","");try{String[]p=f.split("/");if(p.length==2)return 1+Double.parseDouble(p[0])/Double.parseDouble(p[1]);}catch(Exception ignored){}return 0;}

    private List<Match> loadApiFootballFixtures(boolean live,String key)throws Exception{
        JSONObject root=getJson(live?APIF+"/fixtures?live=all":APIF+"/fixtures?date="+today(),key);JSONArray arr=root.optJSONArray("response");List<Match> out=new ArrayList<>();if(arr==null)return out;
        for(int i=0;i<arr.length()&&out.size()<50;i++){JSONObject o=arr.optJSONObject(i);if(o==null)continue;JSONObject fx=o.optJSONObject("fixture"),teams=o.optJSONObject("teams");if(fx==null||teams==null)continue;JSONObject home=teams.optJSONObject("home"),away=teams.optJSONObject("away");if(home==null||away==null)continue;Match m=new Match();m.apiFootballId=fx.optLong("id",-1);m.home=home.optString("name","");m.away=away.optString("name","");out.add(m);}return out;
    }
    private void enrichApiFootballOdds(List<Match> matches,boolean live,String key)throws Exception{
        List<Match> fixtures=loadApiFootballFixtures(live,key);int calls=0;for(Match m:matches){if(calls>=10)break;Match f=findMatch(m,fixtures);if(f==null)continue;m.apiFootballId=f.apiFootballId;try{JSONObject root=getJson(APIF+(live?"/odds/live?fixture=":"/odds?fixture=")+m.apiFootballId,key);applyApiMarket(m,root,live);calls++;}catch(Exception ignored){}}
    }
    private Match findMatch(Match m,List<Match> list){String h=norm(m.home),a=norm(m.away);for(Match x:list){String xh=norm(x.home),xa=norm(x.away);if((xh.equals(h)&&xa.equals(a))||(similar(xh,h)&&similar(xa,a)))return x;}return null;}
    private boolean similar(String a,String b){return a.length()>4&&b.length()>4&&(a.contains(b)||b.contains(a));}
    private String norm(String s){return s==null?"":s.toLowerCase(Locale.ROOT).replaceAll("[^a-zа-я0-9]","");}
    private void applyApiMarket(Match m,JSONObject root,boolean live){JSONArray resp=root.optJSONArray("response");if(resp==null)return;for(int r=0;r<resp.length();r++){JSONObject e=resp.optJSONObject(r);if(e==null)continue;JSONArray bets=e.optJSONArray("odds");if(bets==null)bets=e.optJSONArray("bets");if(bets!=null)parseMarketBets(m,bets);JSONArray books=e.optJSONArray("bookmakers");if(books!=null)for(int b=0;b<books.length();b++){JSONObject bk=books.optJSONObject(b);JSONArray bb=bk==null?null:bk.optJSONArray("bets");if(bb!=null)parseMarketBets(m,bb);}}}
    private void parseMarketBets(Match m,JSONArray bets){for(int i=0;i<bets.length();i++){JSONObject bet=bets.optJSONObject(i);if(bet==null)continue;String name=bet.optString("name","").toLowerCase(Locale.ROOT);JSONArray v=bet.optJSONArray("values");if(v==null)continue;boolean h1=name.contains("1st half")||name.contains("first half")||name.contains("half time");if(!h1&&(name.contains("winner")||name.contains("1x2")))storeThreeWayMarket(m,threeFromValues(v),false);else if(h1&&(name.contains("winner")||name.contains("1x2")||name.contains("result")))storeThreeWayMarket(m,threeFromValues(v),true);if(!h1&&(name.contains("total")||name.contains("over/under")||name.contains("goals"))){storeTotalMarket(m,totalFromValues(v,"2.5"),25,false);storeTotalMarket(m,totalFromValues(v,"1.5"),15,false);}if(h1&&(name.contains("total")||name.contains("over/under")||name.contains("goals"))){storeTotalMarket(m,totalFromValues(v,"0.5"),5,true);storeTotalMarket(m,totalFromValues(v,"1.5"),15,true);}}}
    private double[] threeFromValues(JSONArray a){double[]o={0,0,0};for(int i=0;i<a.length();i++){JSONObject v=a.optJSONObject(i);if(v==null||v.optBoolean("suspended",false))continue;String n=v.optString("value","").toLowerCase(Locale.ROOT);double d=number(v.optString("odd","0"));if(n.equals("home")||n.equals("1")||n.contains("home"))o[0]=d;else if(n.equals("draw")||n.equals("x"))o[1]=d;else if(n.equals("away")||n.equals("2")||n.contains("away"))o[2]=d;}return o;}
    private double[] totalFromValues(JSONArray a,String line){double[]o={0,0};for(int i=0;i<a.length();i++){JSONObject v=a.optJSONObject(i);if(v==null||v.optBoolean("suspended",false))continue;String n=v.optString("value","").toLowerCase(Locale.ROOT),h=v.optString("handicap","");if(!n.contains(line)&&!h.equals(line))continue;double d=number(v.optString("odd","0"));if(n.contains("over"))o[0]=d;if(n.contains("under"))o[1]=d;}return o;}

    private void storeThreeWayMarket(Match m,double[]o,boolean h1){if(o[0]<=1||o[1]<=1||o[2]<=1)return;double a=1/o[0],b=1/o[1],c=1/o[2],s=a+b+c;int p1=(int)Math.round(a/s*100),px=(int)Math.round(b/s*100),p2=100-p1-px;if(h1){m.h1o1=o[0];m.h1ox=o[1];m.h1o2=o[2];m.h1m1=p1;m.h1mx=px;m.h1m2=p2;}else{m.o1=o[0];m.ox=o[1];m.o2=o[2];m.m1=p1;m.mx=px;m.m2=p2;}}
    private void storeTotalMarket(Match m,double[]o,int code,boolean h1){if(o[0]<=1||o[1]<=1)return;double a=1/o[0],b=1/o[1],s=a+b;int over=(int)Math.round(a/s*100),under=100-over;if(h1&&code==5){m.h1OOver05=o[0];m.h1OUnder05=o[1];m.h1MOver05=over;m.h1MUnder05=under;}else if(h1){m.h1OOver15=o[0];m.h1OUnder15=o[1];m.h1MOver15=over;m.h1MUnder15=under;}else if(code==25){m.oOver25=o[0];m.oUnder25=o[1];m.mOver25=over;m.mUnder25=under;}else{m.oOver15=o[0];m.oUnder15=o[1];m.mOver15=over;m.mUnder15=under;}}

    private JSONObject getSofa(String url)throws Exception{try{return getJson(url,null);}catch(Exception first){String alt=url.replace("https://api.sofascore.com","https://www.sofascore.com");if(!alt.equals(url))return getJson(alt,null);throw first;}}
    private JSONObject getJson(String url,String key)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(8000);c.setReadTimeout(10000);c.setRequestMethod("GET");c.setRequestProperty("Accept","application/json");c.setRequestProperty("User-Agent","Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36 DENZL/0.9");if(key!=null&&!key.isEmpty())c.setRequestProperty("x-apisports-key",key);int code=c.getResponseCode();if(code<200||code>=300)throw new Exception("HTTP "+code+" · "+new URL(url).getHost());BufferedReader r=new BufferedReader(new InputStreamReader(c.getInputStream()));StringBuilder sb=new StringBuilder();String s;while((s=r.readLine())!=null)sb.append(s);r.close();c.disconnect();JSONObject j=new JSONObject(sb.toString());JSONObject errors=j.optJSONObject("errors");if(errors!=null&&errors.length()>0)throw new Exception("API: "+errors.toString());return j;}
    private String err(Exception ex,String src){String m=ex.getMessage();return src+": "+(m==null?ex.getClass().getSimpleName():m);}

    private void render(){
        LinearLayout root=vertical();root.setBackgroundColor(BG);root.setPadding(dp(14),dp(12),dp(14),dp(12));root.addView(text("DENZL",26,TEXT,true));TextView sub=text("Собственная вероятность · рынок только для контроля",12,MUTED,false);sub.setPadding(0,0,0,dp(10));root.addView(sub);
        LinearLayout tabs=new LinearLayout(this);tabs.setWeightSum(2);Button line=tabButton("ЛИНИЯ",!liveMode),live=tabButton("LIVE",liveMode);tabs.addView(line,new LinearLayout.LayoutParams(0,dp(48),1));tabs.addView(live,new LinearLayout.LayoutParams(0,dp(48),1));root.addView(tabs);line.setOnClickListener(v->{liveMode=false;loadMatches(false);});live.setOnClickListener(v->{liveMode=true;loadMatches(true);});
        Button key=new Button(this);key.setText(apiKey().isEmpty()?"РЫНОК: НЕОБЯЗАТЕЛЬНО":"РЫНОК: КОНТРОЛЬ ВКЛЮЧЁН");key.setTextColor(Color.WHITE);key.setTypeface(Typeface.DEFAULT,Typeface.BOLD);key.setBackground(roundRect(CARD2,12));LinearLayout.LayoutParams kp=new LinearLayout.LayoutParams(-1,dp(44));kp.setMargins(0,dp(8),0,0);root.addView(key,kp);key.setOnClickListener(v->showApiKeyDialog());
        if(liveMode){Button refresh=new Button(this);refresh.setText(loading.get()?"ОБНОВЛЕНИЕ…":"ОБНОВИТЬ LIVE");refresh.setEnabled(!loading.get());refresh.setTextColor(Color.WHITE);refresh.setTypeface(Typeface.DEFAULT,Typeface.BOLD);refresh.setBackground(roundRect(ACCENT,12));LinearLayout.LayoutParams rp=new LinearLayout.LayoutParams(-1,dp(46));rp.setMargins(0,dp(8),0,0);root.addView(refresh,rp);refresh.setOnClickListener(v->loadMatches(true));}
        TextView state=text(statusText,12,loading.get()?ACCENT:(statusText.toLowerCase(Locale.ROOT).contains("http")?RED:GREEN),true);state.setGravity(Gravity.CENTER);state.setPadding(0,dp(8),0,dp(2));root.addView(state);
        ScrollView scroll=new ScrollView(this);LinearLayout list=vertical();for(Match m:(liveMode?liveMatches:lineMatches))list.addView(matchCard(m));scroll.addView(list);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));TextView note=text("DENZL рассчитывает проценты независимо от коэффициентов. Если рынок доступен, рядом показываются коэффициент, очищенная от маржи вероятность рынка и разница с DENZL.",10,MUTED,false);note.setPadding(0,dp(6),0,0);root.addView(note);setContentView(root);
    }

    private View matchCard(Match m){LinearLayout c=vertical();c.setPadding(dp(12),dp(10),dp(12),dp(10));c.setBackground(roundRect(CARD,16));LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.setMargins(0,dp(9),0,0);c.setLayoutParams(cp);LinearLayout top=new LinearLayout(this);String time=m.minute>0?m.minute+"'":formatTime(m.startTimestamp);if(m.minute>=80)time+=" · ПОЗДНИЙ LIVE";TextView l=text(m.league,11,MUTED,false),tm=text(time,11,m.minute>=80?AMBER:(m.minute>0?GREEN:MUTED),true);top.addView(l,new LinearLayout.LayoutParams(0,-2,1));top.addView(tm);c.addView(top);String score=(m.homeGoals>=0&&m.awayGoals>=0)?"   "+m.homeGoals+":"+m.awayGoals:"";TextView teams=text(m.home+" — "+m.away+score,17,TEXT,true);teams.setPadding(0,dp(7),0,dp(8));c.addView(teams);LinearLayout mt=new LinearLayout(this);mt.setWeightSum(2);Button full=smallTab("МАТЧ",true),first=smallTab("1-Й ТАЙМ",false);mt.addView(full,new LinearLayout.LayoutParams(0,dp(40),1));mt.addView(first,new LinearLayout.LayoutParams(0,dp(40),1));c.addView(mt);LinearLayout host=vertical();host.addView(fullMarket(m));c.addView(host);full.setOnClickListener(v->{host.removeAllViews();host.addView(fullMarket(m));full.setBackground(roundRect(ACCENT,10));first.setBackground(roundRect(CARD2,10));});first.setOnClickListener(v->{host.removeAllViews();host.addView(firstMarket(m));first.setBackground(roundRect(ACCENT,10));full.setBackground(roundRect(CARD2,10));});TextView det=text("Статистика",13,ACCENT,true);det.setGravity(Gravity.CENTER);det.setPadding(0,dp(10),0,dp(3));c.addView(det);det.setOnClickListener(v->toggleStats(c,det,m));return c;}
    private View fullMarket(Match m){LinearLayout b=vertical();b.setPadding(0,dp(8),0,0);b.addView(outcomes(m.p1,m.px,m.p2,m.o1,m.ox,m.o2,m.m1,m.mx,m.m2));addTotal(b,"ТОТАЛ 2.5","ТБ 2.5",m.over25,m.oOver25,m.mOver25,"ТМ 2.5",m.under25,m.oUnder25,m.mUnder25);addTotal(b,"ТОТАЛ 1.5","ТБ 1.5",m.over15,m.oOver15,m.mOver15,"ТМ 1.5",m.under15,m.oUnder15,m.mUnder15);return b;}
    private View firstMarket(Match m){LinearLayout b=vertical();b.setPadding(0,dp(8),0,0);b.addView(outcomes(m.h1p1,m.h1px,m.h1p2,m.h1o1,m.h1ox,m.h1o2,m.h1m1,m.h1mx,m.h1m2));addTotal(b,"1-Й ТАЙМ · ТОТАЛ 0.5","ТБ 0.5",m.h1Over05,m.h1OOver05,m.h1MOver05,"ТМ 0.5",m.h1Under05,m.h1OUnder05,m.h1MUnder05);addTotal(b,"1-Й ТАЙМ · ТОТАЛ 1.5","ТБ 1.5",m.h1Over15,m.h1OOver15,m.h1MOver15,"ТМ 1.5",m.h1Under15,m.h1OUnder15,m.h1MUnder15);return b;}
    private View outcomes(int a,int b,int c,double oa,double ob,double oc,int ma,int mb,int mc){LinearLayout r=new LinearLayout(this);r.setWeightSum(3);r.addView(probBox("П1",a,oa,ma,false),new LinearLayout.LayoutParams(0,dp(82),1));r.addView(probBox("X",b,ob,mb,false),new LinearLayout.LayoutParams(0,dp(82),1));r.addView(probBox("П2",c,oc,mc,false),new LinearLayout.LayoutParams(0,dp(82),1));return r;}
    private void addTotal(LinearLayout p,String title,String la,int lp,double lo,int lm,String ra,int rp,double ro,int rm){TextView t=text(title,11,MUTED,true);t.setPadding(0,dp(10),0,dp(4));p.addView(t);LinearLayout r=new LinearLayout(this);r.setWeightSum(2);boolean lg=lp>=58&&lp>rp,rg=rp>=58&&rp>lp;r.addView(probBox(la,lp,lo,lm,lg),new LinearLayout.LayoutParams(0,dp(82),1));r.addView(probBox(ra,rp,ro,rm,rg),new LinearLayout.LayoutParams(0,dp(82),1));p.addView(r);}
    private View probBox(String lab,int p,double odd,int market,boolean hi){LinearLayout b=vertical();b.setGravity(Gravity.CENTER);b.setBackground(roundRect(hi?GREEN:CARD2,11));b.addView(text(lab,12,hi?Color.WHITE:MUTED,true));b.addView(text((p<0?"—":p+"%")+(odd>1?" ("+String.format(Locale.US,"%.2f",odd)+")":""),15,Color.WHITE,true));if(market>=0&&p>=0){int d=p-market;String ds=(d>0?"+":"")+d+" п.п.";b.addView(text("рынок "+market+"% · Δ "+ds,9,hi?Color.WHITE:MUTED,false));}return b;}
    private void toggleStats(LinearLayout c,TextView ctl,Match m){Object tag=ctl.getTag();if(tag instanceof View){c.removeView((View)tag);ctl.setTag(null);return;}LinearLayout b=vertical();b.setPadding(dp(10),dp(8),dp(10),dp(8));b.setBackground(roundRect(CARD2,10));b.addView(stat("Удары",m.shots));b.addView(stat("В створ",m.shotsOn));b.addView(stat("Владение",m.possession));b.addView(stat("xG",m.xg));b.addView(stat("Сила до матча",String.format(Locale.US,"%.0f%% — %.0f%%",m.homeStrength*100,m.awayStrength*100)));c.addView(b);ctl.setTag(b);}
    private View stat(String a,String b){LinearLayout r=new LinearLayout(this);TextView l=text(a,12,MUTED,false),v=text(b==null?"—":b,12,TEXT,true);r.addView(l,new LinearLayout.LayoutParams(0,-2,1));r.addView(v);return r;}

    private double number(String s){try{return Double.parseDouble(s.replace(',','.').replaceAll("[^0-9.\\-]",""));}catch(Exception e){return 0;}}
    private double clamp(double x,double a,double b){return Math.max(a,Math.min(b,x));}
    private String today(){SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd",Locale.US);f.setTimeZone(TimeZone.getDefault());return f.format(new Date());}
    private String formatTime(long ts){if(ts<=0)return"—";SimpleDateFormat f=new SimpleDateFormat("HH:mm",Locale.getDefault());return f.format(new Date(ts*1000));}
    private LinearLayout vertical(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private Button tabButton(String s,boolean on){Button b=new Button(this);b.setText(s);b.setTextColor(Color.WHITE);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setBackground(roundRect(on?ACCENT:CARD,12));return b;}
    private Button smallTab(String s,boolean on){Button b=tabButton(s,on);b.setTextSize(12);return b;}
    private TextView text(String s,float z,int c,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}
    private GradientDrawable roundRect(int c,int r){GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(dp(r));return d;}
    private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}

    static class Match{
        long id=-1,apiFootballId=-1,startTimestamp;String league="Футбол",home="—",away="—",shots="—",shotsOn="—",possession="—",xg="—";int minute=0,homeGoals=-1,awayGoals=-1,h1HomeGoals=-1,h1AwayGoals=-1;
        double homeStrength=.54,awayStrength=.46,shotsH,shotsA,sotH,sotA,posH,posA,xgH,xgA;
        int p1=-1,px=-1,p2=-1,over25=-1,under25=-1,over15=-1,under15=-1,h1p1=-1,h1px=-1,h1p2=-1,h1Over05=-1,h1Under05=-1,h1Over15=-1,h1Under15=-1;
        double o1,ox,o2,oOver25,oUnder25,oOver15,oUnder15,h1o1,h1ox,h1o2,h1OOver05,h1OUnder05,h1OOver15,h1OUnder15;
        int m1=-1,mx=-1,m2=-1,mOver25=-1,mUnder25=-1,mOver15=-1,mUnder15=-1,h1m1=-1,h1mx=-1,h1m2=-1,h1MOver05=-1,h1MUnder05=-1,h1MOver15=-1,h1MUnder15=-1;
    }
}
