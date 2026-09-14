package ru.petr.footballtotals;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final String BASE = "https://api.sofascore.com/api/v1";
    private static final String UA = "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36";
    private final ExecutorService pool = Executors.newFixedThreadPool(4);
    private LinearLayout list;
    private ProgressBar progress;
    private TextView status;

    static class Features {
        int n;
        double gf, ga, total, h1;
    }

    static class Pick {
        String label;
        int prob;
        Pick(String l, int p) { label=l; prob=p; }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        buildUi();
        loadToday();
    }

    private int dp(int v) { return (int)(v * getResources().getDisplayMetrics().density + 0.5f); }

    private TextView text(String s, float sp, int color) {
        TextView t=new TextView(this);
        t.setText(s); t.setTextSize(sp); t.setTextColor(color);
        return t;
    }

    private void buildUi() {
        LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(11,18,32));

        LinearLayout top=new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(dp(14),dp(12),dp(10),dp(10));
        top.setBackgroundColor(Color.rgb(17,24,39));

        LinearLayout titles=new LinearLayout(this);
        titles.setOrientation(LinearLayout.VERTICAL);
        TextView title=text("Football Totals",20,Color.WHITE);
        title.setTypeface(null,1);
        TextView sub=text("1-й тайм и весь матч · вероятность модели",11,Color.rgb(156,163,175));
        titles.addView(title); titles.addView(sub);
        top.addView(titles,new LinearLayout.LayoutParams(0,LinearLayout.LayoutParams.WRAP_CONTENT,1));

        Button refresh=new Button(this);
        refresh.setText("Обновить");
        refresh.setOnClickListener(v->loadToday());
        top.addView(refresh);
        root.addView(top);

        status=text("",12,Color.rgb(156,163,175));
        status.setPadding(dp(14),dp(8),dp(14),dp(4));
        root.addView(status);

        progress=new ProgressBar(this);
        progress.setVisibility(View.GONE);
        LinearLayout.LayoutParams pp=new LinearLayout.LayoutParams(dp(38),dp(38));
        pp.gravity=Gravity.CENTER_HORIZONTAL;
        root.addView(progress,pp);

        ScrollView scroll=new ScrollView(this);
        list=new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);
        list.setPadding(dp(10),dp(8),dp(10),dp(20));
        scroll.addView(list);
        root.addView(scroll,new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,0,1));
        setContentView(root);
    }

    private JSONObject getJson(String path) throws Exception {
        HttpURLConnection c=(HttpURLConnection)new URL(BASE+path).openConnection();
        c.setConnectTimeout(15000); c.setReadTimeout(25000);
        c.setRequestProperty("User-Agent",UA);
        c.setRequestProperty("Accept","application/json,text/plain,*/*");
        c.setRequestProperty("Referer","https://www.sofascore.com/");
        int code=c.getResponseCode();
        if(code!=200) throw new Exception("Источник статистики: HTTP "+code);
        BufferedReader br=new BufferedReader(new InputStreamReader(c.getInputStream()));
        StringBuilder sb=new StringBuilder(); String line;
        while((line=br.readLine())!=null) sb.append(line);
        br.close(); c.disconnect();
        return new JSONObject(sb.toString());
    }

    private void loadToday() {
        list.removeAllViews(); progress.setVisibility(View.VISIBLE);
        LocalDate day=LocalDate.now();
        status.setText("Матчи на "+day.format(DateTimeFormatter.ofPattern("dd.MM.yyyy")));
        pool.execute(()->{
            try {
                JSONObject j=getJson("/sport/football/scheduled-events/"+day);
                JSONArray ev=j.optJSONArray("events");
                List<JSONObject> matches=new ArrayList<>();
                if(ev!=null) for(int i=0;i<ev.length();i++) matches.add(ev.getJSONObject(i));
                runOnUiThread(()->showMatches(matches));
            } catch(Exception e) {
                runOnUiThread(()->{
                    progress.setVisibility(View.GONE);
                    status.setText("Ошибка загрузки: "+e.getMessage());
                    Toast.makeText(this,"Не удалось получить матчи",Toast.LENGTH_LONG).show();
                });
            }
        });
    }

    private void showMatches(List<JSONObject> matches) {
        progress.setVisibility(View.GONE);
        status.setText(status.getText()+" · найдено: "+matches.size());
        if(matches.isEmpty()) {
            TextView t=text("На сегодня матчи не найдены.",15,Color.LTGRAY); t.setPadding(dp(10),dp(20),dp(10),dp(20)); list.addView(t); return;
        }
        for(JSONObject e:matches) addMatch(e);
    }

    private void addMatch(JSONObject e) {
        JSONObject home=e.optJSONObject("homeTeam"), away=e.optJSONObject("awayTeam"), tourn=e.optJSONObject("tournament");
        if(home==null||away==null) return;
        LinearLayout card=new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(13),dp(11),dp(13),dp(12));
        card.setBackgroundColor(Color.rgb(17,24,39));
        LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,LinearLayout.LayoutParams.WRAP_CONTENT);
        cp.setMargins(0,0,0,dp(9));

        String league=tourn!=null?tourn.optString("name",""):"";
        TextView l=text(league,11,Color.rgb(147,164,184));
        TextView teams=text(home.optString("name")+" — "+away.optString("name"),16,Color.WHITE); teams.setTypeface(null,1);
        long ts=e.optLong("startTimestamp",0);
        String tm=ts>0?DateTimeFormatter.ofPattern("HH:mm").withLocale(Locale.getDefault()).withZone(ZoneId.systemDefault()).format(Instant.ofEpochSecond(ts)):"";
        String st=e.optJSONObject("status")!=null?e.optJSONObject("status").optString("type",""):"";
        TextView time=text(tm+"  "+st,12,Color.rgb(156,163,175));
        Button calc=new Button(this); calc.setText("Рассчитать тоталы");
        calc.setOnClickListener(v->predict(e,calc));
        card.addView(l); card.addView(teams); card.addView(time); card.addView(calc);
        list.addView(card,cp);
    }

    private void predict(JSONObject e, Button button) {
        JSONObject home=e.optJSONObject("homeTeam"), away=e.optJSONObject("awayTeam");
        int hid=home.optInt("id"), aid=away.optInt("id");
        if(hid==0||aid==0) return;
        button.setEnabled(false); button.setText("Расчёт…");
        pool.execute(()->{
            try {
                JSONArray he=getJson("/team/"+hid+"/events/last/0").optJSONArray("events");
                JSONArray ae=getJson("/team/"+aid+"/events/last/0").optJSONArray("events");
                Features hf=features(he,hid), af=features(ae,aid);
                String report=makeReport(home.optString("name"),away.optString("name"),hf,af);
                runOnUiThread(()->{
                    button.setEnabled(true); button.setText("Рассчитать заново");
                    new AlertDialog.Builder(this).setTitle(home.optString("name")+" — "+away.optString("name")).setMessage(report).setPositiveButton("Закрыть",null).show();
                });
            } catch(Exception ex) {
                runOnUiThread(()->{
                    button.setEnabled(true); button.setText("Повторить расчёт");
                    new AlertDialog.Builder(this).setTitle("Ошибка").setMessage(ex.getMessage()+"\n\nПовтори через несколько секунд.").setPositiveButton("ОК",null).show();
                });
            }
        });
    }

    private Features features(JSONArray a,int teamId) {
        Features f=new Features();
        List<Double> gf=new ArrayList<>(),ga=new ArrayList<>(),tot=new ArrayList<>(),h1=new ArrayList<>();
        if(a==null) return f;
        for(int i=0;i<a.length() && f.n<12;i++) {
            JSONObject e=a.optJSONObject(i); if(e==null) continue;
            JSONObject stat=e.optJSONObject("status"); if(stat==null||!"finished".equals(stat.optString("type"))) continue;
            JSONObject hs=e.optJSONObject("homeScore"), as=e.optJSONObject("awayScore"), ht=e.optJSONObject("homeTeam");
            if(hs==null||as==null||ht==null||!hs.has("current")||!as.has("current")) continue;
            boolean isHome=ht.optInt("id")==teamId;
            double h=hs.optDouble("current",0), aw=as.optDouble("current",0);
            gf.add(isHome?h:aw); ga.add(isHome?aw:h); tot.add(h+aw);
            if(hs.has("period1")&&as.has("period1")) h1.add(hs.optDouble("period1",0)+as.optDouble("period1",0));
            f.n++;
        }
        f.gf=wmean(gf); f.ga=wmean(ga); f.total=wmean(tot); f.h1=wmean(h1);
        return f;
    }

    private double wmean(List<Double> v) {
        if(v.isEmpty()) return 0;
        double num=0,den=0;
        for(int i=0;i<v.size();i++){double w=Math.pow(0.88,i);num+=v.get(i)*w;den+=w;}
        return num/den;
    }

    private int pct(double p){return (int)Math.round(Math.max(0,Math.min(1,p))*100);}
    private double poisCdf(int k,double lam){double s=0;for(int i=0;i<=k;i++)s+=Math.exp(-lam)*Math.pow(lam,i)/fact(i);return s;}
    private double fact(int n){double x=1;for(int i=2;i<=n;i++)x*=i;return x;}
    private int over(double line,double lam){return pct(1-poisCdf((int)Math.floor(line),lam));}

    private Pick best(String prefix,double[] lines,double lam){
        Pick b=new Pick("",-1);
        for(double line:lines){int o=over(line,lam),u=100-o;if(o>b.prob)b=new Pick(prefix+": ТБ "+line+" ("+o+"%)",o);if(u>b.prob)b=new Pick(prefix+": ТМ "+line+" ("+u+"%)",u);}return b;
    }

    private String makeReport(String hn,String an,Features h,Features a) {
        double attack=(h.gf+a.ga+a.gf+h.ga)/2.0;
        double env=(h.total+a.total)/2.0;
        double lm=Math.max(0.35,Math.min(5.0,0.70*attack+0.30*env));
        double raw=(h.h1>0&&a.h1>0)?(h.h1+a.h1)/2.0:(h.h1>0?h.h1:(a.h1>0?a.h1:lm*0.45));
        double lh=Math.max(0.15,Math.min(2.6,0.75*raw+0.25*lm*0.45));
        int h05=over(0.5,lh),h15=over(1.5,lh);
        int m15=over(1.5,lm),m25=over(2.5,lm),m35=over(3.5,lm);
        Pick bh=best("1-й тайм",new double[]{0.5,1.5},lh), bm=best("Матч",new double[]{1.5,2.5,3.5},lm);
        return "НАИБОЛЕЕ ВЕРОЯТНО ПО МОДЕЛИ\n"+bh.label+"\n"+bm.label+"\n\n"+
                "1-Й ТАЙМ\n"+
                "ТБ 0.5 ("+h05+"%)    ТМ 0.5 ("+(100-h05)+"%)\n"+
                "ТБ 1.5 ("+h15+"%)    ТМ 1.5 ("+(100-h15)+"%)\n\n"+
                "ВЕСЬ МАТЧ\n"+
                "ТБ 1.5 ("+m15+"%)    ТМ 1.5 ("+(100-m15)+"%)\n"+
                "ТБ 2.5 ("+m25+"%)    ТМ 2.5 ("+(100-m25)+"%)\n"+
                "ТБ 3.5 ("+m35+"%)    ТМ 3.5 ("+(100-m35)+"%)\n\n"+
                "Ожидаемые голы: 1Т "+String.format(Locale.US,"%.2f",lh)+", матч "+String.format(Locale.US,"%.2f",lm)+"\n"+
                "Выборка: "+h.n+" + "+a.n+" последних завершённых матчей.\n\n"+
                "Проценты — статистическая оценка, а не гарантия результата.";
    }

    @Override
    protected void onDestroy(){super.onDestroy();pool.shutdownNow();}
}
