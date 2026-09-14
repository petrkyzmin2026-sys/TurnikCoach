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
import java.util.Comparator;
import java.util.Date;
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
    private static final String ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/";
    private static final int BG=Color.rgb(10,15,20), CARD=Color.rgb(20,28,36), CARD2=Color.rgb(26,36,46), TEXT=Color.rgb(240,244,247), MUTED=Color.rgb(145,157,169), GREEN=Color.rgb(38,166,91), ACCENT=Color.rgb(64,145,255), RED=Color.rgb(220,80,80), AMBER=Color.rgb(225,155,45);

    private final ExecutorService io = Executors.newFixedThreadPool(6);
    private final AtomicBoolean busy = new AtomicBoolean(false);
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final List<Match> lineMatches = new ArrayList<>();
    private final List<Match> liveMatches = new ArrayList<>();
    private boolean liveMode = false;
    private int navLevel = 0; // 0 countries, 1 leagues, 2 matches
    private String selectedCountry = "";
    private String selectedLeague = "";
    private String status = "Загрузка событий…";
    private String searchText = "";

    private static final LeagueDef[] LEAGUES = new LeagueDef[]{
            new LeagueDef("eng.1","Англия","Премьер-лига"),
            new LeagueDef("eng.2","Англия","Чемпионшип"),
            new LeagueDef("eng.fa","Англия","Кубок Англии"),
            new LeagueDef("eng.league_cup","Англия","Кубок английской лиги"),
            new LeagueDef("esp.1","Испания","Ла Лига"),
            new LeagueDef("esp.2","Испания","Сегунда"),
            new LeagueDef("ger.1","Германия","Бундеслига"),
            new LeagueDef("ger.2","Германия","2-я Бундеслига"),
            new LeagueDef("ita.1","Италия","Серия A"),
            new LeagueDef("ita.2","Италия","Серия B"),
            new LeagueDef("fra.1","Франция","Лига 1"),
            new LeagueDef("fra.2","Франция","Лига 2"),
            new LeagueDef("ned.1","Нидерланды","Эредивизи"),
            new LeagueDef("por.1","Португалия","Примейра-лига"),
            new LeagueDef("tur.1","Турция","Суперлига"),
            new LeagueDef("bel.1","Бельгия","Про-лига"),
            new LeagueDef("sco.1","Шотландия","Премьершип"),
            new LeagueDef("uefa.champions","Европа","Лига чемпионов УЕФА"),
            new LeagueDef("uefa.europa","Европа","Лига Европы УЕФА"),
            new LeagueDef("uefa.europa.conf","Европа","Лига конференций УЕФА"),
            new LeagueDef("usa.1","США","MLS"),
            new LeagueDef("mex.1","Мексика","Лига MX"),
            new LeagueDef("bra.1","Бразилия","Серия A"),
            new LeagueDef("arg.1","Аргентина","Примера"),
            new LeagueDef("jpn.1","Япония","J1 Лига"),
            new LeagueDef("aus.1","Австралия","A-Лига"),
            new LeagueDef("ksa.1","Саудовская Аравия","Про-лига")
    };

    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        render();
        load(false);
    }

    @Override public void onDestroy(){
        handler.removeCallbacksAndMessages(null);
        io.shutdownNow();
        super.onDestroy();
    }

    private final Runnable liveRefresh = new Runnable(){
        @Override public void run(){
            if(liveMode){ load(true); handler.postDelayed(this,30000); }
        }
    };

    private void startLiveTimer(){
        handler.removeCallbacks(liveRefresh);
        handler.postDelayed(liveRefresh,30000);
    }

    private void stopLiveTimer(){ handler.removeCallbacks(liveRefresh); }

    private void load(boolean isLive){
        if(!busy.compareAndSet(false,true)) return;
        status = isLive ? "Обновление LIVE…" : "Загрузка линии…";
        render();
        io.execute(() -> {
            List<Match> out = new ArrayList<>();
            String error = "";
            try { out = loadFromEspn(isLive); }
            catch(Exception e){ error = message(e); }
            final List<Match> result = out;
            final String err = error;
            runOnUiThread(() -> {
                List<Match> dst = isLive ? liveMatches : lineMatches;
                dst.clear(); dst.addAll(result);
                if(result.isEmpty()) status = !err.isEmpty() ? err : (isLive ? "Сейчас нет матчей LIVE" : "Будущие матчи не получены");
                else status = (isLive ? "LIVE: " : "ЛИНИЯ: ") + result.size() + " матчей · ESPN";
                busy.set(false);
                render();
            });
        });
    }

    private List<Match> loadFromEspn(boolean wantLive) throws Exception{
        List<Match> out = Collections.synchronizedList(new ArrayList<>());
        List<Runnable> jobs = new ArrayList<>();
        String date = espnDate();
        for(LeagueDef def: LEAGUES){
            jobs.add(() -> {
                try{
                    JSONObject root = getJson(ESPN + def.slug + "/scoreboard?dates=" + date);
                    parseLeague(root,def,wantLive,out);
                }catch(Exception ignored){}
            });
        }
        ExecutorService pool = Executors.newFixedThreadPool(6);
        List<java.util.concurrent.Future<?>> futures = new ArrayList<>();
        for(Runnable r:jobs) futures.add(pool.submit(r));
        for(java.util.concurrent.Future<?> f:futures) try{f.get();}catch(Exception ignored){}
        pool.shutdownNow();
        List<Match> copy = new ArrayList<>(out);
        copy.sort((a,b)->Long.compare(a.ts,b.ts));
        return copy;
    }

    private void parseLeague(JSONObject root, LeagueDef def, boolean wantLive, List<Match> out){
        JSONArray events = root.optJSONArray("events");
        if(events==null) return;
        long now = System.currentTimeMillis();
        for(int i=0;i<events.length();i++){
            JSONObject e = events.optJSONObject(i); if(e==null) continue;
            JSONArray comps = e.optJSONArray("competitions"); if(comps==null||comps.length()==0) continue;
            JSONObject c = comps.optJSONObject(0); if(c==null) continue;
            JSONObject st = c.optJSONObject("status");
            JSONObject type = st==null?null:st.optJSONObject("type");
            String state = type==null?"":type.optString("state","");
            boolean live = "in".equals(state);
            boolean pre = "pre".equals(state);
            if(wantLive && !live) continue;
            if(!wantLive && !pre) continue;
            Match m = parseEspnMatch(e,c,def,live);
            if(m==null) continue;
            if(!wantLive && m.ts>0 && m.ts*1000L < now-60000L) continue;
            calculateModel(m,live);
            out.add(m);
        }
    }

    private Match parseEspnMatch(JSONObject e, JSONObject c, LeagueDef def, boolean live){
        JSONArray teams = c.optJSONArray("competitors"); if(teams==null||teams.length()<2) return null;
        JSONObject home=null,away=null;
        for(int i=0;i<teams.length();i++){
            JSONObject x=teams.optJSONObject(i); if(x==null) continue;
            if("home".equals(x.optString("homeAway"))) home=x;
            else if("away".equals(x.optString("homeAway"))) away=x;
        }
        if(home==null||away==null) return null;
        Match m=new Match();
        m.id=e.optString("id",""); m.country=def.country; m.league=def.name; m.leagueSlug=def.slug;
        JSONObject ht=home.optJSONObject("team"), at=away.optJSONObject("team");
        String hn=ht==null?"—":ht.optString("displayName","—"), an=at==null?"—":at.optString("displayName","—");
        m.home=ruTeam(hn); m.away=ruTeam(an);
        m.homeRaw=hn; m.awayRaw=an;
        m.hg=parseInt(home.optString("score","-1"),-1); m.ag=parseInt(away.optString("score","-1"),-1);
        m.homeForm=formScore(home.optString("form","")); m.awayForm=formScore(away.optString("form",""));
        m.ts=parseIso(e.optString("date",""));
        JSONObject status=c.optJSONObject("status");
        if(live && status!=null){
            double clock=status.optDouble("clock",0); m.min=(int)Math.floor(clock/60.0);
            if(m.min<=0){ String dc=status.optString("displayClock",""); m.min=parseMinute(dc); }
        }
        parseStats(m,home,true); parseStats(m,away,false);
        parseFirstHalfScore(m,c);
        return m;
    }

    private void parseStats(Match m,JSONObject team,boolean home){
        JSONArray a=team.optJSONArray("statistics"); if(a==null) return;
        for(int i=0;i<a.length();i++){
            JSONObject s=a.optJSONObject(i); if(s==null) continue;
            String n=s.optString("name",""); double v=num(s.optString("displayValue","0"));
            if("possessionPct".equals(n)){ if(home)m.posH=v;else m.posA=v; }
            if("shotsOnTarget".equals(n)){ if(home)m.sotH=v;else m.sotA=v; }
            if("totalShots".equals(n)){ if(home)m.shotsH=v;else m.shotsA=v; }
            if("expectedGoals".equalsIgnoreCase(n)||"expectedGoalsFor".equalsIgnoreCase(n)){ if(home)m.xgH=v;else m.xgA=v; }
        }
        m.possession=fmtStat(m.posH,m.posA,"%"); m.shotsOn=fmtStat(m.sotH,m.sotA,""); m.shots=fmtStat(m.shotsH,m.shotsA,"");
        if(m.xgH>0||m.xgA>0) m.xg=String.format(Locale.US,"%.2f — %.2f",m.xgH,m.xgA);
    }

    private void parseFirstHalfScore(Match m,JSONObject c){
        JSONArray d=c.optJSONArray("details"); if(d==null) return; int h=0,a=0; boolean any=false;
        for(int i=0;i<d.length();i++){
            JSONObject x=d.optJSONObject(i); if(x==null||!x.optBoolean("scoringPlay",false)) continue;
            JSONObject clock=x.optJSONObject("clock"); double sec=clock==null?0:clock.optDouble("value",0);
            if(sec>45*60+600) continue;
            String tid=""; JSONObject tm=x.optJSONObject("team"); if(tm!=null) tid=tm.optString("id","");
            JSONArray comps=c.optJSONArray("competitors"); if(comps==null) continue;
            for(int j=0;j<comps.length();j++){
                JSONObject comp=comps.optJSONObject(j); JSONObject team=comp==null?null:comp.optJSONObject("team");
                if(team!=null&&tid.equals(team.optString("id",""))){ if("home".equals(comp.optString("homeAway")))h++; else a++; any=true; }
            }
        }
        if(any){m.h1g=h;m.a1g=a;}
    }

    private void calculateModel(Match m,boolean live){
        double hs=m.homeForm, as=m.awayForm;
        double diff=hs-as;
        double lh=clamp(1.45+1.00*diff,.45,2.75), la=clamp(1.12-.85*diff,.35,2.45);
        if(live){
            double rem=clamp((90.0-m.min)/90.0,0,1), pressure=0;
            if(m.xgH+m.xgA>0)pressure+=.32*(m.xgH-m.xgA);
            if(m.sotH+m.sotA>0)pressure+=.05*(m.sotH-m.sotA);
            if(m.shotsH+m.shotsA>0)pressure+=.015*(m.shotsH-m.shotsA);
            if(m.posH+m.posA>0)pressure+=.0035*(m.posH-m.posA);
            pressure=clamp(pressure,-.70,.70);
            double rh=clamp(lh*rem*(1+pressure),.02,2.7), ra=clamp(la*rem*(1-pressure),.02,2.7);
            int hg=Math.max(0,m.hg),ag=Math.max(0,m.ag);
            outcome(m,hg,ag,rh,ra,false); totals(m,hg+ag,rh+ra);
            if(m.min<=45){
                double hr=clamp((45.0-m.min)/45.0,0,1);
                double hh=clamp(lh*.46*hr*(1+pressure),.01,1.7), ha=clamp(la*.46*hr*(1-pressure),.01,1.7);
                outcome(m,hg,ag,hh,ha,true); halfTotals(m,hg+ag,hh+ha);
            }else if(m.h1g>=0&&m.a1g>=0) doneHalf(m);
        }else{
            outcome(m,0,0,lh,la,false); totals(m,0,lh+la);
            outcome(m,0,0,lh*.46,la*.46,true); halfTotals(m,0,(lh+la)*.46);
        }
    }

    private void outcome(Match m,int bh,int ba,double lh,double la,boolean half){
        double p1=0,px=0,p2=0;
        for(int h=0;h<10;h++)for(int a=0;a<10;a++){
            double p=pois(h,lh)*pois(a,la); int fh=bh+h,fa=ba+a;
            if(fh>fa)p1+=p; else if(fh==fa)px+=p; else p2+=p;
        }
        double s=p1+px+p2;if(s<=0)return;
        int a=(int)Math.round(p1/s*100),b=(int)Math.round(px/s*100),c=100-a-b;
        if(half){m.h1p1=a;m.h1px=b;m.h1p2=c;}else{m.p1=a;m.px=b;m.p2=c;}
    }
    private void totals(Match m,int g,double l){m.o15=over(g,l,1);m.u15=100-m.o15;m.o25=over(g,l,2);m.u25=100-m.o25;}
    private void halfTotals(Match m,int g,double l){m.ho05=over(g,l,0);m.hu05=100-m.ho05;m.ho15=over(g,l,1);m.hu15=100-m.ho15;}
    private void doneHalf(Match m){int h=m.h1g,a=m.a1g;m.h1p1=h>a?100:0;m.h1px=h==a?100:0;m.h1p2=h<a?100:0;int g=h+a;m.ho05=g>0?100:0;m.hu05=100-m.ho05;m.ho15=g>1?100:0;m.hu15=100-m.ho15;}
    private int over(int current,double l,int t){if(current>t)return 100;double p=0;for(int i=0;i<12;i++)if(current+i>t)p+=pois(i,l);return(int)Math.round(clamp(p,0,1)*100);}
    private double pois(int k,double l){double f=1;for(int i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f;}

    private double formScore(String form){
        if(form==null||form.isEmpty())return .5; double pts=0,w=0,weight=1.0;
        for(int i=form.length()-1;i>=0;i--){char c=Character.toUpperCase(form.charAt(i));if(c!='W'&&c!='D'&&c!='L')continue;pts+=(c=='W'?3:c=='D'?1:0)*weight;w+=3*weight;weight*=.82;}
        return w>0?clamp(pts/w,0.08,.92):.5;
    }

    private void render(){
        LinearLayout root=v();root.setBackgroundColor(BG);root.setPadding(dp(14),dp(10),dp(14),dp(10));
        LinearLayout head=new LinearLayout(this);head.setGravity(Gravity.CENTER_VERTICAL);
        if(navLevel>0){Button back=new Button(this);back.setText("←");back.setTextSize(20);back.setTextColor(Color.WHITE);back.setBackground(box(CARD2,12));head.addView(back,new LinearLayout.LayoutParams(dp(54),dp(46)));back.setOnClickListener(x->{navLevel--;if(navLevel==0){selectedCountry="";selectedLeague="";}else selectedLeague="";render();});}
        TextView title=txt(navLevel==0?"DENZL":navLevel==1?selectedCountry:selectedLeague,navLevel==0?26:21,TEXT,true);title.setGravity(Gravity.CENTER);head.addView(title,new LinearLayout.LayoutParams(0,dp(50),1));root.addView(head);
        TextView sub=txt("Вероятность DENZL · без коэффициентов",12,MUTED,false);sub.setGravity(Gravity.CENTER);root.addView(sub);
        LinearLayout tabs=new LinearLayout(this);tabs.setWeightSum(2);Button lb=tab("ЛИНИЯ",!liveMode),lv=tab("LIVE",liveMode);tabs.addView(lb,new LinearLayout.LayoutParams(0,dp(50),1));tabs.addView(lv,new LinearLayout.LayoutParams(0,dp(50),1));LinearLayout.LayoutParams tp=new LinearLayout.LayoutParams(-1,-2);tp.setMargins(0,dp(8),0,0);root.addView(tabs,tp);
        lb.setOnClickListener(x->{liveMode=false;stopLiveTimer();navLevel=0;selectedCountry="";selectedLeague="";load(false);});
        lv.setOnClickListener(x->{liveMode=true;navLevel=0;selectedCountry="";selectedLeague="";load(true);startLiveTimer();});
        if(liveMode){TextView auto=txt("LIVE обновляется автоматически каждые 30 секунд",11,GREEN,true);auto.setGravity(Gravity.CENTER);auto.setPadding(0,dp(7),0,0);root.addView(auto);}
        EditText search=new EditText(this);search.setHint("Поиск страны, лиги или команды");search.setText(searchText);search.setTextColor(TEXT);search.setHintTextColor(MUTED);search.setSingleLine(true);search.setBackground(box(CARD2,12));search.setPadding(dp(12),0,dp(12),0);LinearLayout.LayoutParams sp=new LinearLayout.LayoutParams(-1,dp(46));sp.setMargins(0,dp(8),0,0);root.addView(search,sp);search.setOnEditorActionListener((v,action,event)->{searchText=v.getText().toString().trim();render();return true;});
        boolean err=status.contains("HTTP")||status.toLowerCase(Locale.ROOT).contains("ошиб");TextView st=txt(status,12,busy.get()?ACCENT:(err?RED:GREEN),true);st.setGravity(Gravity.CENTER);st.setPadding(0,dp(8),0,dp(4));root.addView(st);
        ScrollView sc=new ScrollView(this);LinearLayout list=v();
        if(navLevel==0)renderCountries(list); else if(navLevel==1)renderLeagues(list); else renderMatches(list);
        sc.addView(list);root.addView(sc,new LinearLayout.LayoutParams(-1,0,1));
        root.addView(txt("Источник событий: ESPN. Вероятности рассчитываются локально на телефоне.",10,MUTED,false));
        setContentView(root);
    }

    private List<Match> active(){return liveMode?liveMatches:lineMatches;}
    private boolean matchesSearch(String...vals){if(searchText==null||searchText.trim().isEmpty())return true;String q=searchText.toLowerCase(Locale.ROOT);for(String s:vals)if(s!=null&&s.toLowerCase(Locale.ROOT).contains(q))return true;return false;}

    private void renderCountries(LinearLayout list){
        Map<String,Integer> counts=new LinkedHashMap<>();
        for(Match m:active())if(matchesSearch(m.country,m.league,m.home,m.away))counts.put(m.country,counts.getOrDefault(m.country,0)+1);
        for(Map.Entry<String,Integer> e:counts.entrySet()){
            LinearLayout row=navRow(e.getKey(),e.getValue());row.setOnClickListener(v->{selectedCountry=e.getKey();navLevel=1;searchText="";render();});list.addView(row);
        }
    }

    private void renderLeagues(LinearLayout list){
        Map<String,Integer> counts=new LinkedHashMap<>();
        for(Match m:active())if(selectedCountry.equals(m.country)&&matchesSearch(m.league,m.home,m.away))counts.put(m.league,counts.getOrDefault(m.league,0)+1);
        for(Map.Entry<String,Integer> e:counts.entrySet()){
            LinearLayout row=navRow(e.getKey(),e.getValue());row.setOnClickListener(v->{selectedLeague=e.getKey();navLevel=2;searchText="";render();});list.addView(row);
        }
    }

    private LinearLayout navRow(String name,int count){
        LinearLayout r=new LinearLayout(this);r.setGravity(Gravity.CENTER_VERTICAL);r.setPadding(dp(14),dp(8),dp(14),dp(8));r.setBackground(box(CARD,14));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(62));p.setMargins(0,dp(7),0,0);r.setLayoutParams(p);r.addView(txt(name,16,TEXT,true),new LinearLayout.LayoutParams(0,-2,1));r.addView(txt(String.valueOf(count),15,ACCENT,true));TextView arrow=txt("  ›",20,MUTED,true);r.addView(arrow);return r;
    }

    private void renderMatches(LinearLayout list){for(Match m:active())if(selectedCountry.equals(m.country)&&selectedLeague.equals(m.league)&&matchesSearch(m.home,m.away,m.league))list.addView(card(m));}

    private View card(Match m){
        LinearLayout c=v();c.setPadding(dp(12),dp(10),dp(12),dp(10));c.setBackground(box(CARD,16));LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.setMargins(0,dp(9),0,0);c.setLayoutParams(cp);
        LinearLayout top=new LinearLayout(this);top.addView(txt(m.league,11,MUTED,false),new LinearLayout.LayoutParams(0,-2,1));String tm=m.min>0?m.min+"'":time(m.ts);top.addView(txt(tm+(m.min>=80?" · ПОЗДНИЙ LIVE":""),11,m.min>=80?AMBER:(m.min>0?GREEN:MUTED),true));c.addView(top);
        String score=m.hg>=0&&m.ag>=0?"   "+m.hg+":"+m.ag:"";TextView teams=txt(m.home+" — "+m.away+score,17,TEXT,true);teams.setPadding(0,dp(7),0,dp(8));c.addView(teams);
        LinearLayout tabs=new LinearLayout(this);tabs.setWeightSum(2);Button full=small("МАТЧ",true),first=small("1-Й ТАЙМ",false);tabs.addView(full,new LinearLayout.LayoutParams(0,dp(40),1));tabs.addView(first,new LinearLayout.LayoutParams(0,dp(40),1));c.addView(tabs);
        LinearLayout host=v();host.addView(fullMarket(m));c.addView(host);full.setOnClickListener(x->{host.removeAllViews();host.addView(fullMarket(m));full.setBackground(box(ACCENT,10));first.setBackground(box(CARD2,10));});first.setOnClickListener(x->{host.removeAllViews();host.addView(firstMarket(m));first.setBackground(box(ACCENT,10));full.setBackground(box(CARD2,10));});
        if(liveMode){TextView det=txt("Статистика",13,ACCENT,true);det.setGravity(Gravity.CENTER);det.setPadding(0,dp(10),0,dp(3));c.addView(det);det.setOnClickListener(x->toggleStats(c,det,m));}
        return c;
    }

    private View fullMarket(Match m){LinearLayout b=v();b.setPadding(0,dp(8),0,0);b.addView(outcomes(m.p1,m.px,m.p2));addTotal(b,"ТОТАЛ 2.5","ТБ 2.5",m.o25,"ТМ 2.5",m.u25);addTotal(b,"ТОТАЛ 1.5","ТБ 1.5",m.o15,"ТМ 1.5",m.u15);return b;}
    private View firstMarket(Match m){LinearLayout b=v();b.setPadding(0,dp(8),0,0);b.addView(outcomes(m.h1p1,m.h1px,m.h1p2));addTotal(b,"1-Й ТАЙМ · ТОТАЛ 0.5","ТБ 0.5",m.ho05,"ТМ 0.5",m.hu05);addTotal(b,"1-Й ТАЙМ · ТОТАЛ 1.5","ТБ 1.5",m.ho15,"ТМ 1.5",m.hu15);return b;}
    private View outcomes(int a,int b,int c){LinearLayout r=new LinearLayout(this);r.setWeightSum(3);r.addView(prob("П1",a,false),new LinearLayout.LayoutParams(0,dp(66),1));r.addView(prob("X",b,false),new LinearLayout.LayoutParams(0,dp(66),1));r.addView(prob("П2",c,false),new LinearLayout.LayoutParams(0,dp(66),1));return r;}
    private void addTotal(LinearLayout p,String title,String l,int lp,String rr,int rp){TextView t=txt(title,11,MUTED,true);t.setPadding(0,dp(10),0,dp(4));p.addView(t);LinearLayout r=new LinearLayout(this);r.setWeightSum(2);r.addView(prob(l,lp,lp>=58&&lp>rp),new LinearLayout.LayoutParams(0,dp(66),1));r.addView(prob(rr,rp,rp>=58&&rp>lp),new LinearLayout.LayoutParams(0,dp(66),1));p.addView(r);}
    private View prob(String l,int p,boolean hi){LinearLayout b=v();b.setGravity(Gravity.CENTER);b.setBackground(box(hi?GREEN:CARD2,11));b.addView(txt(l,12,hi?Color.WHITE:MUTED,true));b.addView(txt(p<0?"—":p+"%",17,Color.WHITE,true));return b;}
    private void toggleStats(LinearLayout c,TextView ctl,Match m){Object tag=ctl.getTag();if(tag instanceof View){c.removeView((View)tag);ctl.setTag(null);return;}LinearLayout b=v();b.setPadding(dp(10),dp(8),dp(10),dp(8));b.setBackground(box(CARD2,10));b.addView(stat("Удары",m.shots));b.addView(stat("В створ",m.shotsOn));b.addView(stat("Владение",m.possession));b.addView(stat("xG",m.xg));c.addView(b);ctl.setTag(b);}
    private View stat(String a,String b){LinearLayout r=new LinearLayout(this);r.addView(txt(a,12,MUTED,false),new LinearLayout.LayoutParams(0,-2,1));r.addView(txt(b==null?"—":b,12,TEXT,true));return r;}

    private JSONObject getJson(String url)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(9000);c.setReadTimeout(11000);c.setRequestProperty("Accept","application/json");c.setRequestProperty("User-Agent","DENZL/1.1 Android");int code=c.getResponseCode();InputStream is=code>=200&&code<300?c.getInputStream():c.getErrorStream();String body=read(is);c.disconnect();if(code<200||code>=300)throw new Exception("ESPN: HTTP "+code);if(body.trim().isEmpty())throw new Exception("ESPN: пустой ответ");return new JSONObject(body);}
    private String read(InputStream is)throws Exception{if(is==null)return"";BufferedReader r=new BufferedReader(new InputStreamReader(is));StringBuilder b=new StringBuilder();String s;while((s=r.readLine())!=null)b.append(s);r.close();return b.toString();}

    private String ruTeam(String s){
        String k=s.toLowerCase(Locale.ROOT);
        Map<String,String> m=TEAM_RU;
        if(m.containsKey(k))return m.get(k);
        return translit(s);
    }

    private static final Map<String,String> TEAM_RU=new LinkedHashMap<>();
    static{
        TEAM_RU.put("manchester city","Манчестер Сити");TEAM_RU.put("manchester united","Манчестер Юнайтед");TEAM_RU.put("liverpool","Ливерпуль");TEAM_RU.put("arsenal","Арсенал");TEAM_RU.put("chelsea","Челси");TEAM_RU.put("tottenham hotspur","Тоттенхэм");TEAM_RU.put("newcastle united","Ньюкасл Юнайтед");
        TEAM_RU.put("real madrid","Реал Мадрид");TEAM_RU.put("barcelona","Барселона");TEAM_RU.put("atlético madrid","Атлетико Мадрид");TEAM_RU.put("atletico madrid","Атлетико Мадрид");TEAM_RU.put("sevilla","Севилья");TEAM_RU.put("valencia","Валенсия");
        TEAM_RU.put("bayern munich","Бавария");TEAM_RU.put("borussia dortmund","Боруссия Дортмунд");TEAM_RU.put("bayer leverkusen","Байер Леверкузен");TEAM_RU.put("rb leipzig","РБ Лейпциг");
        TEAM_RU.put("juventus","Ювентус");TEAM_RU.put("inter milan","Интер");TEAM_RU.put("ac milan","Милан");TEAM_RU.put("napoli","Наполи");TEAM_RU.put("roma","Рома");TEAM_RU.put("lazio","Лацио");
        TEAM_RU.put("paris saint-germain","Пари Сен-Жермен");TEAM_RU.put("marseille","Марсель");TEAM_RU.put("monaco","Монако");TEAM_RU.put("lyon","Лион");
        TEAM_RU.put("ajax amsterdam","Аякс");TEAM_RU.put("psv eindhoven","ПСВ");TEAM_RU.put("feyenoord rotterdam","Фейеноорд");TEAM_RU.put("benfica","Бенфика");TEAM_RU.put("fc porto","Порту");TEAM_RU.put("sporting cp","Спортинг");
    }

    private String translit(String s){
        String x=s;
        String[][] dig={{"sch","ш"},{"sh","ш"},{"ch","ч"},{"zh","ж"},{"kh","х"},{"ts","ц"},{"ya","я"},{"yu","ю"},{"yo","ё"},{"ye","е"},{"ck","к"},{"ph","ф"},{"th","т"}};
        String lower=x.toLowerCase(Locale.ROOT);for(String[]d:dig)lower=lower.replace(d[0],d[1]);
        String latin="abcdefghijklmnopqrstuvwxyz";String[] rus={"а","б","к","д","е","ф","г","х","и","дж","к","л","м","н","о","п","к","р","с","т","у","в","в","кс","й","з"};
        StringBuilder b=new StringBuilder();for(int i=0;i<lower.length();i++){char c=lower.charAt(i);int p=latin.indexOf(c);if(p>=0)b.append(rus[p]);else b.append(c);}if(b.length()>0)b.setCharAt(0,Character.toUpperCase(b.charAt(0)));return b.toString();
    }

    private int parseMinute(String s){try{String n=s.replaceAll("[^0-9]"," ").trim().split(" ")[0];return Integer.parseInt(n);}catch(Exception e){return 0;}}
    private int parseInt(String s,int d){try{return Integer.parseInt(s);}catch(Exception e){return d;}}
    private double num(String s){try{return Double.parseDouble(s.replace("%","").replace(',','.'));}catch(Exception e){return 0;}}
    private long parseIso(String s){try{SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd'T'HH:mmX",Locale.US);f.setTimeZone(TimeZone.getTimeZone("UTC"));return f.parse(s).getTime()/1000;}catch(Exception e){try{SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX",Locale.US);f.setTimeZone(TimeZone.getTimeZone("UTC"));return f.parse(s).getTime()/1000;}catch(Exception ex){return 0;}}}
    private String espnDate(){SimpleDateFormat f=new SimpleDateFormat("yyyyMMdd",Locale.US);f.setTimeZone(TimeZone.getDefault());return f.format(new Date());}
    private String fmtStat(double h,double a,String suffix){if(h<=0&&a<=0)return"—";String hs=(Math.rint(h)==h?String.valueOf((int)h):String.format(Locale.US,"%.1f",h))+suffix;String as=(Math.rint(a)==a?String.valueOf((int)a):String.format(Locale.US,"%.1f",a))+suffix;return hs+" — "+as;}
    private String message(Exception e){return e.getMessage()==null?e.getClass().getSimpleName():e.getMessage();}
    private double clamp(double v,double lo,double hi){return Math.max(lo,Math.min(hi,v));}
    private String time(long ts){if(ts<=0)return"—";return new SimpleDateFormat("HH:mm",Locale.getDefault()).format(new Date(ts*1000));}
    private LinearLayout v(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private Button tab(String s,boolean on){Button b=new Button(this);b.setText(s);b.setTextColor(Color.WHITE);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setBackground(box(on?ACCENT:CARD,12));return b;}
    private Button small(String s,boolean on){Button b=tab(s,on);b.setTextSize(12);return b;}
    private TextView txt(String s,float z,int c,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}
    private GradientDrawable box(int c,int r){GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(dp(r));return d;}
    private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}

    static class LeagueDef{String slug,country,name;LeagueDef(String s,String c,String n){slug=s;country=c;name=n;}}
    static class Match{
        String id="",country="",league="",leagueSlug="",home="—",away="—",homeRaw="",awayRaw="",shots="—",shotsOn="—",possession="—",xg="—";long ts;int min=0,hg=-1,ag=-1,h1g=-1,a1g=-1;double homeForm=.5,awayForm=.5,shotsH,shotsA,sotH,sotA,posH,posA,xgH,xgA;int p1=-1,px=-1,p2=-1,o25=-1,u25=-1,o15=-1,u15=-1,h1p1=-1,h1px=-1,h1p2=-1,ho05=-1,hu05=-1,ho15=-1,hu15=-1;
    }
}
