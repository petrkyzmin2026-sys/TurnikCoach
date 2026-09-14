package ru.matchstats.app;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
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
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URLEncoder;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends Activity {
    private static final String SOFA="https://api.sofascore.com/api/v1";
    private static final String FOT="https://www.fotmob.com/api/data";
    private static final String BC_PRE="https://ad.betcity.ru/d/off/events?id_sp=1&ch_id=0&gr_id=0&add=main,ext,name_sp,name_ch&rev=2&ver=69&csn=ooca9s";
    private static final String[] BC_LIVE={
            "https://ad.betcity.ru/d/on_air/bets?id_sp=1&rev=8&add=dep_event,name_sp,name_ch&template=1&ver=69&csn=ooca9s",
            "https://ad.betcity.ru/d/on_air/bets?id_sp=1&rev=2&add=name_sp,name_ch&template=1&ver=69&csn=ooca9s"};
    private static final long LIVE_REFRESH_MS=120000L;
    private static final double MIN_ODD=1.45;

    private static final int BG=Color.rgb(10,15,20),CARD=Color.rgb(20,28,36),CARD2=Color.rgb(26,36,46),TEXT=Color.rgb(240,244,247),MUTED=Color.rgb(145,157,169),GREEN=Color.rgb(38,166,91),ACCENT=Color.rgb(64,145,255),RED=Color.rgb(220,80,80),AMBER=Color.rgb(225,155,45);
    private final ExecutorService io=Executors.newFixedThreadPool(5);
    private final AtomicBoolean busy=new AtomicBoolean(false);
    private final Handler handler=new Handler(Looper.getMainLooper());
    private final List<Match> results=new ArrayList<>();
    private final Map<String,Profile> profileCache=new LinkedHashMap<>();
    private final Map<String,Match> selectedLive=new HashMap<>();
    private final Map<String,List<Match>> searchCache=new HashMap<>();
    private boolean liveMode=false;
    private String query="",status="Введите команду, лигу или страну";
    private long oddsPreAt=0,oddsLiveAt=0;
    private JSONObject oddsPreCache,oddsLiveCache;

    @Override public void onCreate(Bundle b){super.onCreate(b);render();}
    @Override public void onDestroy(){handler.removeCallbacksAndMessages(null);io.shutdownNow();super.onDestroy();}

    private final Runnable liveTick=new Runnable(){@Override public void run(){if(liveMode){loadLive(false);handler.postDelayed(this,LIVE_REFRESH_MS);}}};
    private void startLive(){handler.removeCallbacks(liveTick);loadLive(true);handler.postDelayed(liveTick,LIVE_REFRESH_MS);}
    private void stopLive(){handler.removeCallbacks(liveTick);}

    private void searchLine(String q){
        q=q==null?"":q.trim();
        if(q.length()<2){status="Введите не менее 2 символов";render();return;}
        query=q;
        String ck=norm(q);
        List<Match> cached=searchCache.get(ck);
        if(cached!=null){results.clear();results.addAll(cloneList(cached));status="Найдено: "+results.size()+" · из кэша";render();return;}
        if(!busy.compareAndSet(false,true))return;
        status="Ищу матч по статистическим источникам…";render();
        final String fq=q;
        io.execute(()->{
            List<Match> found=new ArrayList<>();String err="";
            try{
                JSONObject sr=getJson(SOFA+"/search/all?q="+enc(fq),"https://www.sofascore.com/");
                int teamId=findSofaTeam(sr,fq);
                if(teamId>0){
                    for(int page=0;page<2&&found.size()<30;page++){
                        JSONObject r=getJson(SOFA+"/team/"+teamId+"/events/next/"+page,"https://www.sofascore.com/");
                        collectSofaEvents(r,found,false,fq,false);
                    }
                }
                if(found.isEmpty()){
                    long now=System.currentTimeMillis();
                    for(int d=0;d<5;d++){
                        String ds=new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(new Date(now+d*86400000L));
                        try{JSONObject r=getJson(SOFA+"/sport/football/scheduled-events/"+ds,"https://www.sofascore.com/");collectSofaEvents(r,found,false,fq,true);}catch(Exception ignored){}
                    }
                }
                dedupe(found);sortMatches(found);
            }catch(Exception e){err=msg(e);}
            final List<Match> out=found;final String er=err;
            runOnUiThread(()->{results.clear();results.addAll(out);searchCache.put(norm(fq),cloneList(out));status=out.isEmpty()?(!er.isEmpty()?er:"Матчи не найдены"):("Найдено: "+out.size()+" · статистические сайты");busy.set(false);render();});
        });
    }

    private void loadLive(boolean manual){
        if(!liveMode||!busy.compareAndSet(false,true))return;
        if(manual){status="Загружаю LIVE матчи…";render();}
        io.execute(()->{
            List<Match> found=new ArrayList<>();String err="";
            try{JSONObject r=getJson(SOFA+"/sport/football/events/live","https://www.sofascore.com/");collectSofaEvents(r,found,true,"",false);dedupe(found);sortMatches(found);}catch(Exception e){err=msg(e);}
            final String er=err;final List<Match> out=found;
            runOnUiThread(()->{
                results.clear();
                for(Match fresh:out){Match old=selectedLive.get(fresh.id);if(old!=null){fresh.ph=old.ph;fresh.pa=old.pa;fresh.ready=old.ready;fresh.criteria.addAll(old.criteria);fresh.reliability=old.reliability;fresh.lambdaH=old.lambdaH;fresh.lambdaA=old.lambdaA;}results.add(fresh);}
                status=er.isEmpty()?("LIVE: "+results.size()+" матчей · обновление 2 мин"):er;
                busy.set(false);render();
                for(Match m:new ArrayList<>(results))if(m.ready)refreshSelectedLive(m);
            });
        });
    }

    private void collectSofaEvents(Object root,List<Match> out,boolean live,String q,boolean applyQuery){
        if(root instanceof JSONObject){JSONObject o=(JSONObject)root;JSONArray ev=o.optJSONArray("events");if(ev!=null){for(int i=0;i<ev.length();i++){Match m=parseSofaEventCard(ev.optJSONObject(i),live);if(m!=null&&(!applyQuery||matchesQuery(m,q)))out.add(m);}return;}Iterator<String>it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)collectSofaEvents(v,out,live,q,applyQuery);}}
        else if(root instanceof JSONArray){JSONArray a=(JSONArray)root;for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)collectSofaEvents(v,out,live,q,applyQuery);}}
    }

    private Match parseSofaEventCard(JSONObject e,boolean live){
        if(e==null)return null;JSONObject sport=e.optJSONObject("sport");if(sport!=null&&!"football".equalsIgnoreCase(sport.optString("slug","football")))return null;
        JSONObject ht=e.optJSONObject("homeTeam"),at=e.optJSONObject("awayTeam");if(ht==null||at==null)return null;
        JSONObject t=e.optJSONObject("tournament"),ut=t==null?null:t.optJSONObject("uniqueTournament"),cat=t==null?null:t.optJSONObject("category");
        String h=ht.optString("name","").trim(),a=at.optString("name","").trim(),league=ut!=null?ut.optString("name",""):t==null?"":t.optString("name","");
        String country=cat==null?"Прочее":cat.optString("name","Прочее");
        if(h.isEmpty()||a.isEmpty()||excluded(country+" "+league+" "+h+" "+a))return null;
        Match m=new Match();m.id=String.valueOf(e.optLong("id",0));m.home=h;m.away=a;m.league=league.isEmpty()?"Прочие соревнования":league;m.country=country;m.ts=e.optLong("startTimestamp",0);m.live=live;
        JSONObject hs=e.optJSONObject("homeScore"),as=e.optJSONObject("awayScore");if(hs!=null&&as!=null){m.hg=scoreVal(hs);m.ag=scoreVal(as);m.h1g=period1(hs);m.a1g=period1(as);}m.min=findSofaMinute(e);return m;
    }

    private int findSofaMinute(JSONObject e){JSONObject p=e.optJSONObject("time");if(p!=null){int c=p.optInt("currentPeriodStartTimestamp",0);if(c>0){long sec=System.currentTimeMillis()/1000-c;String period=e.optString("status","");int base=period.toLowerCase(Locale.ROOT).contains("second")?45:0;int v=base+(int)(sec/60);if(v>=0&&v<=125)return v;}}int x=e.optInt("minute",0);return x>0?x:0;}

    private void analyze(Match m){
        if(m.loading)return;m.loading=true;m.error="";status="Собираю статистику только выбранного матча…";render();
        io.execute(()->{
            try{m.ph=getProfile(m.home);m.pa=getProfile(m.away);if(m.live)loadLiveEventStats(m);loadOddsForMatch(m);calculate(m);if(m.live)selectedLive.put(m.id,m);}catch(Exception e){m.error=msg(e);}m.loading=false;
            runOnUiThread(()->{status=m.error.isEmpty()?"Расчёт выполнен · вероятность независима от коэффициента":"Статистика: "+m.error;render();});
        });
    }

    private void refreshSelectedLive(Match m){
        if(m.loading||m.ph==null||m.pa==null)return;m.loading=true;
        io.execute(()->{try{loadLiveEventStats(m);loadOddsForMatch(m);calculate(m);selectedLive.put(m.id,m);}catch(Exception e){m.error=msg(e);}m.loading=false;runOnUiThread(this::render);});
    }

    private Profile getProfile(String name)throws Exception{
        String k=norm(name);Profile c=profileCache.get(k);if(c!=null&&System.currentTimeMillis()-c.loadedAt<3600000)return c;
        Profile p=null;Exception last=null;try{p=sofaProfile(name);}catch(Exception e){last=e;}
        if(p==null||p.n<5){try{Profile f=fotmobProfile(name);if(f!=null&&(p==null||f.n>p.n))p=f;}catch(Exception e){last=e;}}
        if(p==null||p.n<3)throw last!=null?last:new Exception("Недостаточно истории команды");p.loadedAt=System.currentTimeMillis();profileCache.put(k,p);return p;
    }

    private Profile sofaProfile(String name)throws Exception{
        JSONObject sr=getJson(SOFA+"/search/all?q="+enc(name),"https://www.sofascore.com/");int teamId=findSofaTeam(sr,name);if(teamId<=0)throw new Exception("SofaScore: команда не найдена");Profile p=new Profile();p.source="SofaScore";List<Hist> events=new ArrayList<>();
        for(int page=0;page<2&&events.size()<20;page++){JSONObject root=getJson(SOFA+"/team/"+teamId+"/events/last/"+page,"https://www.sofascore.com/");JSONArray ar=root.optJSONArray("events");if(ar==null)break;for(int i=0;i<ar.length()&&events.size()<20;i++){Hist h=parseSofaHistory(ar.optJSONObject(i),teamId);if(h!=null)events.add(h);}}
        for(Hist h:events){p.addResult(h);if(p.statN<10&&h.eventId>0)try{JSONObject st=getJson(SOFA+"/event/"+h.eventId+"/statistics","https://www.sofascore.com/");addSofaStats(st,p,h.teamHome);}catch(Exception ignored){}}
        return p;
    }

    private int findSofaTeam(Object node,String name){int[]best={0,-1};walkFindTeam(node,name,best);return best[0];}
    private void walkFindTeam(Object node,String name,int[]best){if(node instanceof JSONObject){JSONObject o=(JSONObject)node;JSONObject ent=o.optJSONObject("entity");if(ent!=null){String n=ent.optString("name","");String type=o.optString("type",ent.optString("entityType",""));JSONObject sport=ent.optJSONObject("sport");String slug=sport==null?"":sport.optString("slug","");if(("team".equalsIgnoreCase(type)||"team".equalsIgnoreCase(ent.optString("entityType","")))&&(slug.isEmpty()||slug.equals("football"))){int sc=similarity(name,n);if(sc>best[1]){best[0]=ent.optInt("id",0);best[1]=sc;}}}Iterator<String>it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)walkFindTeam(v,name,best);}}else if(node instanceof JSONArray){JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)walkFindTeam(v,name,best);}}}

    private Hist parseSofaHistory(JSONObject e,int teamId){if(e==null)return null;JSONObject ht=e.optJSONObject("homeTeam"),at=e.optJSONObject("awayTeam"),hs=e.optJSONObject("homeScore"),as=e.optJSONObject("awayScore");if(ht==null||at==null||hs==null||as==null)return null;boolean home=ht.optInt("id")==teamId;if(!home&&at.optInt("id")!=teamId)return null;int hg=scoreVal(hs),ag=scoreVal(as);if(hg<0||ag<0)return null;Hist h=new Hist();h.eventId=e.optInt("id",0);h.teamHome=home;h.gf=home?hg:ag;h.ga=home?ag:hg;h.h1gf=home?period1(hs):period1(as);h.h1ga=home?period1(as):period1(hs);return h;}
    private int scoreVal(JSONObject s){if(s==null)return-1;if(s.has("normaltime"))return s.optInt("normaltime",-1);if(s.has("current"))return s.optInt("current",-1);return-1;}
    private int period1(JSONObject s){return s==null?-1:s.optInt("period1",-1);}

    private void addSofaStats(Object node,Profile p,boolean teamHome){if(node instanceof JSONObject){JSONObject o=(JSONObject)node;if(o.has("name")&&o.has("home")&&o.has("away")){String n=o.optString("name","").toLowerCase(Locale.ROOT);double hv=num(o.opt("home")),av=num(o.opt("away")),f=teamHome?hv:av,a=teamHome?av:hv;if(n.contains("expected goals")||n.equals("xg")){p.xgF+=f;p.xgA+=a;p.xgN++;}else if(n.contains("shots on target")||n.contains("в створ")){p.sotF+=f;p.sotA+=a;p.sotN++;}else if(n.contains("total shots")||n.equals("shots")){p.shF+=f;p.shA+=a;p.shN++;}else if(n.contains("ball possession")||n.contains("possession")){p.posF+=f;p.posA+=a;p.posN++;}else if(n.contains("corner")){p.corF+=f;p.corA+=a;p.corN++;}else if(n.contains("yellow card")){p.cardF+=f;p.cardA+=a;p.cardN++;}}Iterator<String>it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)addSofaStats(v,p,teamHome);}}else if(node instanceof JSONArray){JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)addSofaStats(v,p,teamHome);}}p.statN=Math.max(p.statN,Math.max(p.xgN,Math.max(p.sotN,p.shN)));}

    private Profile fotmobProfile(String name)throws Exception{JSONObject sr=getJson(FOT+"/search/suggest?hits=20&lang=en&term="+enc(name),"https://www.fotmob.com/");int id=findFotTeam(sr,name);if(id<=0)throw new Exception("FotMob: команда не найдена");JSONObject tr=getJson(FOT+"/teams?id="+id,"https://www.fotmob.com/");Profile p=new Profile();p.source="FotMob";walkFotMatches(tr,id,p);return p;}
    private int findFotTeam(Object node,String name){int[]best={0,-1};walkFotTeam(node,name,best);return best[0];}
    private void walkFotTeam(Object node,String name,int[]best){if(node instanceof JSONObject){JSONObject o=(JSONObject)node;String n=o.optString("name",o.optString("title","")),type=o.optString("type",o.optString("suggestionType",""));int id=o.optInt("id",o.optInt("teamId",0));if(id>0&&!n.isEmpty()&&(type.toLowerCase(Locale.ROOT).contains("team")||o.has("teamId"))){int s=similarity(name,n);if(s>best[1]){best[0]=id;best[1]=s;}}Iterator<String>it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)walkFotTeam(v,name,best);}}else if(node instanceof JSONArray){JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)walkFotTeam(v,name,best);}}}
    private void walkFotMatches(Object node,int teamId,Profile p){if(p.n>=20)return;if(node instanceof JSONObject){JSONObject o=(JSONObject)node,home=o.optJSONObject("home"),away=o.optJSONObject("away");if(home!=null&&away!=null){int hid=home.optInt("id",0),aid=away.optInt("id",0);if(hid==teamId||aid==teamId){JSONObject st=o.optJSONObject("status");int[]sc=parsePairScore(st==null?"":st.optString("scoreStr",""));if(sc!=null){Hist h=new Hist();h.teamHome=hid==teamId;h.gf=h.teamHome?sc[0]:sc[1];h.ga=h.teamHome?sc[1]:sc[0];p.addResult(h);}}}Iterator<String>it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)walkFotMatches(v,teamId,p);}}else if(node instanceof JSONArray){JSONArray a=(JSONArray)node;for(int i=0;i<a.length()&&p.n<20;i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)walkFotMatches(v,teamId,p);}}}

    private void loadLiveEventStats(Match m)throws Exception{if(m.id.isEmpty())return;JSONObject st=getJson(SOFA+"/event/"+m.id+"/statistics","https://www.sofascore.com/");m.liveXgH=m.liveXgA=m.liveSotH=m.liveSotA=m.liveShotsH=m.liveShotsA=0;scanLiveStats(st,m);}
    private void scanLiveStats(Object node,Match m){if(node instanceof JSONObject){JSONObject o=(JSONObject)node;if(o.has("name")&&o.has("home")&&o.has("away")){String n=o.optString("name","").toLowerCase(Locale.ROOT);double h=num(o.opt("home")),a=num(o.opt("away"));if(n.contains("expected goals")||n.equals("xg")){m.liveXgH=h;m.liveXgA=a;}else if(n.contains("shots on target")||n.contains("в створ")){m.liveSotH=h;m.liveSotA=a;}else if(n.contains("total shots")||n.equals("shots")){m.liveShotsH=h;m.liveShotsA=a;}}Iterator<String>it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)scanLiveStats(v,m);}}else if(node instanceof JSONArray){JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)scanLiveStats(v,m);}}}

    private void loadOddsForMatch(Match m)throws Exception{
        JSONObject root=loadOddsRoot(m.live);Match odds=findBetcityMatch(root,m.home,m.away,m.live);if(odds==null)return;
        m.oddSource="BETCITY";m.p1Odd=odds.p1Odd;m.xOdd=odds.xOdd;m.p2Odd=odds.p2Odd;m.o15Odd=odds.o15Odd;m.u15Odd=odds.u15Odd;m.o25Odd=odds.o25Odd;m.u25Odd=odds.u25Odd;m.o35Odd=odds.o35Odd;m.u35Odd=odds.u35Odd;m.bttsYesOdd=odds.bttsYesOdd;m.bttsNoOdd=odds.bttsNoOdd;
    }
    private JSONObject loadOddsRoot(boolean live)throws Exception{long now=System.currentTimeMillis();if(live&&oddsLiveCache!=null&&now-oddsLiveAt<LIVE_REFRESH_MS)return oddsLiveCache;if(!live&&oddsPreCache!=null&&now-oddsPreAt<LIVE_REFRESH_MS)return oddsPreCache;if(live){Exception last=null;for(String u:BC_LIVE)try{oddsLiveCache=getJson(u,"https://betcity.ru/ru/live/football");oddsLiveAt=now;return oddsLiveCache;}catch(Exception e){last=e;}throw last==null?new Exception("Коэффициенты недоступны"):last;}oddsPreCache=getJson(BC_PRE,"https://betcity.ru/ru/line/football");oddsPreAt=now;return oddsPreCache;}
    private Match findBetcityMatch(Object node,String h,String a,boolean live){Match[]best={null};int[]bs={0};walkBetcityOdds(node,"",-1,"",live,h,a,best,bs);return best[0];}
    private void walkBetcityOdds(Object node,String league,int sportId,String sportName,boolean live,String h,String a,Match[]best,int[]bs){if(node instanceof JSONObject){JSONObject o=(JSONObject)node;String nl=league,ns=sportName;int ni=sportId;if(o.has("name_ch"))nl=o.optString("name_ch",league);if(o.has("name_sp"))ns=o.optString("name_sp",sportName);if(o.has("id_sp"))ni=o.optInt("id_sp",sportId);if(o.has("id_ev")&&o.has("name_ht")&&o.has("name_at")&&(ni==1||isFootballName(ns))){String bh=o.optString("name_ht",""),ba=o.optString("name_at","");int sc=similarity(h,bh)+similarity(a,ba);if(sc>bs[0]&&!excluded(nl+" "+bh+" "+ba)){Match m=new Match();m.home=bh;m.away=ba;scanMarkets(o,m,"");best[0]=m;bs[0]=sc;}}Iterator<String>it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)walkBetcityOdds(v,nl,ni,ns,live,h,a,best,bs);}}else if(node instanceof JSONArray){JSONArray ar=(JSONArray)node;for(int i=0;i<ar.length();i++){Object v=ar.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)walkBetcityOdds(v,league,sportId,sportName,live,h,a,best,bs);}}}

    private void calculate(Match m){Profile h=m.ph,a=m.pa;m.criteria.clear();double totalW=0,usedW=0,sp1=0,sx=0,sp2=0,slh=0,sla=0;
        totalW+=addC(m,"Форма последних матчей",h.n>=5&&a.n>=5,1.2,1.25*(.72+h.form()),1.05*(.72+a.form()),h.n+" / "+a.n+" матчей");
        totalW+=addC(m,"Голы: атака / оборона",h.n>=5&&a.n>=5,2.0,clamp((h.gf()+a.ga())/2*1.08,.25,3.3),clamp((a.gf()+h.ga())/2*.94,.20,3.0),String.format(Locale.US,"GF/GA %.2f/%.2f · %.2f/%.2f",h.gf(),h.ga(),a.gf(),a.ga()));
        totalW+=addC(m,"Дом / выезд",h.homeN>=3&&a.awayN>=3,1.4,clamp((h.homeGF()+a.awayGA())/2,.25,3.3),clamp((a.awayGF()+h.homeGA())/2,.20,3.0),h.homeN+" дом · "+a.awayN+" выезд");
        totalW+=addC(m,"xG / xGA",h.xgN>=3&&a.xgN>=3,2.2,clamp((h.xgF()+a.xgA())/2,.20,3.4),clamp((a.xgF()+h.xgA())/2,.20,3.2),h.xgN+" / "+a.xgN+" матчей");
        totalW+=addDiffC(m,"Удары в створ",h.sotN>=3&&a.sotN>=3,1.5,h.sotF()-h.sotA(),a.sotF()-a.sotA(),"ср. "+fmt(h.sotF())+" / "+fmt(a.sotF()));
        totalW+=addDiffC(m,"Удары",h.shN>=3&&a.shN>=3,1.0,h.shF()-h.shA(),a.shF()-a.shA(),"ср. "+fmt(h.shF())+" / "+fmt(a.shF()));
        totalW+=addDiffC(m,"Угловые",h.corN>=3&&a.corN>=3,.55,h.corF()-h.corA(),a.corF()-a.corA(),"ср. "+fmt(h.corF())+" / "+fmt(a.corF()));
        totalW+=addDiffC(m,"Владение",h.posN>=3&&a.posN>=3,.35,(h.posF()-50)/10,(a.posF()-50)/10,"ср. "+fmt(h.posF())+"% / "+fmt(a.posF())+"%");
        totalW+=addDiffC(m,"Карточки",h.cardN>=3&&a.cardN>=3,.25,-(h.cardF()-h.cardA()),-(a.cardF()-a.cardA()),"ср. "+fmt(h.cardF())+" / "+fmt(a.cardF()));
        for(Criterion c:m.criteria)if(c.available){usedW+=c.w;sp1+=c.p1*c.w;sx+=c.px*c.w;sp2+=c.p2*c.w;slh+=c.lh*c.w;sla+=c.la*c.w;}
        double sample=Math.min(1,Math.min(h.n,a.n)/10.0),coverage=totalW>0?usedW/totalW:0;m.reliability=(int)Math.round(100*(.72*coverage+.28*sample));
        if(usedW<=0||m.reliability<45||h.n<5||a.n<5){m.ready=false;return;}
        m.lambdaH=slh/usedW;m.lambdaA=sla/usedW;double lh=m.lambdaH,la=m.lambdaA;int baseH=0,baseA=0;
        if(m.live){double minute=clamp(m.min,0,95),rem=clamp((95.0-minute)/95.0,0,1);double tempo=1.0;if(minute>5){double expectedXg=(m.lambdaH+m.lambdaA)*(minute/95.0),actualXg=m.liveXgH+m.liveXgA;if(actualXg>0&&expectedXg>0)tempo=clamp(.70+.30*(actualXg/expectedXg),.65,1.55);else{double shots=m.liveShotsH+m.liveShotsA,sot=m.liveSotH+m.liveSotA;if(shots>0)tempo=clamp(.78+.018*shots+.035*sot,.70,1.45);}}double shareH=.5;if(m.liveXgH+m.liveXgA>.05)shareH=m.liveXgH/(m.liveXgH+m.liveXgA);else if(m.liveSotH+m.liveSotA>0)shareH=m.liveSotH/(m.liveSotH+m.liveSotA);double preShare=m.lambdaH/(m.lambdaH+m.lambdaA);shareH=.60*preShare+.40*shareH;double remain=(m.lambdaH+m.lambdaA)*rem*tempo;lh=clamp(remain*shareH,.01,3.0);la=clamp(remain*(1-shareH),.01,3.0);baseH=Math.max(0,m.hg);baseA=Math.max(0,m.ag);m.next1=atLeast(lh+la,1);m.next2=atLeast(lh+la,2);m.next3=atLeast(lh+la,3);double no=Math.exp(-(lh+la)),any=1-no;m.noMore=(int)Math.round(no*100);m.nextHome=(int)Math.round(any*(lh/(lh+la))*100);m.nextAway=Math.max(0,100-m.noMore-m.nextHome);}
        int[]res=outcomeArray(baseH,baseA,lh,la);m.p1=res[0];m.px=res[1];m.p2=res[2];double total=lh+la;int current=baseH+baseA;m.o15=probFinalOver(current,total,1.5);m.u15=100-m.o15;m.o25=probFinalOver(current,total,2.5);m.u25=100-m.o25;m.o35=probFinalOver(current,total,3.5);m.u35=100-m.o35;m.bttsYes=btts(baseH,baseA,lh,la);m.bttsNo=100-m.bttsYes;m.ready=true;
    }
    private int probFinalOver(int current,double remain,double line){int need=(int)Math.floor(line)+1-current;return need<=0?100:atLeast(remain,need);}
    private int btts(int bh,int ba,double lh,double la){double ph=bh>0?1:1-Math.exp(-lh),pa=ba>0?1:1-Math.exp(-la);return(int)Math.round(ph*pa*100);}
    private double addC(Match m,String n,boolean ok,double w,double lh,double la,String d){if(!ok){m.criteria.add(new Criterion(n,false,w,-1,-1,-1,0,0,"нет данных"));return w;}int[]p=outcomeArray(0,0,lh,la);m.criteria.add(new Criterion(n,true,w,p[0],p[1],p[2],lh,la,d));return w;}
    private double addDiffC(Match m,String n,boolean ok,double w,double hd,double ad,String d){double lh=clamp(1.30*(1+.06*hd-.03*ad),.35,2.8),la=clamp(1.10*(1+.06*ad-.03*hd),.30,2.6);return addC(m,n,ok,w,lh,la,d);}
    private int[] outcomeArray(int bh,int ba,double lh,double la){double p1=0,px=0,p2=0;for(int h=0;h<10;h++)for(int a=0;a<10;a++){double p=pois(h,lh)*pois(a,la);int fh=bh+h,fa=ba+a;if(fh>fa)p1+=p;else if(fh==fa)px+=p;else p2+=p;}double s=p1+px+p2;if(s<=0)return new int[]{-1,-1,-1};int x=(int)Math.round(p1/s*100),y=(int)Math.round(px/s*100);return new int[]{x,y,100-x-y};}
    private int atLeast(double l,int n){double x=0;for(int i=0;i<n;i++)x+=pois(i,l);return(int)Math.round(clamp(1-x,0,1)*100);}
    private double pois(int k,double l){double f=1;for(int i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f;}

    private void render(){
        LinearLayout root=v();root.setBackgroundColor(BG);root.setPadding(dp(14),dp(10),dp(14),dp(10));TextView title=txt("DENZL",26,TEXT,true);title.setGravity(Gravity.CENTER);root.addView(title);TextView sub=txt("Матчи: статистические сайты · КФ: букмекеры · P независима от КФ",11,MUTED,false);sub.setGravity(Gravity.CENTER);root.addView(sub);
        LinearLayout tabs=new LinearLayout(this);tabs.setWeightSum(2);Button lb=tab("ЛИНИЯ",!liveMode),lv=tab("LIVE",liveMode);tabs.addView(lb,new LinearLayout.LayoutParams(0,dp(48),1));tabs.addView(lv,new LinearLayout.LayoutParams(0,dp(48),1));LinearLayout.LayoutParams tp=new LinearLayout.LayoutParams(-1,-2);tp.setMargins(0,dp(8),0,0);root.addView(tabs,tp);
        lb.setOnClickListener(x->{liveMode=false;stopLive();results.clear();query="";status="Поиск линии по команде, лиге или стране";render();});
        lv.setOnClickListener(x->{liveMode=true;query="";results.clear();status="Загружаю LIVE…";render();startLive();});
        if(!liveMode){LinearLayout sr=new LinearLayout(this);EditText ed=new EditText(this);ed.setText(query);ed.setHint("Команда, лига или страна");ed.setSingleLine(true);ed.setTextColor(TEXT);ed.setHintTextColor(MUTED);ed.setBackground(box(CARD2,12));ed.setPadding(dp(12),0,dp(8),0);Button go=tab("НАЙТИ",true);sr.addView(ed,new LinearLayout.LayoutParams(0,dp(48),1));LinearLayout.LayoutParams gp=new LinearLayout.LayoutParams(dp(96),dp(48));gp.setMargins(dp(7),0,0,0);sr.addView(go,gp);LinearLayout.LayoutParams sp=new LinearLayout.LayoutParams(-1,-2);sp.setMargins(0,dp(9),0,0);root.addView(sr,sp);go.setOnClickListener(x->searchLine(ed.getText().toString()));ed.setOnEditorActionListener((v,a,e)->{searchLine(v.getText().toString());return true;});}
        TextView st=txt(status,12,busy.get()?ACCENT:(status.toLowerCase(Locale.ROOT).contains("ошиб")?RED:GREEN),true);st.setGravity(Gravity.CENTER);st.setPadding(0,dp(8),0,dp(4));root.addView(st);if(liveMode)root.addView(txt("Список обновляется каждые 2 минуты. Статистика собирается только после выбора матча.",10,MUTED,false));
        ScrollView sc=new ScrollView(this);LinearLayout list=v();String pc="",pl="";for(Match m:results){if(liveMode&&!m.country.equals(pc)){TextView h=txt(m.country.toUpperCase(Locale.ROOT),14,ACCENT,true);h.setPadding(0,dp(12),0,dp(3));list.addView(h);pc=m.country;pl="";}if(liveMode&&!m.league.equals(pl)){TextView h=txt(m.league,12,MUTED,true);h.setPadding(dp(6),dp(5),0,0);list.addView(h);pl=m.league;}list.addView(card(m));}sc.addView(list);root.addView(sc,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);
    }

    private View card(Match m){LinearLayout c=v();c.setPadding(dp(12),dp(10),dp(12),dp(10));c.setBackground(box(CARD,15));LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.setMargins(0,dp(7),0,0);c.setLayoutParams(cp);LinearLayout top=new LinearLayout(this);top.addView(txt(m.country+" · "+m.league,10,MUTED,false),new LinearLayout.LayoutParams(0,-2,1));top.addView(txt(m.live?(m.min>0?m.min+"'":"LIVE"):time(m.ts),11,m.live?GREEN:MUTED,true));c.addView(top);String score=m.hg>=0?"  "+m.hg+":"+m.ag:"";c.addView(txt(m.home+" — "+m.away+score,17,TEXT,true));
        if(!m.ready){Button calc=tab(m.loading?"СБОР ДАННЫХ…":"ОТКРЫТЬ И РАССЧИТАТЬ",false);calc.setEnabled(!m.loading);LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-1,dp(46));bp.setMargins(0,dp(7),0,0);c.addView(calc,bp);calc.setOnClickListener(x->analyze(m));if(!m.error.isEmpty())c.addView(txt(m.error,11,RED,false));return c;}
        TextView rel=txt("Качество данных: "+m.reliability+"% · "+m.ph.source+" / "+m.pa.source+(m.oddSource.isEmpty()?"":" · КФ "+m.oddSource),11,m.reliability>=70?GREEN:AMBER,true);rel.setPadding(0,dp(6),0,dp(4));c.addView(rel);
        addMarket(c,"П1",m.p1,m.p1Odd);addMarket(c,"X",m.px,m.xOdd);addMarket(c,"П2",m.p2,m.p2Odd);addMarket(c,"ТБ 1.5",m.o15,m.o15Odd);addMarket(c,"ТМ 1.5",m.u15,m.u15Odd);addMarket(c,"ТБ 2.5",m.o25,m.o25Odd);addMarket(c,"ТМ 2.5",m.u25,m.u25Odd);addMarket(c,"ТБ 3.5",m.o35,m.o35Odd);addMarket(c,"ТМ 3.5",m.u35,m.u35Odd);addMarket(c,"ОЗ — ДА",m.bttsYes,m.bttsYesOdd);addMarket(c,"ОЗ — НЕТ",m.bttsNo,m.bttsNoOdd);
        if(m.live){TextView lh=txt("БУДУЩИЕ ГОЛЫ С ТЕКУЩЕЙ МИНУТЫ",11,ACCENT,true);lh.setPadding(0,dp(8),0,dp(3));c.addView(lh);addSingle(c,"Ещё 1+ гол",m.next1);addSingle(c,"Ещё 2+ гола",m.next2);addSingle(c,"Ещё 3+ гола",m.next3);}
        TextView au=txt("Показать проверку критериев",12,ACCENT,true);au.setGravity(Gravity.CENTER);au.setPadding(0,dp(7),0,0);c.addView(au);au.setOnClickListener(x->toggleAudit(c,au,m));return c;
    }

    private void addMarket(LinearLayout p,String label,int prob,double odd){if(prob<0||odd<MIN_ODD)return;double ev=prob/100.0*odd-1.0,market=100.0/odd,edge=prob-market;boolean good=ev>0;LinearLayout b=v();b.setPadding(dp(9),dp(7),dp(9),dp(7));b.setBackground(box(good?GREEN:CARD2,10));LinearLayout row=new LinearLayout(this);row.addView(txt(label,12,Color.WHITE,true),new LinearLayout.LayoutParams(0,-2,1));row.addView(txt(prob+"% · КФ "+String.format(Locale.US,"%.2f",odd),12,Color.WHITE,true));b.addView(row);b.addView(txt("рынок "+String.format(Locale.US,"%.1f",market)+"% · перевес "+String.format(Locale.US,"%+.1f",edge)+" п.п. · EV "+String.format(Locale.US,"%+.1f%%",ev*100),9,good?Color.WHITE:MUTED,false));LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-1,-2);bp.setMargins(0,dp(4),0,0);p.addView(b,bp);}
    private void addSingle(LinearLayout b,String t,int p){LinearLayout x=v();x.setGravity(Gravity.CENTER);x.setBackground(box(CARD2,10));x.addView(txt(t,10,MUTED,true));x.addView(txt(p<0?"—":p+"%",15,Color.WHITE,true));LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(58));lp.setMargins(0,dp(3),0,0);b.addView(x,lp);}
    private void toggleAudit(LinearLayout c,TextView ctl,Match m){Object tag=ctl.getTag();if(tag instanceof View){c.removeView((View)tag);ctl.setTag(null);return;}LinearLayout b=v();b.setPadding(dp(8),dp(8),dp(8),dp(8));b.setBackground(box(CARD2,10));for(Criterion x:m.criteria){LinearLayout r=new LinearLayout(this);LinearLayout l=v();l.addView(txt(x.name,11,x.available?TEXT:MUTED,true));l.addView(txt(x.detail,9,MUTED,false));r.addView(l,new LinearLayout.LayoutParams(0,-2,1));r.addView(txt(x.available?(x.p1+" / "+x.px+" / "+x.p2+"% · вес "+fmt(x.w)):"—",10,x.available?GREEN:MUTED,true));b.addView(r);}c.addView(b);ctl.setTag(b);}

    private void scanMarkets(Object node,Match m,String inherited){if(node instanceof JSONObject){JSONObject o=(JSONObject)node;String market=inherited,n=o.optString("name","");if(!n.isEmpty())market=n;String n2=o.optString("name_m","");if(!n2.isEmpty())market=n2;if(o.has("P1")||o.has("P2")||o.has("X")||o.has("Tb")||o.has("Tm")||o.has("Y")||o.has("N"))applyBlock(o,market,m);JSONObject blocks=o.optJSONObject("blocks");if(blocks!=null){Iterator<String>it=blocks.keys();while(it.hasNext()){Object b=blocks.opt(it.next());if(b instanceof JSONObject)applyBlock((JSONObject)b,market,m);}}Iterator<String>it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)scanMarkets(v,m,market);}}else if(node instanceof JSONArray){JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)scanMarkets(v,m,inherited);}}}
    private void applyBlock(JSONObject b,String market,Match m){String ml=(market==null?"":market).toLowerCase(Locale.ROOT);boolean first=ml.contains("1-й тайм")||ml.contains("1 тайм")||ml.contains("первый тайм")||ml.contains("1st half")||ml.contains("first half");if(!first&&(b.has("P1")||b.has("P2")||b.has("X"))&&m.p1Odd<=0){m.p1Odd=odd(b.opt("P1"));m.xOdd=odd(b.opt("X"));m.p2Odd=odd(b.opt("P2"));}if(!first&&(b.has("Tb")||b.has("Tm"))){double line=marketLine(b),ov=odd(b.opt("Tb")),un=odd(b.opt("Tm"));if(close(line,1.5)){m.o15Odd=ov;m.u15Odd=un;}else if(close(line,2.5)){m.o25Odd=ov;m.u25Odd=un;}else if(close(line,3.5)){m.o35Odd=ov;m.u35Odd=un;}}if((ml.contains("обе забьют")||ml.contains("both teams"))&&(b.has("Y")||b.has("N"))){m.bttsYesOdd=odd(b.opt("Y"));m.bttsNoOdd=odd(b.opt("N"));}}
    private double marketLine(JSONObject b){double v=num(b.opt("Tot"));if(v<=0)v=lineOutcome(b.opt("Tb"));if(v<=0)v=lineOutcome(b.opt("Tm"));return v;}
    private double lineOutcome(Object x){if(!(x instanceof JSONObject))return 0;JSONObject o=(JSONObject)x;double v=num(o.opt("lv"));if(v==0)v=num(o.opt("lvt"));if(v==0)v=num(o.opt("lvl"));return Math.abs(v);}
    private double odd(Object x){return x instanceof JSONObject?num(((JSONObject)x).opt("kf")):num(x);}
    private boolean close(double a,double b){return Math.abs(a-b)<.06;}

    private JSONObject getJson(String u,String ref)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(u).openConnection();c.setConnectTimeout(6000);c.setReadTimeout(9000);c.setRequestProperty("Accept","application/json, text/plain, */*");c.setRequestProperty("Accept-Language","ru-RU,ru;q=0.9,en;q=0.7");c.setRequestProperty("User-Agent","Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36");if(ref!=null)c.setRequestProperty("Referer",ref);int code=c.getResponseCode();InputStream is=code>=200&&code<300?c.getInputStream():c.getErrorStream();String body=read(is);c.disconnect();if(code<200||code>=300)throw new Exception("HTTP "+code);if(body.trim().isEmpty())throw new Exception("Пустой ответ");return new JSONObject(body);}
    private String read(InputStream is)throws Exception{if(is==null)return"";BufferedReader r=new BufferedReader(new InputStreamReader(is));StringBuilder b=new StringBuilder();String s;while((s=r.readLine())!=null)b.append(s);r.close();return b.toString();}
    private String enc(String s)throws Exception{return URLEncoder.encode(s,"UTF-8");}
    private boolean isFootballName(String s){String x=s==null?"":s.toLowerCase(Locale.ROOT);return x.equals("football")||x.equals("soccer")||x.contains("футбол");}
    private boolean matchesQuery(Match m,String q){String k=norm(q),all=norm(m.home+" "+m.away+" "+m.league+" "+m.country);return all.contains(k)||tokenHit(all,k);}
    private boolean tokenHit(String all,String q){for(String t:q.split(" "))if(t.length()>2&&!all.contains(t))return false;return true;}
    private boolean excluded(String s){String x=(s==null?"":s).toLowerCase(Locale.ROOT).replace('×','x');String[]bad={"3x3","4x4","5x5","6x6","7x7","8x8","3 х 3","4 х 4","5 х 5","6 х 6","7 х 7","8 х 8","futsal","футзал","мини-футбол","мини футбол","mini football","indoor","cyber","кибер","esport","e-sport","virtual","виртуал","penalty shootout","серия пенальти"};for(String b:bad)if(x.contains(b))return true;return false;}
    private void dedupe(List<Match> a){Map<String,Match> m=new LinkedHashMap<>();for(Match x:a)m.put(x.id.isEmpty()?norm(x.home+x.away+String.valueOf(x.ts)):x.id,x);a.clear();a.addAll(m.values());}
    private void sortMatches(List<Match>a){Collections.sort(a,new Comparator<Match>(){@Override public int compare(Match x,Match y){int c=Integer.compare(countryRank(x.country),countryRank(y.country));if(c!=0)return c;c=Integer.compare(leagueRank(x.league),leagueRank(y.league));if(c!=0)return c;return Long.compare(x.ts,y.ts);}});}
    private int countryRank(String c){String x=norm(c);String[]p={"international","europe","england","spain","italy","germany","france","russia","portugal","netherlands","belgium","turkey","brazil","argentina","usa","mexico"};for(int i=0;i<p.length;i++)if(x.contains(p[i]))return i;return 100;}
    private int leagueRank(String l){String x=norm(l);String[]p={"champions league","лига чемпионов","europa league","лига европы","conference league","premier league","премьер лига","la liga","serie a","bundesliga","ligue 1","primeira","eredivisie","championship"};for(int i=0;i<p.length;i++)if(x.contains(norm(p[i])))return i;return 100;}
    private List<Match> cloneList(List<Match>src){List<Match>r=new ArrayList<>();for(Match x:src){Match m=new Match();m.id=x.id;m.home=x.home;m.away=x.away;m.league=x.league;m.country=x.country;m.ts=x.ts;m.live=x.live;m.hg=x.hg;m.ag=x.ag;m.min=x.min;r.add(m);}return r;}
    private int[] parsePairScore(String s){if(s==null)return null;java.util.regex.Matcher q=java.util.regex.Pattern.compile("(\\d+)\\s*[:\\-]\\s*(\\d+)").matcher(s);if(!q.find())return null;return new int[]{Integer.parseInt(q.group(1)),Integer.parseInt(q.group(2))};}
    private int similarity(String a,String b){String x=norm(a),y=norm(b);if(x.equals(y))return 100;if(x.contains(y)||y.contains(x))return 80;int sc=0;for(String t:x.split(" "))if(t.length()>2&&y.contains(t))sc+=20;return sc;}
    private String norm(String s){if(s==null)return"";return s.toLowerCase(Locale.ROOT).replace('ё','е').replaceAll("[^\\p{L}\\p{N}]+"," ").trim();}
    private double num(Object o){if(o==null)return 0;try{return Double.parseDouble(String.valueOf(o).replace("%","").replace(',','.').replaceAll("[^0-9.\\-]",""));}catch(Exception e){return 0;}}
    private String msg(Exception e){return e.getMessage()==null?e.getClass().getSimpleName():e.getMessage();}
    private double clamp(double v,double a,double b){return Math.max(a,Math.min(b,v));}
    private String fmt(double v){return String.format(Locale.US,"%.1f",v);}
    private String time(long ts){return ts<=0?"—":new SimpleDateFormat("dd.MM HH:mm",Locale.getDefault()).format(new Date(ts*1000));}
    private LinearLayout v(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private Button tab(String s,boolean on){Button b=new Button(this);b.setText(s);b.setTextColor(Color.WHITE);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setBackground(box(on?ACCENT:CARD2,11));return b;}
    private TextView txt(String s,float z,int c,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}
    private GradientDrawable box(int c,int r){GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(dp(r));return d;}
    private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}

    static class Hist{int eventId,gf,ga,h1gf=-1,h1ga=-1;boolean teamHome;}
    static class Profile{String source="";long loadedAt;int n,w,d,l,homeN,awayN,h1N;double gf,ga,homeGF,homeGA,awayGF,awayGA,h1GF,h1GA,xgF,xgA,sotF,sotA,shF,shA,posF,posA,corF,corA,cardF,cardA;int xgN,sotN,shN,posN,corN,cardN,statN;void addResult(Hist h){if(n>=20)return;n++;gf+=h.gf;ga+=h.ga;if(h.gf>h.ga)w++;else if(h.gf==h.ga)d++;else l++;if(h.teamHome){homeN++;homeGF+=h.gf;homeGA+=h.ga;}else{awayN++;awayGF+=h.gf;awayGA+=h.ga;}if(h.h1gf>=0&&h.h1ga>=0){h1N++;h1GF+=h.h1gf;h1GA+=h.h1ga;}}double gf(){return n>0?gf/n:1.2;}double ga(){return n>0?ga/n:1.2;}double form(){return n>0?(3.0*w+d)/(3.0*n):.5;}double homeGF(){return homeN>0?homeGF/homeN:gf();}double homeGA(){return homeN>0?homeGA/homeN:ga();}double awayGF(){return awayN>0?awayGF/awayN:gf();}double awayGA(){return awayN>0?awayGA/awayN:ga();}double xgF(){return xgN>0?xgF/xgN:0;}double xgA(){return xgN>0?xgA/xgN:0;}double sotF(){return sotN>0?sotF/sotN:0;}double sotA(){return sotN>0?sotA/sotN:0;}double shF(){return shN>0?shF/shN:0;}double shA(){return shN>0?shA/shN:0;}double posF(){return posN>0?posF/posN:0;}double corF(){return corN>0?corF/corN:0;}double corA(){return corN>0?corA/corN:0;}double cardF(){return cardN>0?cardF/cardN:0;}double cardA(){return cardN>0?cardA/cardN:0;}}
    static class Criterion{String name,detail;boolean available;double w,lh,la;int p1,px,p2;Criterion(String n,boolean a,double w,int p1,int px,int p2,double lh,double la,String d){name=n;available=a;this.w=w;this.p1=p1;this.px=px;this.p2=p2;this.lh=lh;this.la=la;detail=d;}}
    static class Match{String id="",country="Прочее",league="",home="",away="",error="",oddSource="";long ts;boolean live=false,loading=false,ready=false;int min=0,hg=-1,ag=-1,h1g=-1,a1g=-1,p1=-1,px=-1,p2=-1,reliability=0,o15=-1,u15=-1,o25=-1,u25=-1,o35=-1,u35=-1,bttsYes=-1,bttsNo=-1,next1=-1,next2=-1,next3=-1,nextHome=-1,nextAway=-1,noMore=-1;double p1Odd,xOdd,p2Odd,o15Odd,u15Odd,o25Odd,u25Odd,o35Odd,u35Odd,bttsYesOdd,bttsNoOdd,liveXgH,liveXgA,liveSotH,liveSotA,liveShotsH,liveShotsA,lambdaH,lambdaA;Profile ph,pa;final List<Criterion>criteria=new ArrayList<>();}
}
