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
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends Activity {
    private static final String BC_PRE = "https://ad.betcity.ru/d/off/events?id_sp=1&ch_id=0&gr_id=0&add=main,ext,name_sp,name_ch&rev=2&ver=69&csn=ooca9s";
    private static final String[] BC_LIVE = {
            "https://ad.betcity.ru/d/on_air/bets?id_sp=1&rev=8&add=dep_event&template=1&ver=69&csn=ooca9s",
            "https://ad.betcity.ru/d/on_air/bets?id_sp=1&rev=2&template=1&ver=69&csn=ooca9s"
    };
    private static final String BC_SCORE = "https://ad.betcity.ru/d/score?rev=5&date=%s&ver=60&lng=1&csn=ooca9s";

    private static final int BG=Color.rgb(10,15,20), CARD=Color.rgb(20,28,36), CARD2=Color.rgb(26,36,46),
            TEXT=Color.rgb(240,244,247), MUTED=Color.rgb(145,157,169), GREEN=Color.rgb(38,166,91),
            ACCENT=Color.rgb(64,145,255), RED=Color.rgb(220,80,80), AMBER=Color.rgb(225,155,45);

    private final ExecutorService io=Executors.newFixedThreadPool(4);
    private final AtomicBoolean busy=new AtomicBoolean(false);
    private final Handler handler=new Handler(Looper.getMainLooper());
    private final List<Match> lineMatches=new ArrayList<>(), liveMatches=new ArrayList<>();
    private final Map<String,TeamProfile> profiles=new LinkedHashMap<>();
    private long profilesAt=0;
    private boolean liveMode=false;
    private int navLevel=0;
    private String selectedCountry="",selectedLeague="",status="Загрузка BETCITY…",searchText="";

    @Override public void onCreate(Bundle b){super.onCreate(b);render();load(false);}
    @Override public void onDestroy(){handler.removeCallbacksAndMessages(null);io.shutdownNow();super.onDestroy();}

    private final Runnable liveRefresh=new Runnable(){
        @Override public void run(){
            if(liveMode){load(true);handler.postDelayed(this,30000);}
        }
    };
    private void startLiveTimer(){handler.removeCallbacks(liveRefresh);handler.postDelayed(liveRefresh,30000);}
    private void stopLiveTimer(){handler.removeCallbacks(liveRefresh);}

    private void load(boolean live){
        if(!busy.compareAndSet(false,true))return;
        status=live?"Обновление LIVE BETCITY…":"Загрузка линии BETCITY…";render();
        io.execute(()->{
            List<Match> out=new ArrayList<>();String err="";
            try{
                ensureProfiles();
                out=loadBetcity(live);
            }catch(Exception e){err=message(e);}
            final List<Match> r=out;final String er=err;
            runOnUiThread(()->{
                List<Match> dst=live?liveMatches:lineMatches;dst.clear();dst.addAll(r);
                status=r.isEmpty()?(!er.isEmpty()?er:(live?"Сейчас нет матчей LIVE":"Линия BETCITY пуста"))
                        :(live?"LIVE: ":"ЛИНИЯ: ")+r.size()+" матчей · BETCITY";
                busy.set(false);render();
            });
        });
    }

    private List<Match> loadBetcity(boolean wantLive)throws Exception{
        Map<String,Match> map=new LinkedHashMap<>();
        if(wantLive){
            Exception last=null;
            for(String u:BC_LIVE){
                try{walk(getJson(u,true), "", true, map);}catch(Exception e){last=e;}
            }
            if(map.isEmpty()&&last!=null)throw last;
        }else{
            walk(getJson(BC_PRE,false),"",false,map);
        }
        List<Match> out=new ArrayList<>(map.values());
        Collections.sort(out,(a,b)->Long.compare(a.ts,b.ts));
        for(Match m:out){applyProfile(m);calculateModel(m,wantLive);}
        return out;
    }

    private void walk(Object node,String league,boolean wantLive,Map<String,Match> out){
        if(node instanceof JSONObject){
            JSONObject o=(JSONObject)node;
            String nextLeague=league;
            if(o.has("name_ch"))nextLeague=o.optString("name_ch",league);
            if(o.has("id_ev")&&o.has("name_ht")&&o.has("name_at")){
                Match m=parseEvent(o,nextLeague,wantLive);
                if(m!=null)out.put(m.id,m);
            }
            Iterator<String> it=o.keys();
            while(it.hasNext()){
                String k=it.next();Object v=o.opt(k);
                if(v instanceof JSONObject||v instanceof JSONArray)walk(v,nextLeague,wantLive,out);
            }
        }else if(node instanceof JSONArray){
            JSONArray a=(JSONArray)node;
            for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)walk(v,league,wantLive,out);}
        }
    }

    private Match parseEvent(JSONObject e,String league,boolean wantLive){
        String home=e.optString("name_ht","").trim(),away=e.optString("name_at","").trim();
        if(home.length()<2||away.length()<2)return null;
        boolean eventLive=truth(e.opt("is_live"))||wantLive;
        if(wantLive&&!eventLive)return null;
        if(!wantLive&&truth(e.opt("is_live")))return null;

        Match m=new Match();
        m.id=String.valueOf(e.optLong("id_ev",e.optInt("id_ev",0)));
        m.home=home;m.away=away;m.league=cleanLeague(league);m.country=countryFromLeague(m.league);
        m.ts=parseBetcityDate(e.opt("date_ev"));
        parseScore(e.optString("sc_ev",""),m,false);
        parseScore(e.optString("sc_ext_ev",""),m,true);
        m.min=findMinute(e);
        parseExtStats(e,m);
        scanMarkets(e,m,"");
        return m;
    }

    private String cleanLeague(String s){
        if(s==null||s.trim().isEmpty())return "Прочие соревнования";
        String x=s.trim().replaceFirst("(?i)^soccer\\.\\s*","").replaceFirst("(?i)^football\\.\\s*","");
        return x;
    }
    private String countryFromLeague(String s){
        if(s==null||s.isEmpty())return "Прочее";
        String[] parts=s.split("\\.");
        String c=parts.length>1?parts[0].trim():"";
        if(c.isEmpty()||c.length()>28)c="Прочее";
        if(c.equalsIgnoreCase("World"))c="Мир";
        if(c.equalsIgnoreCase("International"))c="Международные";
        return c;
    }

    private void scanMarkets(Object node,Match m,String inherited){
        if(node instanceof JSONObject){
            JSONObject o=(JSONObject)node;
            String market=inherited;
            String n=o.optString("name","");
            if(!n.isEmpty())market=n;
            String n2=o.optString("name_m","");
            if(!n2.isEmpty())market=n2;
            if(o.has("P1")||o.has("P2")||o.has("X")||o.has("Tb")||o.has("Tm")||o.has("Y")||o.has("N"))
                applyBlock(o,market,m);
            JSONObject blocks=o.optJSONObject("blocks");
            if(blocks!=null){
                Iterator<String> bi=blocks.keys();
                while(bi.hasNext()){Object b=blocks.opt(bi.next());if(b instanceof JSONObject)applyBlock((JSONObject)b,market,m);}
            }
            Iterator<String> it=o.keys();
            while(it.hasNext()){
                String k=it.next();Object v=o.opt(k);
                if(v instanceof JSONObject||v instanceof JSONArray)scanMarkets(v,m,market);
            }
        }else if(node instanceof JSONArray){
            JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)scanMarkets(v,m,inherited);}
        }
    }

    private void applyBlock(JSONObject b,String market,Match m){
        String ml=(market==null?"":market).toLowerCase(Locale.ROOT);
        boolean first=ml.contains("1-й тайм")||ml.contains("1 тайм")||ml.contains("первый тайм")||ml.contains("1st half")||ml.contains("first half");
        if(b.has("P1")||b.has("P2")||b.has("X")){
            if(first){m.hp1Odd=odd(b.opt("P1"));m.hxOdd=odd(b.opt("X"));m.hp2Odd=odd(b.opt("P2"));}
            else if(m.p1Odd<=0&&m.p2Odd<=0){m.p1Odd=odd(b.opt("P1"));m.xOdd=odd(b.opt("X"));m.p2Odd=odd(b.opt("P2"));}
        }
        if(b.has("Tb")||b.has("Tm")){
            double line=marketLine(b);
            double ov=odd(b.opt("Tb")),un=odd(b.opt("Tm"));
            if(first){
                if(close(line,.5)){m.ho05Odd=ov;m.hu05Odd=un;}
                else if(close(line,1.0)){m.ho10Odd=ov;m.hu10Odd=un;}
                else if(close(line,1.5)){m.ho15Odd=ov;m.hu15Odd=un;}
            }else{
                if(close(line,1.5)){m.o15Odd=ov;m.u15Odd=un;}
                else if(close(line,2.5)){m.o25Odd=ov;m.u25Odd=un;}
            }
        }
        if((ml.contains("обе забьют")||ml.contains("обе команды забьют")||ml.contains("both teams"))&&(b.has("Y")||b.has("N"))){
            m.bttsYesOdd=odd(b.opt("Y"));m.bttsNoOdd=odd(b.opt("N"));
        }
    }

    private double marketLine(JSONObject b){
        double v=numObj(b.opt("Tot"));
        if(v<=0)v=lineFromOutcome(b.opt("Tb"));
        if(v<=0)v=lineFromOutcome(b.opt("Tm"));
        return v;
    }
    private double lineFromOutcome(Object x){
        if(!(x instanceof JSONObject))return 0;JSONObject o=(JSONObject)x;
        double v=numObj(o.opt("lv"));if(v==0)v=numObj(o.opt("lvt"));if(v==0)v=numObj(o.opt("lvl"));return Math.abs(v);
    }
    private double odd(Object x){
        if(x instanceof JSONObject)return numObj(((JSONObject)x).opt("kf"));
        return numObj(x);
    }
    private boolean close(double a,double b){return Math.abs(a-b)<0.06;}

    private void parseExtStats(JSONObject e,Match m){
        scanStats(e,m);
        m.shots=pair(m.shotsH,m.shotsA,"");m.shotsOn=pair(m.sotH,m.sotA,"");
        m.possession=pair(m.posH,m.posA,"%");m.xg=pairD(m.xgH,m.xgA);
        m.corners=pair(m.cornerH,m.cornerA,"");m.fouls=pair(m.foulH,m.foulA,"");
        m.offsides=pair(m.offH,m.offA,"");m.cards=pair(m.cardH,m.cardA,"");
    }
    private void scanStats(Object node,Match m){
        if(node instanceof JSONObject){
            JSONObject o=(JSONObject)node;
            if(o.has("name_ext")&&o.has("value_ext"))applyStat(o.optString("name_ext",""),o.opt("value_ext"),m);
            Iterator<String> it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)scanStats(v,m);}
        }else if(node instanceof JSONArray){
            JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)scanStats(v,m);}
        }
    }
    private void applyStat(String name,Object value,Match m){
        String k=name.toLowerCase(Locale.ROOT);
        double[] p=parsePair(value);if(p==null)return;
        if(k.contains("expected")||k.equals("xg")||k.contains("ожидаем")){m.xgH=p[0];m.xgA=p[1];}
        else if(k.contains("в створ")||k.contains("on target")){m.sotH=p[0];m.sotA=p[1];}
        else if(k.contains("удар")||k.contains("shots")){m.shotsH=p[0];m.shotsA=p[1];}
        else if(k.contains("владен")||k.contains("possession")){m.posH=p[0];m.posA=p[1];}
        else if(k.contains("углов")||k.contains("corner")){m.cornerH=p[0];m.cornerA=p[1];}
        else if(k.contains("фол")||k.contains("foul")){m.foulH=p[0];m.foulA=p[1];}
        else if(k.contains("офсайд")||k.contains("offside")){m.offH=p[0];m.offA=p[1];}
        else if(k.contains("желт")||k.contains("карточ")||k.contains("yellow")){m.cardH=p[0];m.cardA=p[1];}
    }
    private double[] parsePair(Object v){
        String s=String.valueOf(v);String[] a=s.split("\\s*[:\\-–—]\\s*|\\s+");
        List<Double> n=new ArrayList<>();for(String q:a){double x=numObj(q);if(x!=0||q.matches(".*0.*"))n.add(x);}
        return n.size()>=2?new double[]{n.get(0),n.get(1)}:null;
    }

    private void ensureProfiles(){
        if(System.currentTimeMillis()-profilesAt<30*60*1000L&&!profiles.isEmpty())return;
        Map<String,TeamProfile> fresh=new LinkedHashMap<>();
        for(int d=1;d<=10;d++){
            try{
                String date=dateMinus(d);
                JSONObject root=getJson(String.format(Locale.US,BC_SCORE,date),false);
                collectHistory(root,fresh);
            }catch(Exception ignored){}
        }
        if(!fresh.isEmpty()){profiles.clear();profiles.putAll(fresh);profilesAt=System.currentTimeMillis();}
    }
    private void collectHistory(Object node,Map<String,TeamProfile> dst){
        if(node instanceof JSONObject){
            JSONObject o=(JSONObject)node;
            if(o.has("name_ht")&&o.has("name_at")&&o.has("sc_ev")){
                String h=o.optString("name_ht","").trim(),a=o.optString("name_at","").trim();
                int[] sc=score(o.optString("sc_ev",""));
                if(sc!=null&&!h.isEmpty()&&!a.isEmpty()){
                    profile(dst,h).add(sc[0],sc[1],true);
                    profile(dst,a).add(sc[1],sc[0],false);
                }
            }
            Iterator<String> it=o.keys();while(it.hasNext()){Object v=o.opt(it.next());if(v instanceof JSONObject||v instanceof JSONArray)collectHistory(v,dst);}
        }else if(node instanceof JSONArray){
            JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++){Object v=a.opt(i);if(v instanceof JSONObject||v instanceof JSONArray)collectHistory(v,dst);}
        }
    }
    private TeamProfile profile(Map<String,TeamProfile> m,String s){String k=key(s);TeamProfile p=m.get(k);if(p==null){p=new TeamProfile();m.put(k,p);}return p;}
    private void applyProfile(Match m){
        TeamProfile h=profiles.get(key(m.home)),a=profiles.get(key(m.away));
        if(h!=null){m.homeForm=h.form();m.gfH=h.gf();m.gaH=h.ga();m.sampleH=h.n;}
        if(a!=null){m.awayForm=a.form();m.gfA=a.gf();m.gaA=a.ga();m.sampleA=a.n;}
    }

    private void calculateModel(Match m,boolean live){
        double hAttack=m.sampleH>=3?clamp(m.gfH/1.35,.55,1.65):1.0;
        double hDef=m.sampleH>=3?clamp(m.gaH/1.25,.55,1.65):1.0;
        double aAttack=m.sampleA>=3?clamp(m.gfA/1.15,.55,1.65):1.0;
        double aDef=m.sampleA>=3?clamp(m.gaA/1.35,.55,1.65):1.0;
        double formDelta=(m.homeForm-m.awayForm);
        double lh=clamp(1.36*hAttack*aDef*(1+.20*formDelta),.35,3.10);
        double la=clamp(1.10*aAttack*hDef*(1-.16*formDelta),.25,2.80);

        if(live){
            double rem=clamp((95.0-Math.max(0,m.min))/95.0,0,1);
            double pressure=0;
            if(m.xgH+m.xgA>0)pressure+=.42*(m.xgH-m.xgA);
            if(m.sotH+m.sotA>0)pressure+=.07*(m.sotH-m.sotA);
            if(m.shotsH+m.shotsA>0)pressure+=.018*(m.shotsH-m.shotsA);
            if(m.cornerH+m.cornerA>0)pressure+=.018*(m.cornerH-m.cornerA);
            if(m.posH+m.posA>0)pressure+=.0025*(m.posH-m.posA);
            if(m.cardH+m.cardA>0)pressure-=.035*(m.cardH-m.cardA);
            pressure=clamp(pressure,-.75,.75);
            double tempo=1.0;
            if(m.xgH+m.xgA>0&&m.min>10)tempo=clamp((m.xgH+m.xgA)/(2.55*Math.max(.20,m.min/90.0)),.70,1.45);
            double rh=clamp(lh*rem*tempo*(1+pressure),.01,3.0);
            double ra=clamp(la*rem*tempo*(1-pressure),.01,3.0);
            int hg=Math.max(0,m.hg),ag=Math.max(0,m.ag);
            outcome(m,hg,ag,rh,ra,false);totals(m,hg+ag,rh+ra);btts(m,hg,ag,rh,ra);
            if(m.min<=45){
                double hr=clamp((48.0-m.min)/48.0,0,1);
                double hh=clamp(lh*.46*hr*tempo*(1+pressure),.01,1.8);
                double ha=clamp(la*.46*hr*tempo*(1-pressure),.01,1.8);
                outcome(m,hg,ag,hh,ha,true);halfTotals(m,hg+ag,hh+ha);
            }else if(m.h1g>=0&&m.a1g>=0)doneHalf(m);
        }else{
            outcome(m,0,0,lh,la,false);totals(m,0,lh+la);btts(m,0,0,lh,la);
            outcome(m,0,0,lh*.46,la*.46,true);halfTotals(m,0,(lh+la)*.46);
        }
    }

    private void outcome(Match m,int bh,int ba,double lh,double la,boolean half){
        double p1=0,px=0,p2=0;
        for(int h=0;h<12;h++)for(int a=0;a<12;a++){
            double p=pois(h,lh)*pois(a,la),fh=bh+h,fa=ba+a;
            if(fh>fa)p1+=p;else if(fh==fa)px+=p;else p2+=p;
        }
        double s=p1+px+p2;if(s<=0)return;
        int a=(int)Math.round(p1/s*100),b=(int)Math.round(px/s*100),c=100-a-b;
        if(half){m.h1p1=a;m.h1px=b;m.h1p2=c;}else{m.p1=a;m.px=b;m.p2=c;}
    }
    private void totals(Match m,int g,double l){m.o15=over(g,l,1);m.u15=100-m.o15;m.o25=over(g,l,2);m.u25=100-m.o25;}
    private void halfTotals(Match m,int g,double l){
        m.ho05=over(g,l,0);m.hu05=100-m.ho05;
        m.ho15=over(g,l,1);m.hu15=100-m.ho15;
        int[] asian=asianOne(g,l);m.ho10=asian[0];m.hPush10=asian[1];m.hu10=asian[2];
    }
    private int[] asianOne(int current,double l){
        double under=0,push=0,over=0;
        for(int i=0;i<12;i++){double p=pois(i,l);int total=current+i;if(total<1)under+=p;else if(total==1)push+=p;else over+=p;}
        int u=(int)Math.round(under*100),ps=(int)Math.round(push*100),o=100-u-ps;return new int[]{o,ps,u};
    }
    private void btts(Match m,int hg,int ag,double lh,double la){
        double yes=0,total=0;
        for(int h=0;h<12;h++)for(int a=0;a<12;a++){double p=pois(h,lh)*pois(a,la);total+=p;if(hg+h>0&&ag+a>0)yes+=p;}
        m.bttsYes=(int)Math.round(yes/Math.max(.0001,total)*100);m.bttsNo=100-m.bttsYes;
    }
    private void doneHalf(Match m){
        int h=m.h1g,a=m.a1g,g=h+a;m.h1p1=h>a?100:0;m.h1px=h==a?100:0;m.h1p2=h<a?100:0;
        m.ho05=g>0?100:0;m.hu05=100-m.ho05;m.ho15=g>1?100:0;m.hu15=100-m.ho15;
        m.ho10=g>1?100:0;m.hu10=g<1?100:0;m.hPush10=g==1?100:0;
    }
    private int over(int current,double l,int t){if(current>t)return 100;double p=0;for(int i=0;i<12;i++)if(current+i>t)p+=pois(i,l);return(int)Math.round(clamp(p,0,1)*100);}
    private double pois(int k,double l){double f=1;for(int i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f;}

    private void render(){
        LinearLayout root=v();root.setBackgroundColor(BG);root.setPadding(dp(14),dp(10),dp(14),dp(10));
        LinearLayout head=new LinearLayout(this);head.setGravity(Gravity.CENTER_VERTICAL);
        if(navLevel>0){Button back=new Button(this);back.setText("←");back.setTextSize(20);back.setTextColor(Color.WHITE);back.setBackground(box(CARD2,12));head.addView(back,new LinearLayout.LayoutParams(dp(54),dp(46)));back.setOnClickListener(x->{navLevel--;if(navLevel==0){selectedCountry="";selectedLeague="";}else selectedLeague="";render();});}
        TextView title=txt(navLevel==0?"DENZL":navLevel==1?selectedCountry:selectedLeague,navLevel==0?26:21,TEXT,true);title.setGravity(Gravity.CENTER);head.addView(title,new LinearLayout.LayoutParams(0,dp(50),1));root.addView(head);
        TextView sub=txt("Вероятность DENZL · коэффициенты BETCITY",12,MUTED,false);sub.setGravity(Gravity.CENTER);root.addView(sub);
        LinearLayout tabs=new LinearLayout(this);tabs.setWeightSum(2);Button lb=tab("ЛИНИЯ",!liveMode),lv=tab("LIVE",liveMode);tabs.addView(lb,new LinearLayout.LayoutParams(0,dp(50),1));tabs.addView(lv,new LinearLayout.LayoutParams(0,dp(50),1));LinearLayout.LayoutParams tp=new LinearLayout.LayoutParams(-1,-2);tp.setMargins(0,dp(8),0,0);root.addView(tabs,tp);
        lb.setOnClickListener(x->{liveMode=false;stopLiveTimer();navLevel=0;selectedCountry="";selectedLeague="";load(false);});
        lv.setOnClickListener(x->{liveMode=true;navLevel=0;selectedCountry="";selectedLeague="";load(true);startLiveTimer();});
        if(liveMode){TextView auto=txt("LIVE обновляется автоматически каждые 30 секунд",11,GREEN,true);auto.setGravity(Gravity.CENTER);auto.setPadding(0,dp(7),0,0);root.addView(auto);}
        EditText search=new EditText(this);search.setHint("Поиск страны, лиги или команды");search.setText(searchText);search.setTextColor(TEXT);search.setHintTextColor(MUTED);search.setSingleLine(true);search.setBackground(box(CARD2,12));search.setPadding(dp(12),0,dp(12),0);LinearLayout.LayoutParams sp=new LinearLayout.LayoutParams(-1,dp(46));sp.setMargins(0,dp(8),0,0);root.addView(search,sp);search.setOnEditorActionListener((v,a,e)->{searchText=v.getText().toString().trim();render();return true;});
        boolean err=status.contains("HTTP")||status.toLowerCase(Locale.ROOT).contains("ошиб");TextView st=txt(status,12,busy.get()?ACCENT:(err?RED:GREEN),true);st.setGravity(Gravity.CENTER);st.setPadding(0,dp(8),0,dp(4));root.addView(st);
        ScrollView sc=new ScrollView(this);LinearLayout list=v();if(navLevel==0)renderCountries(list);else if(navLevel==1)renderLeagues(list);else renderMatches(list);sc.addView(list);root.addView(sc,new LinearLayout.LayoutParams(-1,0,1));
        root.addView(txt("Матчи, LIVE и коэффициенты: BETCITY. Вероятности рассчитывает DENZL.",10,MUTED,false));
        setContentView(root);
    }
    private List<Match> active(){return liveMode?liveMatches:lineMatches;}
    private boolean matchesSearch(String...v){if(searchText==null||searchText.trim().isEmpty())return true;String q=searchText.toLowerCase(Locale.ROOT);for(String s:v)if(s!=null&&s.toLowerCase(Locale.ROOT).contains(q))return true;return false;}
    private void renderCountries(LinearLayout list){Map<String,Integer> c=new LinkedHashMap<>();for(Match m:active())if(matchesSearch(m.country,m.league,m.home,m.away))c.put(m.country,c.getOrDefault(m.country,0)+1);for(Map.Entry<String,Integer> e:c.entrySet()){LinearLayout r=navRow(e.getKey(),e.getValue());r.setOnClickListener(v->{selectedCountry=e.getKey();navLevel=1;searchText="";render();});list.addView(r);}}
    private void renderLeagues(LinearLayout list){Map<String,Integer> c=new LinkedHashMap<>();for(Match m:active())if(selectedCountry.equals(m.country)&&matchesSearch(m.league,m.home,m.away))c.put(m.league,c.getOrDefault(m.league,0)+1);for(Map.Entry<String,Integer> e:c.entrySet()){LinearLayout r=navRow(e.getKey(),e.getValue());r.setOnClickListener(v->{selectedLeague=e.getKey();navLevel=2;searchText="";render();});list.addView(r);}}
    private LinearLayout navRow(String n,int count){LinearLayout r=new LinearLayout(this);r.setGravity(Gravity.CENTER_VERTICAL);r.setPadding(dp(14),dp(8),dp(14),dp(8));r.setBackground(box(CARD,14));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(62));p.setMargins(0,dp(7),0,0);r.setLayoutParams(p);r.addView(txt(n,16,TEXT,true),new LinearLayout.LayoutParams(0,-2,1));r.addView(txt(String.valueOf(count),15,ACCENT,true));r.addView(txt("  ›",20,MUTED,true));return r;}
    private void renderMatches(LinearLayout list){for(Match m:active())if(selectedCountry.equals(m.country)&&selectedLeague.equals(m.league)&&matchesSearch(m.home,m.away,m.league))list.addView(card(m));}

    private View card(Match m){
        LinearLayout c=v();c.setPadding(dp(12),dp(10),dp(12),dp(10));c.setBackground(box(CARD,16));LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.setMargins(0,dp(9),0,0);c.setLayoutParams(cp);
        LinearLayout top=new LinearLayout(this);top.addView(txt(m.league,11,MUTED,false),new LinearLayout.LayoutParams(0,-2,1));String tm=m.min>0?m.min+"'":time(m.ts);top.addView(txt(tm,11,m.min>0?GREEN:MUTED,true));c.addView(top);
        String score=m.hg>=0&&m.ag>=0?"   "+m.hg+":"+m.ag:"";TextView teams=txt(m.home+" — "+m.away+score,17,TEXT,true);teams.setPadding(0,dp(7),0,dp(8));c.addView(teams);
        LinearLayout tabs=new LinearLayout(this);tabs.setWeightSum(2);Button full=small("МАТЧ",true),first=small("1-Й ТАЙМ",false);tabs.addView(full,new LinearLayout.LayoutParams(0,dp(40),1));tabs.addView(first,new LinearLayout.LayoutParams(0,dp(40),1));c.addView(tabs);
        LinearLayout host=v();host.addView(fullMarket(m));c.addView(host);full.setOnClickListener(x->{host.removeAllViews();host.addView(fullMarket(m));full.setBackground(box(ACCENT,10));first.setBackground(box(CARD2,10));});first.setOnClickListener(x->{host.removeAllViews();host.addView(firstMarket(m));first.setBackground(box(ACCENT,10));full.setBackground(box(CARD2,10));});
        if(liveMode){TextView d=txt("Статистика",13,ACCENT,true);d.setGravity(Gravity.CENTER);d.setPadding(0,dp(10),0,dp(3));c.addView(d);d.setOnClickListener(x->toggleStats(c,d,m));}
        return c;
    }
    private View fullMarket(Match m){
        LinearLayout b=v();b.setPadding(0,dp(8),0,0);
        b.addView(outcomes(m.p1,m.px,m.p2,m.p1Odd,m.xOdd,m.p2Odd));
        addTotal(b,"ТОТАЛ 2.5","ТБ 2.5",m.o25,m.o25Odd,"ТМ 2.5",m.u25,m.u25Odd);
        addTotal(b,"ТОТАЛ 1.5","ТБ 1.5",m.o15,m.o15Odd,"ТМ 1.5",m.u15,m.u15Odd);
        addTotal(b,"ОБЕ ЗАБЬЮТ","ДА",m.bttsYes,m.bttsYesOdd,"НЕТ",m.bttsNo,m.bttsNoOdd);
        return b;
    }
    private View firstMarket(Match m){
        LinearLayout b=v();b.setPadding(0,dp(8),0,0);
        b.addView(outcomes(m.h1p1,m.h1px,m.h1p2,m.hp1Odd,m.hxOdd,m.hp2Odd));
        addTotal(b,"1-Й ТАЙМ · ТОТАЛ 0.5","ТБ 0.5",m.ho05,m.ho05Odd,"ТМ 0.5",m.hu05,m.hu05Odd);
        addTotal(b,"1-Й ТАЙМ · ТОТАЛ 1.0","ТБ 1.0",m.ho10,m.ho10Odd,"ТМ 1.0",m.hu10,m.hu10Odd);
        TextView push=txt("Возврат при 1 голе: "+(m.hPush10<0?"—":m.hPush10+"%"),10,MUTED,false);push.setGravity(Gravity.CENTER);b.addView(push);
        addTotal(b,"1-Й ТАЙМ · ТОТАЛ 1.5","ТБ 1.5",m.ho15,m.ho15Odd,"ТМ 1.5",m.hu15,m.hu15Odd);
        return b;
    }
    private View outcomes(int a,int b,int c,double ao,double bo,double co){LinearLayout r=new LinearLayout(this);r.setWeightSum(3);r.addView(prob("П1",a,ao,false),new LinearLayout.LayoutParams(0,dp(72),1));r.addView(prob("X",b,bo,false),new LinearLayout.LayoutParams(0,dp(72),1));r.addView(prob("П2",c,co,false),new LinearLayout.LayoutParams(0,dp(72),1));return r;}
    private void addTotal(LinearLayout p,String title,String l,int lp,double lo,String rr,int rp,double ro){TextView t=txt(title,11,MUTED,true);t.setPadding(0,dp(10),0,dp(4));p.addView(t);LinearLayout r=new LinearLayout(this);r.setWeightSum(2);r.addView(prob(l,lp,lo,lp>=58&&lp>rp),new LinearLayout.LayoutParams(0,dp(72),1));r.addView(prob(rr,rp,ro,rp>=58&&rp>lp),new LinearLayout.LayoutParams(0,dp(72),1));p.addView(r);}
    private View prob(String label,int p,double odd,boolean hi){LinearLayout b=v();b.setGravity(Gravity.CENTER);b.setBackground(box(hi?GREEN:CARD2,11));b.addView(txt(label,12,hi?Color.WHITE:MUTED,true));String s=(p<0?"—":p+"%")+(odd>1?" ("+fmtOdd(odd)+")":"");b.addView(txt(s,16,Color.WHITE,true));return b;}
    private void toggleStats(LinearLayout c,TextView ctl,Match m){Object tag=ctl.getTag();if(tag instanceof View){c.removeView((View)tag);ctl.setTag(null);return;}LinearLayout b=v();b.setPadding(dp(10),dp(8),dp(10),dp(8));b.setBackground(box(CARD2,10));b.addView(stat("Удары",m.shots));b.addView(stat("В створ",m.shotsOn));b.addView(stat("xG",m.xg));b.addView(stat("Владение",m.possession));b.addView(stat("Угловые",m.corners));b.addView(stat("Фолы",m.fouls));b.addView(stat("Офсайды",m.offsides));b.addView(stat("Карточки",m.cards));c.addView(b);ctl.setTag(b);}
    private View stat(String a,String b){LinearLayout r=new LinearLayout(this);r.addView(txt(a,12,MUTED,false),new LinearLayout.LayoutParams(0,-2,1));r.addView(txt(b==null?"—":b,12,TEXT,true));return r;}

    private JSONObject getJson(String url,boolean live)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(10000);c.setReadTimeout(15000);
        c.setRequestProperty("Accept","application/json, text/plain, */*");c.setRequestProperty("Accept-Language","ru-RU,ru;q=0.9");
        c.setRequestProperty("User-Agent","Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36");
        c.setRequestProperty("Referer",live?"https://betcity.ru/ru/live/football":"https://betcity.ru/ru/line/football");
        int code=c.getResponseCode();InputStream is=code>=200&&code<300?c.getInputStream():c.getErrorStream();String body=read(is);c.disconnect();
        if(code<200||code>=300)throw new Exception("BETCITY: HTTP "+code);
        if(body.trim().isEmpty())throw new Exception("BETCITY: пустой ответ");
        return new JSONObject(body);
    }
    private String read(InputStream is)throws Exception{if(is==null)return"";BufferedReader r=new BufferedReader(new InputStreamReader(is));StringBuilder b=new StringBuilder();String s;while((s=r.readLine())!=null)b.append(s);r.close();return b.toString();}
    private boolean truth(Object o){if(o==null)return false;String s=String.valueOf(o);return "1".equals(s)||"true".equalsIgnoreCase(s)||"yes".equalsIgnoreCase(s);}
    private int findMinute(JSONObject e){
        String[] keys={"minute","min","time_ev","timer","time_game","current_minute"};
        for(String k:keys){if(e.has(k)){int x=parseMinute(String.valueOf(e.opt(k)));if(x>0&&x<130)return x;}}
        return 0;
    }
    private void parseScore(String s,Match m,boolean half){
        if(s==null)return;String first=s.split(",")[0];int[] x=score(first);if(x==null)return;
        if(half){m.h1g=x[0];m.a1g=x[1];}else{m.hg=x[0];m.ag=x[1];}
    }
    private int[] score(String s){if(s==null)return null;java.util.regex.Matcher q=java.util.regex.Pattern.compile("(\\d+)\\s*[:\\-]\\s*(\\d+)").matcher(s);if(!q.find())return null;try{return new int[]{Integer.parseInt(q.group(1)),Integer.parseInt(q.group(2))};}catch(Exception e){return null;}}
    private long parseBetcityDate(Object o){
        if(o instanceof Number){long v=((Number)o).longValue();return v>100000000000L?v/1000:v;}
        String s=String.valueOf(o);if(s.matches("\\d{10,13}")){try{long v=Long.parseLong(s);return v>100000000000L?v/1000:v;}catch(Exception ignored){}}
        String[] f={"yyyy-MM-dd HH:mm:ss","yyyy-MM-dd HH:mm","dd.MM.yyyy HH:mm"};
        for(String p:f)try{SimpleDateFormat d=new SimpleDateFormat(p,Locale.US);d.setTimeZone(TimeZone.getDefault());Date x=d.parse(s);if(x!=null)return x.getTime()/1000;}catch(Exception ignored){}
        return 0;
    }
    private String dateMinus(int d){java.util.Calendar c=java.util.Calendar.getInstance();c.add(java.util.Calendar.DAY_OF_YEAR,-d);return new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(c.getTime());}
    private String key(String s){return s==null?"":s.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]","");}
    private double numObj(Object o){if(o==null)return 0;try{return Double.parseDouble(String.valueOf(o).replace("%","").replace(',','.'));}catch(Exception e){return 0;}}
    private int parseMinute(String s){try{java.util.regex.Matcher m=java.util.regex.Pattern.compile("(\\d{1,3})").matcher(s);return m.find()?Integer.parseInt(m.group(1)):0;}catch(Exception e){return 0;}}
    private String pair(double h,double a,String suf){if(h==0&&a==0)return"—";return trim(h)+suf+" — "+trim(a)+suf;}
    private String pairD(double h,double a){if(h==0&&a==0)return"—";return String.format(Locale.US,"%.2f — %.2f",h,a);}
    private String trim(double v){return Math.rint(v)==v?String.valueOf((int)v):String.format(Locale.US,"%.1f",v);}
    private String fmtOdd(double v){return String.format(Locale.US,"%.2f",v);}
    private String message(Exception e){return e.getMessage()==null?e.getClass().getSimpleName():e.getMessage();}
    private double clamp(double v,double lo,double hi){return Math.max(lo,Math.min(hi,v));}
    private String time(long ts){if(ts<=0)return"—";return new SimpleDateFormat("HH:mm",Locale.getDefault()).format(new Date(ts*1000));}
    private LinearLayout v(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private Button tab(String s,boolean on){Button b=new Button(this);b.setText(s);b.setTextColor(Color.WHITE);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setBackground(box(on?ACCENT:CARD,12));return b;}
    private Button small(String s,boolean on){Button b=tab(s,on);b.setTextSize(12);return b;}
    private TextView txt(String s,float z,int c,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}
    private GradientDrawable box(int c,int r){GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(dp(r));return d;}
    private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}

    static class TeamProfile{
        int n,w,d,l;double gf,ga;
        void add(int f,int a,boolean home){n++;gf+=f;ga+=a;if(f>a)w++;else if(f==a)d++;else l++;}
        double gf(){return n==0?1.3:gf/n;}double ga(){return n==0?1.3:ga/n;}double form(){return n==0?.5:(3.0*w+d)/(3.0*n);}
    }
    static class Match{
        String id="",country="Прочее",league="Прочие соревнования",home="—",away="—",shots="—",shotsOn="—",possession="—",xg="—",corners="—",fouls="—",offsides="—",cards="—";
        long ts;int min=0,hg=-1,ag=-1,h1g=-1,a1g=-1,sampleH=0,sampleA=0;
        double homeForm=.5,awayForm=.5,gfH=1.3,gaH=1.3,gfA=1.3,gaA=1.3;
        double shotsH,shotsA,sotH,sotA,posH,posA,xgH,xgA,cornerH,cornerA,foulH,foulA,offH,offA,cardH,cardA;
        int p1=-1,px=-1,p2=-1,o25=-1,u25=-1,o15=-1,u15=-1,bttsYes=-1,bttsNo=-1;
        int h1p1=-1,h1px=-1,h1p2=-1,ho05=-1,hu05=-1,ho10=-1,hu10=-1,hPush10=-1,ho15=-1,hu15=-1;
        double p1Odd,xOdd,p2Odd,o25Odd,u25Odd,o15Odd,u15Odd,bttsYesOdd,bttsNoOdd;
        double hp1Odd,hxOdd,hp2Odd,ho05Odd,hu05Odd,ho10Odd,hu10Odd,ho15Odd,hu15Odd;
    }
}