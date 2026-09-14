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
import android.view.inputmethod.EditorInfo;
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
import java.net.URL;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends Activity {
    private static final String BC_PRE = "https://ad.betcity.ru/d/off/events?id_sp=1&ch_id=0&gr_id=0&add=main,ext,name_sp,name_ch&rev=2&ver=69&csn=ooca9s";
    private static final String[] BC_LIVE = {
            "https://ad.betcity.ru/d/on_air/bets?id_sp=1&rev=8&add=dep_event&template=1&ver=69&csn=ooca9s",
            "https://ad.betcity.ru/d/on_air/bets?id_sp=1&rev=2&template=1&ver=69&csn=ooca9s"
    };
    private static final String SOFA = "https://www.sofascore.com/api/v1/";
    private static final int BG=Color.rgb(10,15,20), CARD=Color.rgb(20,28,36), CARD2=Color.rgb(26,36,46),
            TEXT=Color.rgb(240,244,247), MUTED=Color.rgb(145,157,169), GREEN=Color.rgb(38,166,91),
            ACCENT=Color.rgb(64,145,255), RED=Color.rgb(220,80,80), AMBER=Color.rgb(225,155,45);

    private final ExecutorService io=Executors.newFixedThreadPool(4);
    private final AtomicBoolean busy=new AtomicBoolean(false);
    private final Handler handler=new Handler(Looper.getMainLooper());
    private final List<Match> matches=new ArrayList<>();
    private boolean liveMode=false;
    private String query="", status="Введите название команды или лиги";

    @Override public void onCreate(Bundle b){super.onCreate(b);render();}
    @Override public void onDestroy(){handler.removeCallbacksAndMessages(null);io.shutdownNow();super.onDestroy();}

    private final Runnable liveRefresh=new Runnable(){@Override public void run(){if(liveMode&&!query.isEmpty()){search(query,true);handler.postDelayed(this,30000);}}};
    private void restartLiveTimer(){handler.removeCallbacks(liveRefresh);if(liveMode&&!query.isEmpty())handler.postDelayed(liveRefresh,30000);}

    private void search(String q, boolean live){
        q=q==null?"":q.trim();
        if(q.length()<2){status="Введите не менее 2 символов";render();return;}
        query=q;liveMode=live;restartLiveTimer();
        if(!busy.compareAndSet(false,true))return;
        status=live?"Поиск LIVE в BETCITY…":"Поиск линии BETCITY…";render();
        final String fq=q;
        io.execute(()->{
            List<Match> found=new ArrayList<>();String err="";
            try{
                found=loadBetcitySearch(fq,live);
                int enrichCount=Math.min(found.size(),12);
                for(int i=0;i<enrichCount;i++){
                    Match m=found.get(i);
                    try{enrichStatistics(m);}catch(Exception ignored){}
                    calculateModel(m,live);
                }
                for(int i=enrichCount;i<found.size();i++)calculateModel(found.get(i),live);
            }catch(Exception e){err=message(e);}
            final List<Match> result=found;final String ferr=err;
            runOnUiThread(()->{
                matches.clear();matches.addAll(result);
                status=result.isEmpty()?(!ferr.isEmpty()?ferr:"Совпадений в футболе BETCITY не найдено"):
                        "Найдено: "+result.size()+" · BETCITY · только футбол 11×11";
                busy.set(false);render();
            });
        });
    }

    private List<Match> loadBetcitySearch(String q,boolean live)throws Exception{
        Map<String,Match> all=new LinkedHashMap<>();
        if(live){
            Exception last=null;
            for(String u:BC_LIVE){try{JSONObject root=getJson(u,true);walkFootball(footballNode(root),"",true,all);}catch(Exception e){last=e;}}
            if(all.isEmpty()&&last!=null)throw last;
        }else{
            JSONObject root=getJson(BC_PRE,false);walkFootball(footballNode(root),"",false,all);
        }
        String k=norm(q);List<Match> out=new ArrayList<>();
        for(Match m:all.values()){
            if(norm(m.home).contains(k)||norm(m.away).contains(k)||norm(m.league).contains(k)||norm(m.country).contains(k))out.add(m);
        }
        Collections.sort(out,(a,b)->Long.compare(a.ts,b.ts));
        if(out.size()>30)return new ArrayList<>(out.subList(0,30));
        return out;
    }

    private Object footballNode(JSONObject root){
        JSONObject reply=root.optJSONObject("reply");if(reply==null)reply=root;
        JSONObject sports=reply.optJSONObject("sports");
        if(sports!=null){Object f=sports.opt("1");if(f!=null)return f;return new JSONObject();}
        JSONArray sa=reply.optJSONArray("sports");
        if(sa!=null){for(int i=0;i<sa.length();i++){JSONObject s=sa.optJSONObject(i);if(s!=null&&s.optInt("id_sp",-1)==1)return s;}return new JSONObject();}
        return reply;
    }

    private void walkFootball(Object node,String league,boolean wantLive,Map<String,Match> out){
        if(node instanceof JSONObject){
            JSONObject o=(JSONObject)node;
            if(o.has("id_sp")&&o.optInt("id_sp",1)!=1)return;
            String next=league;if(o.has("name_ch"))next=o.optString("name_ch",league);
            if(o.has("id_ev")&&o.has("name_ht")&&o.has("name_at")){
                Match m=parseEvent(o,next,wantLive);if(m!=null)out.put(m.id,m);
            }
            Iterator<String> it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)walkFootball(v,next,wantLive,out);}
        }else if(node instanceof JSONArray){JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)walkFootball(v,league,wantLive,out);}}
    }

    private Match parseEvent(JSONObject e,String league,boolean wantLive){
        if(e.has("id_sp")&&e.optInt("id_sp",1)!=1)return null;
        String home=e.optString("name_ht","").trim(),away=e.optString("name_at","").trim(),clean=cleanLeague(league);
        if(home.length()<2||away.length()<2||excludedFootball(clean+" "+home+" "+away))return null;
        if(!wantLive&&truth(e.opt("is_live")))return null;
        Match m=new Match();m.id=String.valueOf(e.optLong("id_ev",e.optInt("id_ev",0)));m.home=home;m.away=away;m.league=clean;m.country=countryFromLeague(clean);m.ts=parseBetcityDate(e.opt("date_ev"));
        parseScore(e.optString("sc_ev",""),m,false);parseScore(e.optString("sc_ext_ev",""),m,true);m.min=findMinute(e);parseExtStats(e,m);scanMarkets(e,m,"");return m;
    }

    private boolean excludedFootball(String s){
        String x=(s==null?"":s.toLowerCase(Locale.ROOT)).replace('×','x');
        String[] bad={"3x3","4x4","5x5","6x6","7x7","8x8","3 х 3","4 х 4","5 х 5","6 х 6","7 х 7","8 х 8","futsal","футзал","mini football","мини-футбол","мини футбол","indoor","кибер","cyber","esport","e-sport","virtual","виртуал","penalty shootout","серия пенальти","dota","hockey","хоккей","tennis","теннис","snooker","снукер","basketball","баскетбол"};
        for(String b:bad)if(x.contains(b))return true;return false;
    }
    private String cleanLeague(String s){if(s==null||s.trim().isEmpty())return"Прочие соревнования";return s.trim().replaceFirst("(?i)^soccer\\.\\s*","").replaceFirst("(?i)^football\\.\\s*","");}
    private String countryFromLeague(String s){if(s==null)return"Прочее";String[]p=s.split("\\.");String c=p.length>1?p[0].trim():"Прочее";if(c.isEmpty()||c.length()>30)c="Прочее";if(c.equalsIgnoreCase("World"))c="Мир";if(c.equalsIgnoreCase("International"))c="Международные";return c;}

    private void enrichStatistics(Match m)throws Exception{
        TeamProfile h=loadSofaProfile(m.home),a=loadSofaProfile(m.away);
        if(h!=null){m.hp=h;m.sampleH=h.n;}if(a!=null){m.ap=a;m.sampleA=a.n;}
        if(h!=null&&a!=null){m.statsSource="SofaScore";}else m.statsSource="частично";
    }

    private TeamProfile loadSofaProfile(String team)throws Exception{
        int id=findSofaTeam(team);if(id<=0)return null;
        TeamProfile p=new TeamProfile();int statBudget=6;
        for(int page=0;page<2&&p.n<20;page++){
            JSONObject root=getJson(SOFA+"team/"+id+"/events/last/"+page,false);JSONArray ev=root.optJSONArray("events");if(ev==null)break;
            for(int i=0;i<ev.length()&&p.n<20;i++){
                JSONObject e=ev.optJSONObject(i);if(e==null)continue;
                JSONObject hs=e.optJSONObject("homeScore"),as=e.optJSONObject("awayScore");if(hs==null||as==null)continue;
                int hg=hs.optInt("current",-1),ag=as.optInt("current",-1);if(hg<0||ag<0)continue;
                JSONObject ht=e.optJSONObject("homeTeam"),at=e.optJSONObject("awayTeam");if(ht==null||at==null)continue;
                boolean home=ht.optInt("id",-1)==id,away=at.optInt("id",-1)==id;if(!home&&!away)continue;
                int gf=home?hg:ag,ga=home?ag:hg;p.add(gf,ga,home);
                if(statBudget>0){try{loadSofaEventStats(e.optLong("id",0),id,home,p);statBudget--;}catch(Exception ignored){}}
            }
        }
        return p.n==0?null:p;
    }

    private int findSofaTeam(String name)throws Exception{
        String enc=URLEncoder.encode(name,"UTF-8");JSONObject root=getJson(SOFA+"search/all?q="+enc,false);JSONArray r=root.optJSONArray("results");if(r==null)return -1;
        String nk=norm(name);int best=-1,bestScore=-1;
        for(int i=0;i<r.length();i++){
            JSONObject item=r.optJSONObject(i);if(item==null)continue;JSONObject e=item.optJSONObject("entity");if(e==null)continue;
            JSONObject sport=e.optJSONObject("sport");if(sport!=null&&!"football".equalsIgnoreCase(sport.optString("slug",sport.optString("name",""))))continue;
            String en=e.optString("name","");String ek=norm(en);int score=similarity(nk,ek);if(score>bestScore){bestScore=score;best=e.optInt("id",-1);}
        }
        return bestScore>=45?best:-1;
    }
    private int similarity(String a,String b){if(a.equals(b))return 100;if(a.contains(b)||b.contains(a))return 80;String[]aa=a.split(" "),bb=b.split(" ");int hit=0;for(String x:aa)for(String y:bb)if(x.length()>2&&x.equals(y))hit++;return Math.min(75,hit*30);}

    private void loadSofaEventStats(long eventId,int teamId,boolean teamHome,TeamProfile p)throws Exception{
        if(eventId<=0)return;JSONObject root=getJson(SOFA+"event/"+eventId+"/statistics",false);JSONArray periods=root.optJSONArray("statistics");if(periods==null)return;
        JSONObject all=null;for(int i=0;i<periods.length();i++){JSONObject x=periods.optJSONObject(i);if(x!=null&&"ALL".equalsIgnoreCase(x.optString("period"))){all=x;break;}}if(all==null&&periods.length()>0)all=periods.optJSONObject(0);if(all==null)return;
        JSONArray groups=all.optJSONArray("groups");if(groups==null)return;
        for(int g=0;g<groups.length();g++){JSONObject gr=groups.optJSONObject(g);JSONArray items=gr==null?null:gr.optJSONArray("statisticsItems");if(items==null)continue;for(int i=0;i<items.length();i++){
            JSONObject it=items.optJSONObject(i);if(it==null)continue;String n=it.optString("name","").toLowerCase(Locale.ROOT);double h=numObj(it.opt("home")),a=numObj(it.opt("away"));double v=teamHome?h:a;
            if(n.contains("expected goals"))p.addXg(v);else if(n.contains("shots on target"))p.addSot(v);else if(n.equals("total shots"))p.addShots(v);else if(n.contains("ball possession"))p.addPoss(v);else if(n.contains("corner kicks"))p.addCorners(v);else if(n.contains("yellow cards"))p.addCards(v);
        }}
    }

    private void calculateModel(Match m,boolean live){
        m.criteria.clear();TeamProfile h=m.hp,a=m.ap;
        boolean hist=h!=null&&a!=null&&h.n>=5&&a.n>=5;
        double lh=1.36,la=1.10;
        if(hist){
            double hAtk=clamp(h.gf()/1.35,.55,1.70),hDef=clamp(h.ga()/1.25,.55,1.70),aAtk=clamp(a.gf()/1.15,.55,1.70),aDef=clamp(a.ga()/1.35,.55,1.70);
            double fd=h.form()-a.form();lh=clamp(1.36*hAtk*aDef*(1+.18*fd),.3,3.2);la=clamp(1.10*aAtk*hDef*(1-.14*fd),.25,2.9);
            addCrit(m,"Форма последних матчей",1.2,1.36*(1+.45*fd),1.10*(1-.35*fd),"матчей "+h.n+" / "+a.n);
            addCrit(m,"Атака / оборона",1.8,1.36*hAtk*aDef,1.10*aAtk*hDef,String.format(Locale.US,"GF/GA %.2f/%.2f · %.2f/%.2f",h.gf(),h.ga(),a.gf(),a.ga()));
            if(h.homeN>=3&&a.awayN>=3)addCrit(m,"Дом / выезд",1.0,clamp(h.homeGf()/1.35,.5,1.8)*1.36,clamp(a.awayGf()/1.15,.5,1.8)*1.10,"дом "+h.homeN+" · выезд "+a.awayN);else addMissing(m,"Дом / выезд",1.0);
            if(h.xgN>=3&&a.xgN>=3)addCrit(m,"xG / xGA",2.0,clamp(h.xg()/1.35,.45,1.8)*1.36,clamp(a.xg()/1.15,.45,1.8)*1.10,String.format(Locale.US,"xG %.2f · %.2f",h.xg(),a.xg()));else addMissing(m,"xG / xGA",2.0);
            if(h.sotN>=3&&a.sotN>=3)addCrit(m,"Удары в створ",1.4,1.36*clamp(h.sot()/4.2,.55,1.6),1.10*clamp(a.sot()/3.8,.55,1.6),String.format(Locale.US,"%.1f · %.1f",h.sot(),a.sot()));else addMissing(m,"Удары в створ",1.4);
            if(h.shotsN>=3&&a.shotsN>=3)addCrit(m,"Удары",.9,1.36*clamp(h.shots()/12.0,.65,1.45),1.10*clamp(a.shots()/11.0,.65,1.45),String.format(Locale.US,"%.1f · %.1f",h.shots(),a.shots()));else addMissing(m,"Удары",.9);
            if(h.cornerN>=3&&a.cornerN>=3)addCrit(m,"Угловые",.45,1.36*clamp(h.corners()/5.0,.75,1.3),1.10*clamp(a.corners()/4.5,.75,1.3),String.format(Locale.US,"%.1f · %.1f",h.corners(),a.corners()));else addMissing(m,"Угловые",.45);
            if(h.possN>=3&&a.possN>=3)addCrit(m,"Владение",.35,1.36*clamp(h.poss()/50,.85,1.15),1.10*clamp(a.poss()/50,.85,1.15),String.format(Locale.US,"%.0f%% · %.0f%%",h.poss(),a.poss()));else addMissing(m,"Владение",.35);
            if(h.cardsN>=3&&a.cardsN>=3)addCrit(m,"Карточки",.25,1.36*clamp(1-(h.cards()-a.cards())*.03,.85,1.15),1.10*clamp(1+(h.cards()-a.cards())*.03,.85,1.15),String.format(Locale.US,"%.1f · %.1f",h.cards(),a.cards()));else addMissing(m,"Карточки",.25);
        }else{
            addMissing(m,"Форма последних матчей",1.2);addMissing(m,"Атака / оборона",1.8);addMissing(m,"Дом / выезд",1.0);addMissing(m,"xG / xGA",2.0);addMissing(m,"Удары в створ",1.4);addMissing(m,"Удары",.9);addMissing(m,"Угловые",.45);addMissing(m,"Владение",.35);addMissing(m,"Карточки",.25);
        }
        addMissing(m,"Сила соперников",1.2);addMissing(m,"Очные встречи",.35);

        double rh=lh,ra=la;
        if(live){
            double rem=clamp((95.0-Math.max(0,m.min))/95.0,0,1),pressure=0;
            if(m.xgH+m.xgA>0)pressure+=.40*(m.xgH-m.xgA);if(m.sotH+m.sotA>0)pressure+=.065*(m.sotH-m.sotA);if(m.shotsH+m.shotsA>0)pressure+=.016*(m.shotsH-m.shotsA);if(m.cornerH+m.cornerA>0)pressure+=.016*(m.cornerH-m.cornerA);if(m.posH+m.posA>0)pressure+=.0025*(m.posH-m.posA);pressure=clamp(pressure,-.7,.7);
            double tempo=1;if(m.xgH+m.xgA>0&&m.min>10)tempo=clamp((m.xgH+m.xgA)/(2.55*Math.max(.2,m.min/90.0)),.7,1.45);
            rh=clamp(lh*rem*tempo*(1+pressure),.01,3);ra=clamp(la*rem*tempo*(1-pressure),.01,3);
            addLiveCrit(m,"LIVE: счёт и минута",2.4,true,rh,ra,"счёт "+Math.max(0,m.hg)+":"+Math.max(0,m.ag)+" · "+m.min+"'");
            addLiveCrit(m,"LIVE xG",2.0,m.xgH+m.xgA>0,lh*rem*clamp(1+.3*(m.xgH-m.xgA),.45,1.65),la*rem*clamp(1-.3*(m.xgH-m.xgA),.45,1.65),m.xg);
            addLiveCrit(m,"LIVE удары в створ",1.5,m.sotH+m.sotA>0,lh*rem*clamp(1+.06*(m.sotH-m.sotA),.55,1.55),la*rem*clamp(1-.06*(m.sotH-m.sotA),.55,1.55),m.shotsOn);
        }
        blend(m,live);
        int hg=Math.max(0,m.hg),ag=Math.max(0,m.ag);
        if(live){nextGoals(m,rh,ra);btts(m,hg,ag,rh,ra);if(m.min<=45){double hr=clamp((48.0-m.min)/48.0,0,1);double hh=lh*.46*hr,ha=la*.46*hr;int[]p=outcomeArray(hg,ag,hh,ha);m.h1p1=p[0];m.h1px=p[1];m.h1p2=p[2];halfTotals(m,0,hh+ha);}else doneHalf(m);}
        else{totals(m,lh+la);btts(m,0,0,lh,la);int[]p=outcomeArray(0,0,lh*.46,la*.46);m.h1p1=p[0];m.h1px=p[1];m.h1p2=p[2];halfTotals(m,0,(lh+la)*.46);}
        if(m.reliability<35||!hist){m.p1=m.px=m.p2=-1;}
    }

    private void addCrit(Match m,String n,double w,double lh,double la,String d){int[]p=outcomeArray(0,0,clamp(lh,.05,4),clamp(la,.05,4));m.criteria.add(new Criterion(n,true,w,p[0],p[1],p[2],d));}
    private void addLiveCrit(Match m,String n,double w,boolean ok,double lh,double la,String d){if(!ok){addMissing(m,n,w);return;}int[]p=outcomeArray(Math.max(0,m.hg),Math.max(0,m.ag),clamp(lh,.01,4),clamp(la,.01,4));m.criteria.add(new Criterion(n,true,w,p[0],p[1],p[2],d));}
    private void addMissing(Match m,String n,double w){m.criteria.add(new Criterion(n,false,w,-1,-1,-1,"нет данных"));}
    private void blend(Match m,boolean live){double sw=0,all=0,a=0,b=0,c=0;for(Criterion x:m.criteria){all+=x.weight;if(x.available){sw+=x.weight;a+=x.p1*x.weight;b+=x.px*x.weight;c+=x.p2*x.weight;}}if(sw>0){m.p1=(int)Math.round(a/sw);m.px=(int)Math.round(b/sw);m.p2=Math.max(0,100-m.p1-m.px);}double sample=Math.min(1.0,Math.min(m.sampleH,m.sampleA)/10.0),coverage=all>0?sw/all:0;m.reliability=(int)Math.round(100*clamp(.7*coverage+.3*sample,0,1));}
    private int[] outcomeArray(int bh,int ba,double lh,double la){double p1=0,px=0,p2=0;for(int h=0;h<12;h++)for(int a=0;a<12;a++){double p=pois(h,lh)*pois(a,la),fh=bh+h,fa=ba+a;if(fh>fa)p1+=p;else if(fh==fa)px+=p;else p2+=p;}double s=p1+px+p2;if(s<=0)return new int[]{-1,-1,-1};int a=(int)Math.round(p1/s*100),b=(int)Math.round(px/s*100);return new int[]{a,b,100-a-b};}
    private void totals(Match m,double l){m.o15=atLeast(l,2);m.u15=100-m.o15;m.o25=atLeast(l,3);m.u25=100-m.o25;}
    private void nextGoals(Match m,double lh,double la){double l=lh+la;m.next1=atLeast(l,1);m.next2=atLeast(l,2);m.next3=atLeast(l,3);double no=Math.exp(-l),any=1-no,sum=lh+la;m.noMore=(int)Math.round(no*100);m.nextHome=sum>0?(int)Math.round(any*lh/sum*100):0;m.nextAway=Math.max(0,100-m.noMore-m.nextHome);}
    private int atLeast(double l,int n){double less=0;for(int i=0;i<n;i++)less+=pois(i,l);return(int)Math.round(clamp(1-less,0,1)*100);}
    private void halfTotals(Match m,int cur,double l){m.ho05=over(cur,l,0);m.hu05=100-m.ho05;m.ho15=over(cur,l,1);m.hu15=100-m.ho15;int[]a=asianOne(cur,l);m.ho10=a[0];m.hPush10=a[1];m.hu10=a[2];}
    private int[] asianOne(int cur,double l){double u=0,p=0,o=0;for(int i=0;i<12;i++){double q=pois(i,l);int t=cur+i;if(t<1)u+=q;else if(t==1)p+=q;else o+=q;}int ui=(int)Math.round(u*100),pi=(int)Math.round(p*100);return new int[]{100-ui-pi,pi,ui};}
    private int over(int cur,double l,int t){if(cur>t)return 100;double p=0;for(int i=0;i<12;i++)if(cur+i>t)p+=pois(i,l);return(int)Math.round(clamp(p,0,1)*100);}
    private void btts(Match m,int hg,int ag,double lh,double la){double y=0,s=0;for(int h=0;h<12;h++)for(int a=0;a<12;a++){double p=pois(h,lh)*pois(a,la);s+=p;if(hg+h>0&&ag+a>0)y+=p;}m.bttsYes=(int)Math.round(y/Math.max(.0001,s)*100);m.bttsNo=100-m.bttsYes;}
    private void doneHalf(Match m){m.h1p1=m.h1px=m.h1p2=m.ho05=m.hu05=m.ho10=m.hu10=m.hPush10=m.ho15=m.hu15=-1;}
    private double pois(int k,double l){double f=1;for(int i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f;}

    private void scanMarkets(Object node,Match m,String inherited){
        if(node instanceof JSONObject){JSONObject o=(JSONObject)node;String market=inherited,n=o.optString("name","");if(!n.isEmpty())market=n;String n2=o.optString("name_m","");if(!n2.isEmpty())market=n2;if(o.has("P1")||o.has("P2")||o.has("X")||o.has("Tb")||o.has("Tm")||o.has("Y")||o.has("N"))applyBlock(o,market,m);JSONObject blocks=o.optJSONObject("blocks");if(blocks!=null){Iterator<String>bi=blocks.keys();while(bi.hasNext()){Object b=blocks.opt(bi.next());if(b instanceof JSONObject)applyBlock((JSONObject)b,market,m);}}Iterator<String>it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)scanMarkets(v,m,market);}}
        else if(node instanceof JSONArray){JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)scanMarkets(v,m,inherited);}}
    }
    private void applyBlock(JSONObject b,String market,Match m){String ml=(market==null?"":market).toLowerCase(Locale.ROOT),firstKeys="1-й тайм 1 тайм первый тайм 1st half first half";boolean first=firstKeys.contains(ml);if(b.has("P1")||b.has("P2")||b.has("X")){if(first){m.hp1Odd=odd(b.opt("P1"));m.hxOdd=odd(b.opt("X"));m.hp2Odd=odd(b.opt("P2"));}else if(m.p1Odd<=0){m.p1Odd=odd(b.opt("P1"));m.xOdd=odd(b.opt("X"));m.p2Odd=odd(b.opt("P2"));}}if(b.has("Tb")||b.has("Tm")){double line=marketLine(b),ov=odd(b.opt("Tb")),un=odd(b.opt("Tm"));if(first){if(close(line,.5)){m.ho05Odd=ov;m.hu05Odd=un;}else if(close(line,1)){m.ho10Odd=ov;m.hu10Odd=un;}else if(close(line,1.5)){m.ho15Odd=ov;m.hu15Odd=un;}}else{if(close(line,1.5)){m.o15Odd=ov;m.u15Odd=un;}else if(close(line,2.5)){m.o25Odd=ov;m.u25Odd=un;}}}if((ml.contains("обе забьют")||ml.contains("both teams"))&&(b.has("Y")||b.has("N"))){m.bttsYesOdd=odd(b.opt("Y"));m.bttsNoOdd=odd(b.opt("N"));}}
    private double marketLine(JSONObject b){double v=numObj(b.opt("Tot"));if(v<=0)v=lineFromOutcome(b.opt("Tb"));if(v<=0)v=lineFromOutcome(b.opt("Tm"));return v;}private double lineFromOutcome(Object x){if(!(x instanceof JSONObject))return 0;JSONObject o=(JSONObject)x;double v=numObj(o.opt("lv"));if(v==0)v=numObj(o.opt("lvt"));return Math.abs(v);}private double odd(Object x){if(x instanceof JSONObject)return numObj(((JSONObject)x).opt("kf"));return numObj(x);}private boolean close(double a,double b){return Math.abs(a-b)<.06;}

    private void parseExtStats(JSONObject e,Match m){scanStats(e,m);m.shots=pair(m.shotsH,m.shotsA,"");m.shotsOn=pair(m.sotH,m.sotA,"");m.possession=pair(m.posH,m.posA,"%");m.xg=pairD(m.xgH,m.xgA);m.corners=pair(m.cornerH,m.cornerA,"");m.cards=pair(m.cardH,m.cardA,"");}
    private void scanStats(Object node,Match m){if(node instanceof JSONObject){JSONObject o=(JSONObject)node;if(o.has("name_ext")&&o.has("value_ext"))applyStat(o.optString("name_ext",""),o.opt("value_ext"),m);Iterator<String>it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)scanStats(v,m);}}else if(node instanceof JSONArray){JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)scanStats(v,m);}}}
    private void applyStat(String name,Object value,Match m){String k=name.toLowerCase(Locale.ROOT);double[]p=parsePair(value);if(p==null)return;if(k.contains("expected")||k.equals("xg")||k.contains("ожидаем")){m.xgH=p[0];m.xgA=p[1];}else if(k.contains("в створ")||k.contains("on target")){m.sotH=p[0];m.sotA=p[1];}else if(k.contains("удар")||k.contains("shots")){m.shotsH=p[0];m.shotsA=p[1];}else if(k.contains("владен")||k.contains("possession")){m.posH=p[0];m.posA=p[1];}else if(k.contains("углов")||k.contains("corner")){m.cornerH=p[0];m.cornerA=p[1];}else if(k.contains("карточ")||k.contains("yellow")){m.cardH=p[0];m.cardA=p[1];}}
    private double[] parsePair(Object v){String s=String.valueOf(v);String[]a=s.split("\\s*[:\\-–—]\\s*|\\s+");List<Double>n=new ArrayList<>();for(String q:a){double x=numObj(q);if(x!=0||q.matches(".*0.*"))n.add(x);}return n.size()>=2?new double[]{n.get(0),n.get(1)}:null;}

    private void render(){
        LinearLayout root=v();root.setBackgroundColor(BG);root.setPadding(dp(14),dp(10),dp(14),dp(10));TextView title=txt("DENZL",26,TEXT,true);title.setGravity(Gravity.CENTER);root.addView(title);TextView sub=txt("Только футбол 11×11 · BETCITY линия · статистика SofaScore",12,MUTED,false);sub.setGravity(Gravity.CENTER);root.addView(sub);
        LinearLayout tabs=new LinearLayout(this);tabs.setWeightSum(2);Button line=tab("ЛИНИЯ",!liveMode),live=tab("LIVE",liveMode);tabs.addView(line,new LinearLayout.LayoutParams(0,dp(50),1));tabs.addView(live,new LinearLayout.LayoutParams(0,dp(50),1));LinearLayout.LayoutParams tp=new LinearLayout.LayoutParams(-1,-2);tp.setMargins(0,dp(8),0,0);root.addView(tabs,tp);
        line.setOnClickListener(v->{liveMode=false;handler.removeCallbacks(liveRefresh);matches.clear();status="Введите название команды или лиги";render();});live.setOnClickListener(v->{liveMode=true;matches.clear();status="Введите название команды или лиги";render();restartLiveTimer();});
        LinearLayout sr=new LinearLayout(this);EditText ed=new EditText(this);ed.setHint("Например: Спартак, Арсенал, Премьер-лига");ed.setText(query);ed.setTextColor(TEXT);ed.setHintTextColor(MUTED);ed.setSingleLine(true);ed.setImeOptions(EditorInfo.IME_ACTION_SEARCH);ed.setBackground(box(CARD2,12));ed.setPadding(dp(12),0,dp(12),0);Button sb=tab("НАЙТИ",true);sr.addView(ed,new LinearLayout.LayoutParams(0,dp(48),1));sr.addView(sb,new LinearLayout.LayoutParams(dp(92),dp(48)));LinearLayout.LayoutParams sp=new LinearLayout.LayoutParams(-1,-2);sp.setMargins(0,dp(8),0,0);root.addView(sr,sp);View.OnClickListener go=v->{String q=ed.getText().toString().trim();search(q,liveMode);};sb.setOnClickListener(go);ed.setOnEditorActionListener((v,a,e)->{go.onClick(v);return true;});
        if(liveMode){TextView auto=txt("LIVE: поиск обновляется каждые 30 секунд",11,GREEN,true);auto.setGravity(Gravity.CENTER);root.addView(auto);}
        TextView st=txt(status,12,busy.get()?ACCENT:(status.contains("не найден")?AMBER:GREEN),true);st.setGravity(Gravity.CENTER);st.setPadding(0,dp(8),0,dp(4));root.addView(st);
        ScrollView sc=new ScrollView(this);LinearLayout list=v();for(Match m:matches)list.addView(card(m));sc.addView(list);root.addView(sc,new LinearLayout.LayoutParams(-1,0,1));root.addView(txt("BETCITY используется только для матчей и коэффициентов. Вероятность рассчитывается по независимой статистике.",10,MUTED,false));setContentView(root);
    }

    private View card(Match m){LinearLayout c=v();c.setPadding(dp(12),dp(10),dp(12),dp(10));c.setBackground(box(CARD,16));LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.setMargins(0,dp(8),0,0);c.setLayoutParams(cp);LinearLayout top=new LinearLayout(this);top.addView(txt(m.country+" · "+m.league,11,MUTED,false),new LinearLayout.LayoutParams(0,-2,1));top.addView(txt(m.min>0?m.min+"'":time(m.ts),11,m.min>0?GREEN:MUTED,true));c.addView(top);String score=m.hg>=0?"  "+m.hg+":"+m.ag:"";c.addView(txt(m.home+" — "+m.away+score,17,TEXT,true));TextView rel=txt("Качество данных: "+m.reliability+"% · статистика: "+m.statsSource,11,m.reliability>=65?GREEN:(m.reliability>=35?AMBER:RED),true);c.addView(rel);
        if(m.p1<0){TextView no=txt("Расчёт невозможен: недостаточно подтверждённой статистики",13,RED,true);no.setPadding(0,dp(8),0,dp(4));c.addView(no);}else c.addView(outcomes(m));
        if(liveMode){addSingle(c,"ЕЩЁ 1+ ГОЛ",m.next1);addSingle(c,"ЕЩЁ 2+ ГОЛА",m.next2);addSingle(c,"ЕЩЁ 3+ ГОЛА",m.next3);TextView nt=txt("Следующий гол: хозяева "+m.nextHome+"% · гости "+m.nextAway+"% · больше не будет "+m.noMore+"%",11,TEXT,true);nt.setPadding(0,dp(6),0,0);c.addView(nt);}else{addTotal(c,"ТОТАЛ 2.5","ТБ 2.5",m.o25,m.o25Odd,"ТМ 2.5",m.u25,m.u25Odd);addTotal(c,"ТОТАЛ 1.5","ТБ 1.5",m.o15,m.o15Odd,"ТМ 1.5",m.u15,m.u15Odd);}addTotal(c,"ОБЕ ЗАБЬЮТ","ДА",m.bttsYes,m.bttsYesOdd,"НЕТ",m.bttsNo,m.bttsNoOdd);
        TextView h1=txt("1-Й ТАЙМ",12,ACCENT,true);h1.setPadding(0,dp(8),0,dp(3));c.addView(h1);addTotal(c,"1-Й ТАЙМ · 0.5","ТБ 0.5",m.ho05,m.ho05Odd,"ТМ 0.5",m.hu05,m.hu05Odd);addTotal(c,"1-Й ТАЙМ · 1.0","ТБ 1.0",m.ho10,m.ho10Odd,"ТМ 1.0",m.hu10,m.hu10Odd);c.addView(txt("Возврат при 1 голе: "+fmtP(m.hPush10),10,MUTED,false));addTotal(c,"1-Й ТАЙМ · 1.5","ТБ 1.5",m.ho15,m.ho15Odd,"ТМ 1.5",m.hu15,m.hu15Odd);
        TextView audit=txt("Проверка критериев",13,ACCENT,true);audit.setGravity(Gravity.CENTER);audit.setPadding(0,dp(8),0,dp(3));c.addView(audit);audit.setOnClickListener(v->toggleAudit(c,audit,m));return c;}
    private View outcomes(Match m){LinearLayout r=new LinearLayout(this);r.setWeightSum(3);r.addView(prob("П1",m.p1,m.p1Odd,false),new LinearLayout.LayoutParams(0,dp(70),1));r.addView(prob("X",m.px,m.xOdd,false),new LinearLayout.LayoutParams(0,dp(70),1));r.addView(prob("П2",m.p2,m.p2Odd,false),new LinearLayout.LayoutParams(0,dp(70),1));return r;}
    private void addSingle(LinearLayout p,String l,int v){TextView t=txt(l,11,MUTED,true);t.setPadding(0,dp(7),0,dp(2));p.addView(t);p.addView(prob(l,v,0,v>=60),new LinearLayout.LayoutParams(-1,dp(66)));}
    private void addTotal(LinearLayout p,String title,String l,int lp,double lo,String r,int rp,double ro){TextView t=txt(title,11,MUTED,true);t.setPadding(0,dp(8),0,dp(3));p.addView(t);LinearLayout row=new LinearLayout(this);row.setWeightSum(2);row.addView(prob(l,lp,lo,lp>=58&&lp>rp),new LinearLayout.LayoutParams(0,dp(68),1));row.addView(prob(r,rp,ro,rp>=58&&rp>lp),new LinearLayout.LayoutParams(0,dp(68),1));p.addView(row);}
    private View prob(String label,int p,double odd,boolean hi){LinearLayout b=v();b.setGravity(Gravity.CENTER);b.setBackground(box(hi?GREEN:CARD2,10));b.addView(txt(label,11,hi?Color.WHITE:MUTED,true));String s=fmtP(p)+(odd>1?" ("+fmtOdd(odd)+")":"");b.addView(txt(s,16,Color.WHITE,true));return b;}
    private void toggleAudit(LinearLayout c,TextView ctl,Match m){Object tag=ctl.getTag();if(tag instanceof View){c.removeView((View)tag);ctl.setTag(null);return;}LinearLayout b=v();b.setPadding(dp(8),dp(8),dp(8),dp(8));b.setBackground(box(CARD2,10));for(Criterion x:m.criteria){LinearLayout r=new LinearLayout(this);LinearLayout l=v();l.addView(txt(x.name,11,x.available?TEXT:MUTED,true));l.addView(txt(x.detail,9,MUTED,false));r.addView(l,new LinearLayout.LayoutParams(0,-2,1));r.addView(txt(x.available?(x.p1+" / "+x.px+" / "+x.p2+"% · вес "+trim(x.weight)):"нет данных",10,x.available?GREEN:MUTED,true));b.addView(r);}c.addView(b);ctl.setTag(b);}

    private JSONObject getJson(String url,boolean live)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(9000);c.setReadTimeout(12000);c.setRequestProperty("Accept","application/json, text/plain, */*");c.setRequestProperty("Accept-Language","ru-RU,ru;q=0.9,en;q=0.7");c.setRequestProperty("User-Agent","Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36");if(url.contains("betcity"))c.setRequestProperty("Referer",live?"https://betcity.ru/ru/live/football":"https://betcity.ru/ru/line/football");int code=c.getResponseCode();InputStream is=code>=200&&code<300?c.getInputStream():c.getErrorStream();String body=read(is);c.disconnect();if(code<200||code>=300)throw new Exception("HTTP "+code);if(body.trim().isEmpty())throw new Exception("Пустой ответ источника");return new JSONObject(body);}
    private String read(InputStream is)throws Exception{if(is==null)return"";BufferedReader r=new BufferedReader(new InputStreamReader(is));StringBuilder b=new StringBuilder();String s;while((s=r.readLine())!=null)b.append(s);r.close();return b.toString();}
    private boolean truth(Object o){String s=String.valueOf(o);return"1".equals(s)||"true".equalsIgnoreCase(s)||"yes".equalsIgnoreCase(s);}private int findMinute(JSONObject e){String[]k={"minute","min","time_ev","timer","time_game","current_minute"};for(String q:k)if(e.has(q)){int x=parseMinute(String.valueOf(e.opt(q)));if(x>0&&x<130)return x;}return 0;}
    private void parseScore(String s,Match m,boolean half){int[]x=score(s==null?"":s.split(",")[0]);if(x==null)return;if(half){m.h1g=x[0];m.a1g=x[1];}else{m.hg=x[0];m.ag=x[1];}}private int[] score(String s){java.util.regex.Matcher q=java.util.regex.Pattern.compile("(\\d+)\\s*[:\\-]\\s*(\\d+)").matcher(s);if(!q.find())return null;return new int[]{Integer.parseInt(q.group(1)),Integer.parseInt(q.group(2))};}
    private long parseBetcityDate(Object o){if(o instanceof Number){long v=((Number)o).longValue();return v>100000000000L?v/1000:v;}String s=String.valueOf(o);if(s.matches("\\d{10,13}"))try{long v=Long.parseLong(s);return v>100000000000L?v/1000:v;}catch(Exception ignored){}String[]f={"yyyy-MM-dd HH:mm:ss","yyyy-MM-dd HH:mm","dd.MM.yyyy HH:mm"};for(String p:f)try{Date d=new SimpleDateFormat(p,Locale.US).parse(s);if(d!=null)return d.getTime()/1000;}catch(Exception ignored){}return 0;}
    private String norm(String s){return s==null?"":s.toLowerCase(Locale.ROOT).replace('ё','е').replaceAll("[^\\p{L}\\p{N}]+"," ").trim();}private double numObj(Object o){if(o==null)return 0;try{return Double.parseDouble(String.valueOf(o).replace("%","").replace(',','.'));}catch(Exception e){return 0;}}private int parseMinute(String s){java.util.regex.Matcher m=java.util.regex.Pattern.compile("(\\d{1,3})").matcher(s);return m.find()?Integer.parseInt(m.group(1)):0;}
    private String pair(double h,double a,String suf){if(h==0&&a==0)return"—";return trim(h)+suf+" — "+trim(a)+suf;}private String pairD(double h,double a){if(h==0&&a==0)return"—";return String.format(Locale.US,"%.2f — %.2f",h,a);}private String trim(double v){return Math.rint(v)==v?String.valueOf((int)v):String.format(Locale.US,"%.1f",v);}private String fmtOdd(double v){return String.format(Locale.US,"%.2f",v);}private String fmtP(int p){return p<0?"—":p+"%";}private String message(Exception e){return e.getMessage()==null?e.getClass().getSimpleName():e.getMessage();}private double clamp(double v,double lo,double hi){return Math.max(lo,Math.min(hi,v));}private String time(long ts){return ts<=0?"—":new SimpleDateFormat("dd.MM HH:mm",Locale.getDefault()).format(new Date(ts*1000));}
    private LinearLayout v(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}private Button tab(String s,boolean on){Button b=new Button(this);b.setText(s);b.setTextColor(Color.WHITE);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setBackground(box(on?ACCENT:CARD,11));return b;}private TextView txt(String s,float z,int c,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}private GradientDrawable box(int c,int r){GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(dp(r));return d;}private int dp(int x){return Math.round(x*getResources().getDisplayMetrics().density);}

    static class Criterion{String name,detail;boolean available;double weight;int p1,px,p2;Criterion(String n,boolean a,double w,int p1,int px,int p2,String d){name=n;available=a;weight=w;this.p1=p1;this.px=px;this.p2=p2;detail=d;}}
    static class TeamProfile{
        int n,w,d,l,homeN,awayN,xgN,sotN,shotsN,possN,cornerN,cardsN;double gf,ga,homeGf,awayGf,xg,sot,shots,poss,corners,cards;
        void add(int f,int a,boolean home){n++;gf+=f;ga+=a;if(home){homeN++;homeGf+=f;}else{awayN++;awayGf+=f;}if(f>a)w++;else if(f==a)d++;else l++;}
        void addXg(double v){xg+=v;xgN++;}void addSot(double v){sot+=v;sotN++;}void addShots(double v){shots+=v;shotsN++;}void addPoss(double v){poss+=v;possN++;}void addCorners(double v){corners+=v;cornerN++;}void addCards(double v){cards+=v;cardsN++;}
        double gf(){return n==0?1.3:gf/n;}double ga(){return n==0?1.3:ga/n;}double form(){return n==0?.5:(3.0*w+d)/(3.0*n);}double homeGf(){return homeN==0?gf():homeGf/homeN;}double awayGf(){return awayN==0?gf():awayGf/awayN;}double xg(){return xgN==0?0:xg/xgN;}double sot(){return sotN==0?0:sot/sotN;}double shots(){return shotsN==0?0:shots/shotsN;}double poss(){return possN==0?0:poss/possN;}double corners(){return cornerN==0?0:corners/cornerN;}double cards(){return cardsN==0?0:cards/cardsN;}
    }
    static class Match{
        String id="",country="Прочее",league="Прочие соревнования",home="—",away="—",shots="—",shotsOn="—",possession="—",xg="—",corners="—",cards="—",statsSource="нет";long ts;int min=0,hg=-1,ag=-1,h1g=-1,a1g=-1,sampleH=0,sampleA=0,reliability=0;TeamProfile hp,ap;
        double shotsH,shotsA,sotH,sotA,posH,posA,xgH,xgA,cornerH,cornerA,cardH,cardA;
        int p1=-1,px=-1,p2=-1,o25=-1,u25=-1,o15=-1,u15=-1,bttsYes=-1,bttsNo=-1,next1=-1,next2=-1,next3=-1,nextHome=-1,nextAway=-1,noMore=-1,h1p1=-1,h1px=-1,h1p2=-1,ho05=-1,hu05=-1,ho10=-1,hu10=-1,hPush10=-1,ho15=-1,hu15=-1;
        double p1Odd,xOdd,p2Odd,o25Odd,u25Odd,o15Odd,u15Odd,bttsYesOdd,bttsNoOdd,hp1Odd,hxOdd,hp2Odd,ho05Odd,hu05Odd,ho10Odd,hu10Odd,ho15Odd,hu15Odd;final List<Criterion>criteria=new ArrayList<>();
    }
}
