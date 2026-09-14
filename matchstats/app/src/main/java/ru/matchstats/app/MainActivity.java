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
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends Activity {
    private static final String PREMATCH = "https://ad.betcity.ru/d/off/events?rev=2&id_sp=1&add=main,ext,name_sp,name_ch&ver=69&csn=ooca9s";
    private static final String LIVE1 = "https://ad.betcity.ru/d/on_air/bets?rev=8&add=dep_event&template=1&ver=69&csn=ooca9s";
    private static final String LIVE2 = "https://ad.betcity.ru/d/on_air/bets?rev=2&template=1&ver=69&csn=ooca9s";
    private static final String SCORE = "https://ad.betcity.ru/d/score?rev=5&date=%s&ver=60&lng=1&csn=ooca9s";
    private static final int BG=Color.rgb(10,15,20), CARD=Color.rgb(20,28,36), CARD2=Color.rgb(26,36,46), TEXT=Color.rgb(240,244,247), MUTED=Color.rgb(145,157,169), GREEN=Color.rgb(38,166,91), ACCENT=Color.rgb(64,145,255), RED=Color.rgb(220,80,80), AMBER=Color.rgb(225,155,45);

    private final ExecutorService io=Executors.newFixedThreadPool(4);
    private final AtomicBoolean busy=new AtomicBoolean(false);
    private final Handler handler=new Handler(Looper.getMainLooper());
    private final List<Match> lineMatches=new ArrayList<>(), liveMatches=new ArrayList<>();
    private final Map<String,TeamStats> history=new HashMap<>();
    private boolean liveMode=false;
    private int navLevel=0;
    private String selectedCountry="",selectedLeague="",status="Загрузка BETCITY…";
    private long historyLoadedAt=0;

    @Override public void onCreate(Bundle b){super.onCreate(b);render();load(false);}
    @Override public void onDestroy(){handler.removeCallbacksAndMessages(null);io.shutdownNow();super.onDestroy();}

    private final Runnable liveRefresh=new Runnable(){@Override public void run(){if(liveMode){load(true);handler.postDelayed(this,30000);}}};
    private void startLiveTimer(){handler.removeCallbacks(liveRefresh);handler.postDelayed(liveRefresh,30000);}
    private void stopLiveTimer(){handler.removeCallbacks(liveRefresh);}

    private void load(boolean live){
        if(!busy.compareAndSet(false,true))return;
        status=live?"Обновление LIVE BETCITY…":"Загрузка линии BETCITY…";render();
        io.execute(()->{
            List<Match> out=new ArrayList<>();String err="";
            try{
                ensureHistory();
                JSONObject root;
                if(live){try{root=getJson(LIVE1,live);}catch(Exception e){root=getJson(LIVE2,live);}}
                else root=getJson(PREMATCH,false);
                out=parseFeed(root,live);
            }catch(Exception e){err=message(e);}
            final List<Match> result=out;final String error=err;
            runOnUiThread(()->{
                List<Match> dst=live?liveMatches:lineMatches;dst.clear();dst.addAll(result);
                status=result.isEmpty()?(!error.isEmpty()?error:(live?"В BETCITY сейчас нет LIVE футбола":"Линия BETCITY не получена")):(live?"LIVE BETCITY: ":"ЛИНИЯ BETCITY: ")+result.size()+" матчей";
                busy.set(false);render();
            });
        });
    }

    private List<Match> parseFeed(JSONObject root,boolean wantLive){
        List<Match> out=new ArrayList<>();JSONObject reply=root.optJSONObject("reply");if(reply==null)reply=root;
        JSONObject sports=reply.optJSONObject("sports");if(sports==null)return out;
        JSONObject football=sports.optJSONObject("1");
        if(football==null){for(String k:keys(sports)){JSONObject s=sports.optJSONObject(k);if(s!=null&&s.optString("name_sp","").toLowerCase(Locale.ROOT).contains("футбол")){football=s;break;}}}
        if(football==null)return out;JSONObject chmps=football.optJSONObject("chmps");if(chmps==null)return out;
        for(String ck:keys(chmps)){
            JSONObject ch=chmps.optJSONObject(ck);if(ch==null)continue;String league=ch.optString("name_ch","Футбол");
            if(isCyber(league))continue;JSONObject evts=ch.optJSONObject("evts");if(evts==null)continue;
            for(String ek:keys(evts)){
                JSONObject e=evts.optJSONObject(ek);if(e==null)continue;boolean isLive=truthy(e.opt("is_live"))||wantLive;
                if(wantLive&&!isLive)continue;if(!wantLive&&truthy(e.opt("is_live")))continue;
                Match m=parseEvent(e,league,wantLive);if(m==null)continue;parseMarkets(e,m);calculate(m,wantLive);out.add(m);
            }
        }
        Collections.sort(out,(a,b)->Long.compare(a.ts,b.ts));return out;
    }

    private Match parseEvent(JSONObject e,String league,boolean live){
        String h=e.optString("name_ht","").trim(),a=e.optString("name_at","").trim();if(h.length()<2||a.length()<2)return null;
        Match m=new Match();m.id=String.valueOf(e.optLong("id_ev",0));m.home=h;m.away=a;m.league=cleanLeague(league);m.country=countryOf(m.league);m.ts=parseDate(e.opt("date_ev"));
        int[] sc=parseScore(e.optString("sc_ev",""));m.hg=sc[0];m.ag=sc[1];int[] h1=parseHalfScore(e.optString("sc_ext_ev",""));m.h1g=h1[0];m.a1g=h1[1];
        if(live)m.min=parseMinute(e);
        parseLiveExt(e,m);return m;
    }

    private void ensureHistory(){
        if(!history.isEmpty()&&System.currentTimeMillis()-historyLoadedAt<10*60*1000)return;
        history.clear();
        for(int d=1;d<=7;d++){
            try{Date day=new Date(System.currentTimeMillis()-d*86400000L);JSONObject r=getJson(String.format(Locale.US,SCORE,day(day)),false);accumulateResults(r,d);}catch(Exception ignored){}
        }
        historyLoadedAt=System.currentTimeMillis();
    }

    private void accumulateResults(JSONObject root,int age){
        JSONObject reply=root.optJSONObject("reply");if(reply==null)reply=root;JSONObject sports=reply.optJSONObject("sports");if(sports==null)return;JSONObject f=sports.optJSONObject("1");if(f==null)return;JSONObject chmps=f.optJSONObject("chmps");if(chmps==null)return;
        double w=Math.max(.45,1.0-(age-1)*.08);
        for(String ck:keys(chmps)){JSONObject ch=chmps.optJSONObject(ck);if(ch==null||isCyber(ch.optString("name_ch","")))continue;JSONObject evts=ch.optJSONObject("evts");if(evts==null)continue;for(String ek:keys(evts)){JSONObject e=evts.optJSONObject(ek);if(e==null)continue;String h=e.optString("name_ht",""),a=e.optString("name_at","");int[] s=parseScore(e.optString("sc_ev",""));if(h.isEmpty()||a.isEmpty()||s[0]<0||s[1]<0)continue;stat(h).add(s[0],s[1],true,w);stat(a).add(s[1],s[0],false,w);}}
    }
    private TeamStats stat(String n){String k=norm(n);TeamStats s=history.get(k);if(s==null){s=new TeamStats();history.put(k,s);}return s;}

    private void calculate(Match m,boolean live){
        TeamStats h=history.get(norm(m.home)),a=history.get(norm(m.away));
        double hGF=h==null?1.45:h.gfPer(),hGA=h==null?1.20:h.gaPer(),aGF=a==null?1.15:a.gfPer(),aGA=a==null?1.40:a.gaPer();
        double formH=h==null?.50:h.form(),formA=a==null?.50:a.form();
        double lh=clamp(1.42*Math.sqrt(clamp(hGF/1.35,.45,2.0)*clamp(aGA/1.35,.45,2.0))*(.86+.28*formH),.35,3.2);
        double la=clamp(1.12*Math.sqrt(clamp(aGF/1.25,.45,2.0)*clamp(hGA/1.25,.45,2.0))*(.86+.28*formA),.25,2.8);
        m.confidence=(int)Math.round(clamp(((h==null?0:h.games)+(a==null?0:a.games))/14.0,0,1)*70+20);
        if(live){
            double rem=clamp((90.0-m.min)/90.0,0,1),pressure=0;
            if(m.sotH+m.sotA>0)pressure+=.065*(m.sotH-m.sotA);
            if(m.shotsH+m.shotsA>0)pressure+=.020*(m.shotsH-m.shotsA);
            if(m.cornersH+m.cornersA>0)pressure+=.025*(m.cornersH-m.cornersA);
            if(m.posH+m.posA>0)pressure+=.003*(m.posH-m.posA);
            pressure+=-.14*(m.redH-m.redA);pressure=clamp(pressure,-.70,.70);
            double rh=clamp(lh*rem*(1+pressure),.01,2.9),ra=clamp(la*rem*(1-pressure),.01,2.9);
            int hg=Math.max(0,m.hg),ag=Math.max(0,m.ag);outcome(m,hg,ag,rh,ra,false);totals(m,hg+ag,rh+ra);btts(m,hg,ag,rh,ra);
            if(m.min<=45){double hr=clamp((45.0-m.min)/45.0,0,1);double hh=clamp(lh*.46*hr*(1+pressure),.005,1.8),ha=clamp(la*.46*hr*(1-pressure),.005,1.8);outcome(m,hg,ag,hh,ha,true);halfTotals(m,hg+ag,hh+ha);}else if(m.h1g>=0&&m.a1g>=0)doneHalf(m);
            if(m.sotH+m.sotA>0)m.confidence=Math.min(98,m.confidence+8);if(m.shotsH+m.shotsA>0)m.confidence=Math.min(98,m.confidence+5);
        }else{
            outcome(m,0,0,lh,la,false);totals(m,0,lh+la);btts(m,0,0,lh,la);outcome(m,0,0,lh*.46,la*.46,true);halfTotals(m,0,(lh+la)*.46);
        }
    }

    private void outcome(Match m,int bh,int ba,double lh,double la,boolean half){double p1=0,px=0,p2=0;for(int h=0;h<11;h++)for(int a=0;a<11;a++){double p=pois(h,lh)*pois(a,la);if(bh+h>ba+a)p1+=p;else if(bh+h==ba+a)px+=p;else p2+=p;}double s=p1+px+p2;if(s<=0)return;int x=(int)Math.round(p1/s*100),y=(int)Math.round(px/s*100),z=100-x-y;if(half){m.h1p1=x;m.h1px=y;m.h1p2=z;}else{m.p1=x;m.px=y;m.p2=z;}}
    private void totals(Match m,int g,double l){m.o15=over(g,l,1);m.u15=100-m.o15;m.o25=over(g,l,2);m.u25=100-m.o25;}
    private void halfTotals(Match m,int g,double l){m.ho05=over(g,l,0);m.hu05=100-m.ho05;m.ho15=over(g,l,1);m.hu15=100-m.ho15;double p0=g==0?pois(0,l):0,p1=g<=1?pois(Math.max(0,1-g),l):0;if(g>=2){m.ho10=100;m.hu10=0;m.hp10=0;}else{m.ho10=(int)Math.round((1-p0-p1)*100);m.hu10=(int)Math.round(p0*100);m.hp10=Math.max(0,100-m.ho10-m.hu10);}}
    private void doneHalf(Match m){int h=m.h1g,a=m.a1g,g=h+a;m.h1p1=h>a?100:0;m.h1px=h==a?100:0;m.h1p2=h<a?100:0;m.ho05=g>0?100:0;m.hu05=100-m.ho05;m.ho15=g>1?100:0;m.hu15=100-m.ho15;if(g>1){m.ho10=100;m.hu10=0;m.hp10=0;}else if(g==1){m.ho10=0;m.hu10=0;m.hp10=100;}else{m.ho10=0;m.hu10=100;m.hp10=0;}}
    private void btts(Match m,int hg,int ag,double lh,double la){double ph=hg>0?1:(1-Math.exp(-lh)),pa=ag>0?1:(1-Math.exp(-la));m.bttsYes=(int)Math.round(clamp(ph*pa,0,1)*100);m.bttsNo=100-m.bttsYes;}
    private int over(int current,double l,int t){if(current>t)return 100;double p=0;for(int i=0;i<13;i++)if(current+i>t)p+=pois(i,l);return(int)Math.round(clamp(p,0,1)*100);}
    private double pois(int k,double l){double f=1;for(int i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f;}

    private void parseMarkets(JSONObject e,Match m){for(String sec:new String[]{"main","ext","dep_event"}){Object o=e.opt(sec);if(o instanceof JSONObject)walkMarket(o,"",m);}}
    private void walkMarket(Object node,String inherited,Match m){
        if(node instanceof JSONObject){JSONObject o=(JSONObject)node;String name=o.optString("name",inherited);JSONObject blocks=o.optJSONObject("blocks");if(blocks!=null)parseBlocks(blocks,name,m);for(String k:keys(o)){if("blocks".equals(k))continue;Object child=o.opt(k);if(child instanceof JSONObject||child instanceof JSONArray)walkMarket(child,name,m);}}
        else if(node instanceof JSONArray){JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++){Object x=a.opt(i);if(x instanceof JSONObject||x instanceof JSONArray)walkMarket(x,inherited,m);}}
    }
    private void parseBlocks(JSONObject blocks,String marketName,Match m){for(String bk:keys(blocks)){JSONObject b=blocks.optJSONObject(bk);if(b==null)continue;String low=marketName.toLowerCase(Locale.ROOT);boolean h1=low.contains("1 тайм")||low.contains("1-й тайм")||low.contains("первый тайм")||low.contains("1st half")||low.contains("first half");if(b.has("P1")||b.has("X")||b.has("P2")){double p1=odd(b.optJSONObject("P1")),x=odd(b.optJSONObject("X")),p2=odd(b.optJSONObject("P2"));if(h1){if(p1>1)m.h1o1=p1;if(x>1)m.h1ox=x;if(p2>1)m.h1o2=p2;}else{if(p1>1)m.o1=p1;if(x>1)m.ox=x;if(p2>1)m.o2=p2;}}
            if(b.has("Tb")||b.has("Tm")){JSONObject tb=b.optJSONObject("Tb"),tm=b.optJSONObject("Tm");double line=lineValue(tb);if(line<=0)line=lineValue(tm);if(line<=0)line=b.optDouble("Tot",0);double ob=odd(tb),om=odd(tm);storeTotalOdds(m,h1,line,ob,om);}
            if((low.contains("обе забьют")||low.contains("обе команды забьют"))&&b.has("Y")&&b.has("N")){double y=odd(b.optJSONObject("Y")),n=odd(b.optJSONObject("N"));if(y>1)m.bttsOYes=y;if(n>1)m.bttsONo=n;}
        }}
    private void storeTotalOdds(Match m,boolean h1,double line,double over,double under){if(h1){if(close(line,.5)){m.ho05o=over;m.hu05o=under;}else if(close(line,1.0)){m.ho10o=over;m.hu10o=under;}else if(close(line,1.5)){m.ho15o=over;m.hu15o=under;}}else{if(close(line,1.5)){m.o15o=over;m.u15o=under;}else if(close(line,2.5)){m.o25o=over;m.u25o=under;}}}
    private boolean close(double a,double b){return Math.abs(a-b)<.06;}private double odd(JSONObject o){return o==null?0:o.optDouble("kf",0);}private double lineValue(JSONObject o){if(o==null)return 0;for(String k:new String[]{"lv","lvt","lvl"}){double v=o.optDouble(k,0);if(v!=0)return Math.abs(v);}return 0;}

    private void parseLiveExt(JSONObject e,Match m){Object ext=e.opt("ext");if(ext instanceof JSONArray){JSONArray a=(JSONArray)ext;for(int i=0;i<a.length();i++){JSONObject x=a.optJSONObject(i);if(x==null)continue;applyStat(m,x.optString("name_ext","").toLowerCase(Locale.ROOT),x.optString("value_ext",""));}}}
    private void applyStat(Match m,String name,String value){double[] v=pair(value);if(name.contains("удар")&&name.contains("створ")){m.sotH=v[0];m.sotA=v[1];}else if(name.contains("удар")){m.shotsH=v[0];m.shotsA=v[1];}else if(name.contains("владен")){m.posH=v[0];m.posA=v[1];}else if(name.contains("углов")){m.cornersH=v[0];m.cornersA=v[1];}else if(name.contains("красн")){m.redH=v[0];m.redA=v[1];}}

    private void render(){
        LinearLayout root=v();root.setBackgroundColor(BG);root.setPadding(dp(14),dp(12),dp(14),dp(12));root.addView(txt("DENZL",26,TEXT,true));root.addView(txt("BETCITY · вероятность DENZL · коэффициенты в скобках",11,MUTED,false));
        LinearLayout tabs=new LinearLayout(this);tabs.setWeightSum(2);Button line=tab("ЛИНИЯ",!liveMode),live=tab("LIVE",liveMode);tabs.addView(line,new LinearLayout.LayoutParams(0,dp(48),1));tabs.addView(live,new LinearLayout.LayoutParams(0,dp(48),1));root.addView(tabs);
        line.setOnClickListener(x->{liveMode=false;stopLiveTimer();navLevel=0;selectedCountry="";selectedLeague="";load(false);});live.setOnClickListener(x->{liveMode=true;navLevel=0;selectedCountry="";selectedLeague="";load(true);startLiveTimer();});
        TextView st=txt(status,12,busy.get()?ACCENT:(status.contains("HTTP")?RED:GREEN),true);st.setGravity(Gravity.CENTER);st.setPadding(0,dp(8),0,dp(4));root.addView(st);
        if(liveMode)root.addView(txt("Автообновление LIVE: каждые 30 сек",10,MUTED,false));
        if(navLevel>0){Button back=tab("← НАЗАД",false);root.addView(back,new LinearLayout.LayoutParams(-1,dp(42)));back.setOnClickListener(x->{navLevel--;if(navLevel==0){selectedCountry="";selectedLeague="";}else selectedLeague="";render();});}
        ScrollView sc=new ScrollView(this);LinearLayout list=v();List<Match> src=liveMode?liveMatches:lineMatches;
        if(navLevel==0)renderCountries(list,src);else if(navLevel==1)renderLeagues(list,src);else renderMatches(list,src);sc.addView(list);root.addView(sc,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);
    }
    private void renderCountries(LinearLayout list,List<Match> src){Map<String,Integer> c=new LinkedHashMap<>();for(Match m:src)c.put(m.country,c.getOrDefault(m.country,0)+1);for(Map.Entry<String,Integer> e:c.entrySet()){Button b=row(e.getKey(),e.getValue());list.addView(b);b.setOnClickListener(x->{selectedCountry=e.getKey();navLevel=1;render();});}}
    private void renderLeagues(LinearLayout list,List<Match> src){Map<String,Integer> c=new LinkedHashMap<>();for(Match m:src)if(m.country.equals(selectedCountry))c.put(m.league,c.getOrDefault(m.league,0)+1);for(Map.Entry<String,Integer> e:c.entrySet()){Button b=row(e.getKey(),e.getValue());list.addView(b);b.setOnClickListener(x->{selectedLeague=e.getKey();navLevel=2;render();});}}
    private void renderMatches(LinearLayout list,List<Match> src){for(Match m:src)if(m.country.equals(selectedCountry)&&m.league.equals(selectedLeague))list.addView(card(m));}
    private Button row(String name,int count){Button b=new Button(this);b.setText(name+"   "+count+"  ›");b.setTextColor(TEXT);b.setTextSize(15);b.setGravity(Gravity.LEFT|Gravity.CENTER_VERTICAL);b.setBackground(box(CARD,12));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(52));p.setMargins(0,dp(5),0,0);b.setLayoutParams(p);return b;}

    private View card(Match m){LinearLayout c=v();c.setPadding(dp(12),dp(10),dp(12),dp(10));c.setBackground(box(CARD,14));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(0,dp(7),0,0);c.setLayoutParams(p);LinearLayout top=new LinearLayout(this);top.addView(txt(m.league,11,MUTED,false),new LinearLayout.LayoutParams(0,-2,1));top.addView(txt(m.min>0?m.min+"'":time(m.ts),11,m.min>0?GREEN:MUTED,true));c.addView(top);c.addView(txt(m.home+" — "+m.away+(m.hg>=0?"   "+m.hg+":"+m.ag:""),17,TEXT,true));c.addView(txt("Данные модели: "+m.confidence+"%",10,MUTED,false));
        LinearLayout tabs=new LinearLayout(this);tabs.setWeightSum(2);Button full=small("МАТЧ",true),h1=small("1-Й ТАЙМ",false);tabs.addView(full,new LinearLayout.LayoutParams(0,dp(40),1));tabs.addView(h1,new LinearLayout.LayoutParams(0,dp(40),1));c.addView(tabs);LinearLayout host=v();host.addView(fullView(m));c.addView(host);full.setOnClickListener(x->{host.removeAllViews();host.addView(fullView(m));full.setBackground(box(ACCENT,10));h1.setBackground(box(CARD2,10));});h1.setOnClickListener(x->{host.removeAllViews();host.addView(halfView(m));h1.setBackground(box(ACCENT,10));full.setBackground(box(CARD2,10));});return c;}
    private View fullView(Match m){LinearLayout b=v();b.addView(outcomeView(m.p1,m.o1,m.px,m.ox,m.p2,m.o2));totalRow(b,"ТОТАЛ 2.5","ТБ 2.5",m.o25,m.o25o,"ТМ 2.5",m.u25,m.u25o,0);totalRow(b,"ТОТАЛ 1.5","ТБ 1.5",m.o15,m.o15o,"ТМ 1.5",m.u15,m.u15o,0);totalRow(b,"ОБЕ ЗАБЬЮТ","ДА",m.bttsYes,m.bttsOYes,"НЕТ",m.bttsNo,m.bttsONo,0);return b;}
    private View halfView(Match m){LinearLayout b=v();b.addView(outcomeView(m.h1p1,m.h1o1,m.h1px,m.h1ox,m.h1p2,m.h1o2));totalRow(b,"1-Й ТАЙМ · ТОТАЛ 0.5","ТБ 0.5",m.ho05,m.ho05o,"ТМ 0.5",m.hu05,m.hu05o,0);totalRow(b,"1-Й ТАЙМ · ТОТАЛ 1.0","ТБ 1.0",m.ho10,m.ho10o,"ТМ 1.0",m.hu10,m.hu10o,m.hp10);totalRow(b,"1-Й ТАЙМ · ТОТАЛ 1.5","ТБ 1.5",m.ho15,m.ho15o,"ТМ 1.5",m.hu15,m.hu15o,0);return b;}
    private View outcomeView(int p1,double o1,int px,double ox,int p2,double o2){LinearLayout r=new LinearLayout(this);r.setWeightSum(3);r.addView(prob("П1",p1,o1,false),new LinearLayout.LayoutParams(0,dp(68),1));r.addView(prob("X",px,ox,false),new LinearLayout.LayoutParams(0,dp(68),1));r.addView(prob("П2",p2,o2,false),new LinearLayout.LayoutParams(0,dp(68),1));return r;}
    private void totalRow(LinearLayout p,String title,String l,int lp,double lo,String rr,int rp,double ro,int push){TextView t=txt(title,11,MUTED,true);t.setPadding(0,dp(9),0,dp(3));p.addView(t);LinearLayout r=new LinearLayout(this);r.setWeightSum(2);r.addView(prob(l,lp,lo,lp>rp&&lp>=55),new LinearLayout.LayoutParams(0,dp(68),1));r.addView(prob(rr,rp,ro,rp>lp&&rp>=55),new LinearLayout.LayoutParams(0,dp(68),1));p.addView(r);if(push>0){TextView q=txt("Возврат: "+push+"%",11,AMBER,true);q.setGravity(Gravity.CENTER);p.addView(q);}}
    private View prob(String label,int p,double odd,boolean hi){LinearLayout b=v();b.setGravity(Gravity.CENTER);b.setBackground(box(hi?GREEN:CARD2,10));b.addView(txt(label,11,hi?Color.WHITE:MUTED,true));String s=(p<0?"—":p+"%")+(odd>1?"  ("+String.format(Locale.US,"%.2f",odd)+")":"");b.addView(txt(s,16,Color.WHITE,true));return b;}

    private JSONObject getJson(String url,boolean live)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(10000);c.setReadTimeout(15000);c.setRequestProperty("Accept","application/json, text/plain, */*");c.setRequestProperty("Accept-Language","ru-RU,ru;q=0.9");c.setRequestProperty("User-Agent","Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36 DENZL/1.2");c.setRequestProperty("Referer",live?"https://betcity.ru/ru/live/football":"https://betcity.ru/ru/line/football");int code=c.getResponseCode();InputStream is=code>=200&&code<300?c.getInputStream():c.getErrorStream();String body=read(is);c.disconnect();if(code<200||code>=300)throw new Exception("BETCITY HTTP "+code);if(body.trim().isEmpty())throw new Exception("BETCITY: пустой ответ");return new JSONObject(body);}
    private String read(InputStream is)throws Exception{if(is==null)return"";BufferedReader r=new BufferedReader(new InputStreamReader(is));StringBuilder b=new StringBuilder();String s;while((s=r.readLine())!=null)b.append(s);r.close();return b.toString();}

    private static Set<String> keys(JSONObject o){Set<String>s=new LinkedHashSet<>();java.util.Iterator<String>i=o.keys();while(i.hasNext())s.add(i.next());return s;}
    private static boolean truthy(Object o){if(o==null)return false;String s=String.valueOf(o);return "1".equals(s)||"true".equalsIgnoreCase(s);}
    private static boolean isCyber(String s){String x=s.toLowerCase(Locale.ROOT);return x.contains("cyber")||x.contains("кибер")||x.contains("statistics")||x.contains("статистик");}
    private static String cleanLeague(String s){String x=s.replaceFirst("(?i)^Soccer\\.\\s*","").replaceFirst("(?i)^Футбол\\.\\s*","").trim();return x.isEmpty()?"Футбол":x;}
    private static String countryOf(String l){int p=l.indexOf('.');if(p>1)return l.substring(0,p).trim();int c=l.indexOf(':');if(c>1)return l.substring(0,c).trim();return "Международные";}
    private static int[] parseScore(String s){int[]r={-1,-1};if(s==null)return r;java.util.regex.Matcher m=java.util.regex.Pattern.compile("(\\d+)\\s*[:\\-]\\s*(\\d+)").matcher(s);if(m.find()){r[0]=Integer.parseInt(m.group(1));r[1]=Integer.parseInt(m.group(2));}return r;}
    private static int[] parseHalfScore(String s){if(s==null||s.isEmpty())return new int[]{-1,-1};String first=s.split(",")[0];return parseScore(first);}
    private static long parseDate(Object o){if(o instanceof Number)return ((Number)o).longValue();String s=String.valueOf(o);try{return Long.parseLong(s);}catch(Exception ignored){}for(String f:new String[]{"yyyy-MM-dd HH:mm:ss","yyyy-MM-dd'T'HH:mm:ss"})try{SimpleDateFormat d=new SimpleDateFormat(f,Locale.US);d.setTimeZone(TimeZone.getTimeZone("UTC"));return d.parse(s).getTime()/1000;}catch(Exception ignored){}return 0;}
    private int parseMinute(JSONObject e){for(String k:new String[]{"minute","min","timer","time_ev","tm_ev"}){String s=e.optString(k,"");java.util.regex.Matcher m=java.util.regex.Pattern.compile("(\\d{1,3})").matcher(s);if(m.find())return Math.min(120,Integer.parseInt(m.group(1)));}long ts=parseDate(e.opt("date_ev"));if(ts>0)return(int)Math.min(90,Math.max(1,(System.currentTimeMillis()/1000-ts)/60));return 0;}
    private static double[] pair(String s){double[]r={0,0};if(s==null)return r;java.util.regex.Matcher m=java.util.regex.Pattern.compile("(-?\\d+(?:[.,]\\d+)?)").matcher(s);if(m.find())r[0]=Double.parseDouble(m.group(1).replace(',','.'));if(m.find())r[1]=Double.parseDouble(m.group(1).replace(',','.'));return r;}
    private static String norm(String s){return s==null?"":s.toLowerCase(Locale.ROOT).replaceAll("[^a-zа-яё0-9]","");}
    private static double clamp(double v,double lo,double hi){return Math.max(lo,Math.min(hi,v));}
    private String day(Date d){SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd",Locale.US);f.setTimeZone(TimeZone.getDefault());return f.format(d);}private String time(long ts){if(ts<=0)return"—";return new SimpleDateFormat("HH:mm",Locale.getDefault()).format(new Date(ts*1000));}private String message(Exception e){return e.getMessage()==null?e.getClass().getSimpleName():e.getMessage();}
    private LinearLayout v(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}private Button tab(String s,boolean on){Button b=new Button(this);b.setText(s);b.setTextColor(Color.WHITE);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setBackground(box(on?ACCENT:CARD,10));return b;}private Button small(String s,boolean on){Button b=tab(s,on);b.setTextSize(12);return b;}private TextView txt(String s,float z,int c,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}private GradientDrawable box(int c,int r){GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(dp(r));return d;}private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}

    static class TeamStats{double w,gf,ga,pts,homeW,homeGf,homeGa,awayW,awayGf,awayGa;int games;void add(int f,int a,boolean home,double weight){w+=weight;games++;gf+=f*weight;ga+=a*weight;pts+=(f>a?3:f==a?1:0)*weight;if(home){homeW+=weight;homeGf+=f*weight;homeGa+=a*weight;}else{awayW+=weight;awayGf+=f*weight;awayGa+=a*weight;}}double gfPer(){return w>0?gf/w:1.3;}double gaPer(){return w>0?ga/w:1.3;}double form(){return w>0?pts/(3*w):.5;}}
    static class Match{String id="",country="Международные",league="Футбол",home="—",away="—";long ts;int min,hg=-1,ag=-1,h1g=-1,a1g=-1,confidence=20;double shotsH,shotsA,sotH,sotA,posH,posA,cornersH,cornersA,redH,redA;int p1=-1,px=-1,p2=-1,o15=-1,u15=-1,o25=-1,u25=-1,bttsYes=-1,bttsNo=-1,h1p1=-1,h1px=-1,h1p2=-1,ho05=-1,hu05=-1,ho10=-1,hu10=-1,hp10=-1,ho15=-1,hu15=-1;double o1,ox,o2,o15o,u15o,o25o,u25o,bttsOYes,bttsONo,h1o1,h1ox,h1o2,ho05o,hu05o,ho10o,hu10o,ho15o,hu15o;}
}
