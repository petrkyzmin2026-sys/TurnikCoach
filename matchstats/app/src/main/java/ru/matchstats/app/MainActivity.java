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
    private static final String BASE = "https://api.sofascore.com/api/v1";
    private static final int BG = Color.rgb(10,15,20), CARD = Color.rgb(20,28,36), CARD2 = Color.rgb(26,36,46);
    private static final int TEXT = Color.rgb(240,244,247), MUTED = Color.rgb(145,157,169), GREEN = Color.rgb(38,166,91), ACCENT = Color.rgb(64,145,255), RED = Color.rgb(220,80,80);

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newFixedThreadPool(4);
    private final AtomicBoolean loading = new AtomicBoolean(false);
    private final List<Match> lineMatches = new ArrayList<>();
    private final List<Match> liveMatches = new ArrayList<>();
    private boolean liveMode = false;
    private String statusText = "Загрузка реальных событий…";

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        render();
        loadMatches(false);
    }

    @Override protected void onDestroy() {
        io.shutdownNow();
        super.onDestroy();
    }

    private void loadMatches(boolean live) {
        if (!loading.compareAndSet(false, true)) return;
        statusText = live ? "Обновление LIVE…" : "Загрузка линии…";
        render();
        io.execute(() -> {
            try {
                String endpoint;
                if (live) endpoint = BASE + "/sport/football/events/live";
                else {
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                    sdf.setTimeZone(TimeZone.getDefault());
                    endpoint = BASE + "/sport/football/scheduled-events/" + sdf.format(new Date());
                }
                JSONObject root = getJson(endpoint);
                JSONArray events = root.optJSONArray("events");
                List<Match> out = new ArrayList<>();
                if (events != null) {
                    for (int i=0; i<events.length() && out.size()<30; i++) {
                        JSONObject e = events.optJSONObject(i);
                        if (e == null) continue;
                        JSONObject st = e.optJSONObject("status");
                        String type = st == null ? "" : st.optString("type", "");
                        if (!live && !(type.equals("notstarted") || type.equals("scheduled"))) continue;
                        Match m = parseEvent(e, live);
                        if (m != null) {
                            try { applyOdds(m, getJson(BASE + "/event/" + m.id + "/odds/1/all")); } catch (Exception ignored) {}
                            if (live) {
                                try { applyStatistics(m, getJson(BASE + "/event/" + m.id + "/statistics")); } catch (Exception ignored) {}
                            }
                            out.add(m);
                        }
                    }
                }
                handler.post(() -> {
                    List<Match> target = live ? liveMatches : lineMatches;
                    target.clear(); target.addAll(out);
                    statusText = out.isEmpty() ? (live ? "Сейчас нет футбольных матчей LIVE" : "На сегодня линия не получена") : "Получено реальных матчей: " + out.size();
                    loading.set(false);
                    render();
                });
            } catch (Exception ex) {
                handler.post(() -> {
                    statusText = "Ошибка получения данных: " + ex.getClass().getSimpleName();
                    loading.set(false);
                    render();
                });
            }
        });
    }

    private JSONObject getJson(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(7000); c.setReadTimeout(9000); c.setRequestMethod("GET");
        c.setRequestProperty("User-Agent", "Mozilla/5.0 (Android) DENZL/0.5");
        c.setRequestProperty("Accept", "application/json");
        int code = c.getResponseCode();
        if (code < 200 || code >= 300) throw new Exception("HTTP " + code);
        BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream()));
        StringBuilder b = new StringBuilder(); String s;
        while ((s = r.readLine()) != null) b.append(s);
        r.close(); c.disconnect();
        return new JSONObject(b.toString());
    }

    private Match parseEvent(JSONObject e, boolean live) {
        long id = e.optLong("id", -1); if (id < 0) return null;
        JSONObject h = e.optJSONObject("homeTeam"), a = e.optJSONObject("awayTeam");
        if (h == null || a == null) return null;
        Match m = new Match(); m.id = id; m.home = h.optString("name", "—"); m.away = a.optString("name", "—");
        JSONObject t = e.optJSONObject("tournament");
        String league = t == null ? "Футбол" : t.optString("name", "Футбол");
        JSONObject cat = t == null ? null : t.optJSONObject("category");
        m.league = cat == null ? league : cat.optString("name", "") + " · " + league;
        m.startTimestamp = e.optLong("startTimestamp", 0);
        JSONObject hs = e.optJSONObject("homeScore"), as = e.optJSONObject("awayScore");
        m.homeGoals = hs == null ? -1 : hs.optInt("current", -1); m.awayGoals = as == null ? -1 : as.optInt("current", -1);
        m.h1HomeGoals = hs == null ? -1 : hs.optInt("period1", -1); m.h1AwayGoals = as == null ? -1 : as.optInt("period1", -1);
        if (live) {
            JSONObject time = e.optJSONObject("time"); long start = time == null ? 0 : time.optLong("currentPeriodStartTimestamp", 0);
            if (start > 0) {
                int elapsed = (int)((System.currentTimeMillis()/1000 - start)/60);
                JSONObject status = e.optJSONObject("status"); String period = status == null ? "" : status.optString("period", "");
                m.minute = period.contains("2") ? Math.min(90, 45 + Math.max(0,elapsed)) : Math.min(45, Math.max(0,elapsed));
            }
        }
        return m;
    }

    private void applyOdds(Match m, JSONObject root) {
        JSONArray markets = root.optJSONArray("markets"); if (markets == null) return;
        for (int i=0;i<markets.length();i++) {
            JSONObject mk = markets.optJSONObject(i); if (mk==null) continue;
            String name = mk.optString("marketName", "").toLowerCase(Locale.ROOT);
            JSONArray ch = mk.optJSONArray("choices"); if (ch==null) continue;
            boolean firstHalf = name.contains("1st half") || name.contains("first half") || name.contains("1-й тайм");
            if ((name.equals("full time") || name.contains("match result")) && !firstHalf) {
                double[] o = choiceOdds(ch,"1","x","2"); m.o1=o[0];m.ox=o[1];m.o2=o[2]; fair3(m,o,false);
            } else if (firstHalf && (name.contains("result") || name.contains("1x2") || name.contains("half time"))) {
                double[] o = choiceOdds(ch,"1","x","2"); m.h1o1=o[0];m.h1ox=o[1];m.h1o2=o[2]; fair3(m,o,true);
            }
            if (name.contains("2.5") && !firstHalf && (name.contains("total") || name.contains("goals"))) {
                double[] o = overUnder(ch,"2.5"); m.oOver25=o[0];m.oUnder25=o[1]; fair2(m,o,25,false);
            }
            if (name.contains("1.5") && !firstHalf && (name.contains("total") || name.contains("goals"))) {
                double[] o = overUnder(ch,"1.5"); m.oOver15=o[0];m.oUnder15=o[1]; fair2(m,o,15,false);
            }
            if (firstHalf && name.contains("0.5")) {
                double[] o = overUnder(ch,"0.5"); m.h1OOver05=o[0];m.h1OUnder05=o[1]; fair2(m,o,5,true);
            }
            if (firstHalf && name.contains("1.5")) {
                double[] o = overUnder(ch,"1.5"); m.h1OOver15=o[0];m.h1OUnder15=o[1]; fair2(m,o,15,true);
            }
        }
    }

    private double[] choiceOdds(JSONArray ch, String a, String b, String c) {
        double[] out={0,0,0};
        for(int i=0;i<ch.length();i++){ JSONObject x=ch.optJSONObject(i); if(x==null)continue; String n=x.optString("name","").trim().toLowerCase(Locale.ROOT); double o=decimalOdds(x); if(n.equals(a))out[0]=o; else if(n.equals(b))out[1]=o; else if(n.equals(c))out[2]=o; }
        return out;
    }

    private double[] overUnder(JSONArray ch, String line) {
        double[] out={0,0};
        for(int i=0;i<ch.length();i++){ JSONObject x=ch.optJSONObject(i); if(x==null)continue; String n=x.optString("name","").toLowerCase(Locale.ROOT); if(!n.contains(line) && ch.length()>2)continue; double o=decimalOdds(x); if(n.contains("over")||n.contains("больше")||n.contains("тб"))out[0]=o; if(n.contains("under")||n.contains("меньше")||n.contains("тм"))out[1]=o; }
        return out;
    }

    private double decimalOdds(JSONObject x) {
        double d=x.optDouble("decimalValue",0); if(d>1)return d;
        String f=x.optString("fractionalValue","");
        try { String[] p=f.split("/"); if(p.length==2) return 1.0 + Double.parseDouble(p[0])/Double.parseDouble(p[1]); } catch(Exception ignored){}
        return 0;
    }

    private void fair3(Match m,double[] o,boolean h1){ if(o[0]<=1||o[1]<=1||o[2]<=1)return; double a=1/o[0],b=1/o[1],c=1/o[2],s=a+b+c; int p1=(int)Math.round(a/s*100),px=(int)Math.round(b/s*100),p2=100-p1-px; if(h1){m.h1p1=p1;m.h1px=px;m.h1p2=p2;}else{m.p1=p1;m.px=px;m.p2=p2;} }
    private void fair2(Match m,double[] o,int line,boolean h1){ if(o[0]<=1||o[1]<=1)return; double a=1/o[0],b=1/o[1],s=a+b; int over=(int)Math.round(a/s*100), under=100-over; if(h1&&line==5){m.h1Over05=over;m.h1Under05=under;} else if(h1){m.h1Over15=over;m.h1Under15=under;} else if(line==25){m.over25=over;m.under25=under;} else {m.over15=over;m.under15=under;} }

    private void applyStatistics(Match m, JSONObject root) {
        JSONArray periods=root.optJSONArray("statistics"); if(periods==null)return;
        for(int i=0;i<periods.length();i++){ JSONObject p=periods.optJSONObject(i); if(p==null)continue; String period=p.optString("period",""); JSONArray groups=p.optJSONArray("groups"); if(groups==null)continue;
            for(int g=0;g<groups.length();g++){ JSONArray items=groups.optJSONObject(g)==null?null:groups.optJSONObject(g).optJSONArray("statisticsItems"); if(items==null)continue;
                for(int k=0;k<items.length();k++){ JSONObject it=items.optJSONObject(k); if(it==null)continue; String key=it.optString("key",""); String val=it.optString("home","—")+" — "+it.optString("away","—"); if(period.equals("ALL")){ if(key.equals("ballPossession"))m.possession=val; if(key.equals("shotsOnGoal"))m.shotsOn=val; if(key.equals("totalShotsOnGoal")||key.equals("totalShots"))m.shots=val; if(key.toLowerCase(Locale.ROOT).contains("expectedgoals"))m.xg=val; } }
            }
        }
    }

    private void render() {
        LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(BG); root.setPadding(dp(14),dp(12),dp(14),dp(12));
        root.addView(text("DENZL",26,TEXT,true));
        TextView sub=text("Реальные футбольные события · вероятность % + коэффициент",12,MUTED,false); sub.setPadding(0,0,0,dp(10)); root.addView(sub);
        LinearLayout tabs=new LinearLayout(this); tabs.setWeightSum(2); Button line=tabButton("ЛИНИЯ",!liveMode), live=tabButton("LIVE",liveMode); tabs.addView(line,new LinearLayout.LayoutParams(0,dp(48),1)); tabs.addView(live,new LinearLayout.LayoutParams(0,dp(48),1)); root.addView(tabs);
        line.setOnClickListener(v->{liveMode=false;loadMatches(false);}); live.setOnClickListener(v->{liveMode=true;loadMatches(true);});
        if (liveMode) {
            Button refresh = new Button(this);
            refresh.setText(loading.get() ? "ОБНОВЛЕНИЕ…" : "ОБНОВИТЬ LIVE");
            refresh.setEnabled(!loading.get());
            refresh.setTextColor(Color.WHITE);
            refresh.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
            refresh.setBackground(roundRect(ACCENT,12));
            LinearLayout.LayoutParams rp=new LinearLayout.LayoutParams(-1,dp(46)); rp.setMargins(0,dp(8),0,0); root.addView(refresh,rp);
            refresh.setOnClickListener(v->loadMatches(true));
        }
        TextView state=text(statusText,12,loading.get()?ACCENT:GREEN,true); state.setGravity(Gravity.CENTER); state.setPadding(0,dp(8),0,dp(2)); root.addView(state);
        ScrollView scroll=new ScrollView(this); LinearLayout list=new LinearLayout(this); list.setOrientation(LinearLayout.VERTICAL); for(Match m:(liveMode?liveMatches:lineMatches))list.addView(matchCard(m)); scroll.addView(list); root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        TextView note=text("LIVE обновляется только по кнопке. Источник событий: SofaScore. Если конкретный рынок коэффициентов не получен, DENZL показывает «—», без подстановки вымышленных значений.",10,MUTED,false); note.setPadding(0,dp(6),0,0); root.addView(note);
        setContentView(root);
    }

    private View matchCard(Match m){ LinearLayout c=new LinearLayout(this); c.setOrientation(LinearLayout.VERTICAL); c.setPadding(dp(12),dp(10),dp(12),dp(10)); c.setBackground(roundRect(CARD,16)); LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2); cp.setMargins(0,dp(9),0,0); c.setLayoutParams(cp);
        LinearLayout top=new LinearLayout(this); TextView l=text(m.league,11,MUTED,false), tm=text(m.minute>0?m.minute+"'":formatTime(m.startTimestamp),11,m.minute>0?GREEN:MUTED,true); top.addView(l,new LinearLayout.LayoutParams(0,-2,1)); top.addView(tm); c.addView(top);
        String score=(m.homeGoals>=0&&m.awayGoals>=0)?"   "+m.homeGoals+":"+m.awayGoals:""; TextView teams=text(m.home+" — "+m.away+score,17,TEXT,true); teams.setPadding(0,dp(7),0,dp(8)); c.addView(teams);
        LinearLayout mt=new LinearLayout(this); mt.setWeightSum(2); Button full=smallTab("МАТЧ",true), first=smallTab("1-Й ТАЙМ",false); mt.addView(full,new LinearLayout.LayoutParams(0,dp(40),1));mt.addView(first,new LinearLayout.LayoutParams(0,dp(40),1));c.addView(mt);
        LinearLayout host=new LinearLayout(this); host.setOrientation(LinearLayout.VERTICAL); host.addView(fullMarket(m)); c.addView(host);
        full.setOnClickListener(v->{host.removeAllViews();host.addView(fullMarket(m));full.setBackground(roundRect(ACCENT,10));first.setBackground(roundRect(CARD2,10));});
        first.setOnClickListener(v->{host.removeAllViews();host.addView(firstMarket(m));first.setBackground(roundRect(ACCENT,10));full.setBackground(roundRect(CARD2,10));});
        TextView det=text("Статистика",13,ACCENT,true); det.setGravity(Gravity.CENTER);det.setPadding(0,dp(10),0,dp(3));c.addView(det);det.setOnClickListener(v->toggleStats(c,det,m)); return c; }

    private View fullMarket(Match m){ LinearLayout b=vertical(); b.setPadding(0,dp(8),0,0); b.addView(outcomes(m.p1,m.px,m.p2,m.o1,m.ox,m.o2)); addTotal(b,"ТОТАЛ 2.5","ТБ 2.5",m.over25,m.oOver25,"ТМ 2.5",m.under25,m.oUnder25); addTotal(b,"ТОТАЛ 1.5","ТБ 1.5",m.over15,m.oOver15,"ТМ 1.5",m.under15,m.oUnder15); return b; }
    private View firstMarket(Match m){ LinearLayout b=vertical(); b.setPadding(0,dp(8),0,0); b.addView(outcomes(m.h1p1,m.h1px,m.h1p2,m.h1o1,m.h1ox,m.h1o2)); addTotal(b,"1-Й ТАЙМ · ТОТАЛ 0.5","ТБ 0.5",m.h1Over05,m.h1OOver05,"ТМ 0.5",m.h1Under05,m.h1OUnder05); addTotal(b,"1-Й ТАЙМ · ТОТАЛ 1.5","ТБ 1.5",m.h1Over15,m.h1OOver15,"ТМ 1.5",m.h1Under15,m.h1OUnder15); return b; }
    private View outcomes(int a,int b,int c,double oa,double ob,double oc){ LinearLayout r=new LinearLayout(this);r.setWeightSum(3);r.addView(probBox("П1",a,oa,false),new LinearLayout.LayoutParams(0,dp(66),1));r.addView(probBox("X",b,ob,false),new LinearLayout.LayoutParams(0,dp(66),1));r.addView(probBox("П2",c,oc,false),new LinearLayout.LayoutParams(0,dp(66),1));return r; }
    private void addTotal(LinearLayout p,String title,String la,int lp,double lo,String ra,int rp,double ro){ TextView t=text(title,11,MUTED,true);t.setPadding(0,dp(10),0,dp(4));p.addView(t);LinearLayout r=new LinearLayout(this);r.setWeightSum(2);boolean lg=lp>=58&&lp>rp,rg=rp>=58&&rp>lp;r.addView(probBox(la,lp,lo,lg),new LinearLayout.LayoutParams(0,dp(66),1));r.addView(probBox(ra,rp,ro,rg),new LinearLayout.LayoutParams(0,dp(66),1));p.addView(r); }
    private View probBox(String lab,int p,double o,boolean hi){ LinearLayout b=vertical();b.setGravity(Gravity.CENTER);b.setBackground(roundRect(hi?GREEN:CARD2,11));b.addView(text(lab,12,hi?Color.WHITE:MUTED,true));String ps=p<0?"—":p+"%", os=o<=1?"—":String.format(Locale.US,"%.2f",o);b.addView(text(ps+" ("+os+")",15,Color.WHITE,true));return b; }

    private void toggleStats(LinearLayout c,TextView ctl,Match m){ Object tag=ctl.getTag();if(tag instanceof View){c.removeView((View)tag);ctl.setTag(null);return;}LinearLayout b=vertical();b.setPadding(dp(10),dp(8),dp(10),dp(8));b.setBackground(roundRect(CARD2,10));b.addView(stat("Удары",m.shots));b.addView(stat("В створ",m.shotsOn));b.addView(stat("Владение",m.possession));b.addView(stat("xG",m.xg));c.addView(b);ctl.setTag(b); }
    private View stat(String a,String b){ LinearLayout r=new LinearLayout(this);TextView l=text(a,12,MUTED,false),v=text(b==null?"—":b,12,TEXT,true);r.addView(l,new LinearLayout.LayoutParams(0,-2,1));r.addView(v);return r; }

    private String formatTime(long ts){ if(ts<=0)return "—";SimpleDateFormat f=new SimpleDateFormat("HH:mm",Locale.getDefault());return f.format(new Date(ts*1000)); }
    private LinearLayout vertical(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private Button tabButton(String s,boolean on){Button b=new Button(this);b.setText(s);b.setTextColor(Color.WHITE);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setBackground(roundRect(on?ACCENT:CARD,12));return b;}
    private Button smallTab(String s,boolean on){Button b=tabButton(s,on);b.setTextSize(12);return b;}
    private TextView text(String s,float z,int c,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}
    private GradientDrawable roundRect(int c,int r){GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(dp(r));return d;}
    private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}

    static class Match {
        long id,startTimestamp; String league,home,away,shots="—",shotsOn="—",possession="—",xg="—"; int minute=0,homeGoals=-1,awayGoals=-1,h1HomeGoals=-1,h1AwayGoals=-1;
        int p1=-1,px=-1,p2=-1,over25=-1,under25=-1,over15=-1,under15=-1,h1p1=-1,h1px=-1,h1p2=-1,h1Over05=-1,h1Under05=-1,h1Over15=-1,h1Under15=-1;
        double o1,ox,o2,oOver25,oUnder25,oOver15,oUnder15,h1o1,h1ox,h1o2,h1OOver05,h1OUnder05,h1OOver15,h1OUnder15;
    }
}
