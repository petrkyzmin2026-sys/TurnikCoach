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
import java.util.Iterator;
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
    private boolean liveMode=false;

    static class Features { int n; double gf,ga,total,h1; }
    static class Pick { String label; int prob; Pick(String l,int p){label=l;prob=p;} }

    @Override protected void onCreate(Bundle b){super.onCreate(b);buildUi();loadToday();}
    private int dp(int v){return (int)(v*getResources().getDisplayMetrics().density+0.5f);}
    private TextView text(String s,float sp,int c){TextView t=new TextView(this);t.setText(s);t.setTextSize(sp);t.setTextColor(c);return t;}

    private void buildUi(){
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.rgb(11,18,32));
        LinearLayout top=new LinearLayout(this);top.setOrientation(LinearLayout.VERTICAL);top.setPadding(dp(14),dp(10),dp(10),dp(8));top.setBackgroundColor(Color.rgb(17,24,39));
        TextView title=text("Football Totals",20,Color.WHITE);title.setTypeface(null,1);top.addView(title);
        top.addView(text("Модель тоталов · линия · LIVE",11,Color.rgb(156,163,175)));
        LinearLayout nav=new LinearLayout(this);nav.setOrientation(LinearLayout.HORIZONTAL);nav.setGravity(Gravity.CENTER_VERTICAL);
        Button prematch=new Button(this);prematch.setText("ЛИНИЯ");prematch.setOnClickListener(v->{liveMode=false;loadToday();});
        Button live=new Button(this);live.setText("LIVE");live.setOnClickListener(v->{liveMode=true;loadLive();});
        Button refresh=new Button(this);refresh.setText("↻");refresh.setOnClickListener(v->{if(liveMode)loadLive();else loadToday();});
        nav.addView(prematch,new LinearLayout.LayoutParams(0,LinearLayout.LayoutParams.WRAP_CONTENT,1));
        nav.addView(live,new LinearLayout.LayoutParams(0,LinearLayout.LayoutParams.WRAP_CONTENT,1));
        nav.addView(refresh);top.addView(nav);root.addView(top);
        status=text("",12,Color.rgb(156,163,175));status.setPadding(dp(14),dp(8),dp(14),dp(4));root.addView(status);
        progress=new ProgressBar(this);progress.setVisibility(View.GONE);LinearLayout.LayoutParams pp=new LinearLayout.LayoutParams(dp(38),dp(38));pp.gravity=Gravity.CENTER_HORIZONTAL;root.addView(progress,pp);
        ScrollView scroll=new ScrollView(this);list=new LinearLayout(this);list.setOrientation(LinearLayout.VERTICAL);list.setPadding(dp(10),dp(8),dp(10),dp(20));scroll.addView(list);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);
    }

    private JSONObject getJson(String path)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(BASE+path).openConnection();c.setConnectTimeout(15000);c.setReadTimeout(25000);c.setRequestProperty("User-Agent",UA);c.setRequestProperty("Accept","application/json,text/plain,*/*");c.setRequestProperty("Referer","https://www.sofascore.com/");
        int code=c.getResponseCode();if(code!=200)throw new Exception("Источник статистики: HTTP "+code);
        BufferedReader br=new BufferedReader(new InputStreamReader(c.getInputStream()));StringBuilder sb=new StringBuilder();String line;while((line=br.readLine())!=null)sb.append(line);br.close();c.disconnect();return new JSONObject(sb.toString());
    }

    private void loadToday(){
        list.removeAllViews();progress.setVisibility(View.VISIBLE);LocalDate d=LocalDate.now();status.setText("ЛИНИЯ · "+d.format(DateTimeFormatter.ofPattern("dd.MM.yyyy")));
        pool.execute(()->{try{JSONObject j=getJson("/sport/football/scheduled-events/"+d);showAsync(j.optJSONArray("events"));}catch(Exception e){fail(e);}});
    }
    private void loadLive(){
        list.removeAllViews();progress.setVisibility(View.VISIBLE);status.setText("LIVE · текущие матчи");
        pool.execute(()->{try{JSONObject j=getJson("/sport/football/events/live");showAsync(j.optJSONArray("events"));}catch(Exception e){fail(e);}});
    }
    private void showAsync(JSONArray a){List<JSONObject> m=new ArrayList<>();if(a!=null)for(int i=0;i<a.length();i++)m.add(a.optJSONObject(i));runOnUiThread(()->showMatches(m));}
    private void fail(Exception e){runOnUiThread(()->{progress.setVisibility(View.GONE);status.setText("Ошибка: "+e.getMessage());Toast.makeText(this,"Не удалось получить матчи",Toast.LENGTH_LONG).show();});}

    private void showMatches(List<JSONObject> m){progress.setVisibility(View.GONE);status.setText(status.getText()+" · "+m.size());if(m.isEmpty()){TextView t=text("Матчей нет.",15,Color.LTGRAY);t.setPadding(dp(10),dp(20),dp(10),dp(20));list.addView(t);return;}for(JSONObject e:m)if(e!=null)addMatch(e);}

    private void addMatch(JSONObject e){
        JSONObject h=e.optJSONObject("homeTeam"),a=e.optJSONObject("awayTeam"),tr=e.optJSONObject("tournament");if(h==null||a==null)return;
        LinearLayout card=new LinearLayout(this);card.setOrientation(LinearLayout.VERTICAL);card.setPadding(dp(13),dp(11),dp(13),dp(12));card.setBackgroundColor(Color.rgb(17,24,39));LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.setMargins(0,0,0,dp(9));
        card.addView(text(tr!=null?tr.optString("name",""):"",11,Color.rgb(147,164,184)));
        TextView teams=text(h.optString("name")+" — "+a.optString("name"),16,Color.WHITE);teams.setTypeface(null,1);card.addView(teams);
        long ts=e.optLong("startTimestamp",0);String tm=ts>0?DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.systemDefault()).format(Instant.ofEpochSecond(ts)):"";
        JSONObject hs=e.optJSONObject("homeScore"),as=e.optJSONObject("awayScore"),st=e.optJSONObject("status");String state=st!=null?st.optString("type",""):"";
        String score="";if(hs!=null&&as!=null&&hs.has("current")&&as.has("current"))score="  "+hs.optInt("current")+":"+as.optInt("current");
        TextView meta=text((liveMode?"LIVE ":tm+"  ")+state+score,12,liveMode?Color.rgb(74,222,128):Color.rgb(156,163,175));card.addView(meta);
        LinearLayout buttons=new LinearLayout(this);buttons.setOrientation(LinearLayout.HORIZONTAL);
        Button calc=new Button(this);calc.setText(liveMode?"LIVE модель":"Модель");calc.setOnClickListener(v->predict(e,calc));
        Button odds=new Button(this);odds.setText("Линия");odds.setOnClickListener(v->showOdds(e,odds));
        buttons.addView(calc,new LinearLayout.LayoutParams(0,-2,1));buttons.addView(odds,new LinearLayout.LayoutParams(0,-2,1));card.addView(buttons);list.addView(card,cp);
    }

    private void showOdds(JSONObject e,Button b){
        int id=e.optInt("id");if(id==0)return;b.setEnabled(false);b.setText("Загрузка…");pool.execute(()->{try{JSONObject o=getJson("/event/"+id+"/odds/1/all");String s=extractTotals(o);runOnUiThread(()->{b.setEnabled(true);b.setText("Линия");new AlertDialog.Builder(this).setTitle("Букмекерская линия тоталов").setMessage(s).setPositiveButton("Закрыть",null).show();});}catch(Exception x){runOnUiThread(()->{b.setEnabled(true);b.setText("Линия");new AlertDialog.Builder(this).setTitle("Линия недоступна").setMessage("Источник не отдал коэффициенты для этого матча.\n"+x.getMessage()).setPositiveButton("ОК",null).show();});}});
    }

    private String extractTotals(JSONObject root){StringBuilder out=new StringBuilder();scanTotals(root,out,0);return out.length()==0?"Тоталы для данного матча в источнике отсутствуют.":out.toString();}
    private void scanTotals(Object node,StringBuilder out,int depth){
        if(depth>8||node==null)return;
        if(node instanceof JSONObject){JSONObject o=(JSONObject)node;String n=(o.optString("marketName",o.optString("name",o.optString("title","")))).toLowerCase(Locale.ROOT);boolean total=n.contains("total")||n.contains("over/under")||n.contains("goals");
            JSONArray ch=o.optJSONArray("choices");if(total&&ch!=null){if(out.length()>0)out.append("\n");out.append(o.optString("marketName",o.optString("name","Тотал"))).append("\n");for(int i=0;i<ch.length();i++){JSONObject c=ch.optJSONObject(i);if(c==null)continue;String cn=c.optString("name",c.optString("choiceName",""));String val=c.has("decimalValue")?c.optString("decimalValue"):c.optString("fractionalValue","");out.append(cn);if(!val.isEmpty())out.append("  ").append(val);out.append("\n");}}
            Iterator<String> it=o.keys();while(it.hasNext()){String k=it.next();Object v=o.opt(k);if(v instanceof JSONObject||v instanceof JSONArray)scanTotals(v,out,depth+1);}}
        else if(node instanceof JSONArray){JSONArray a=(JSONArray)node;for(int i=0;i<a.length();i++)scanTotals(a.opt(i),out,depth+1);}
    }

    private void predict(JSONObject e,Button b){
        JSONObject h=e.optJSONObject("homeTeam"),a=e.optJSONObject("awayTeam");int hid=h.optInt("id"),aid=a.optInt("id");if(hid==0||aid==0)return;b.setEnabled(false);b.setText("Расчёт…");
        pool.execute(()->{try{JSONArray he=getJson("/team/"+hid+"/events/last/0").optJSONArray("events"),ae=getJson("/team/"+aid+"/events/last/0").optJSONArray("events");Features hf=features(he,hid),af=features(ae,aid);JSONObject current=e;if(liveMode&&e.optInt("id")>0){try{current=getJson("/event/"+e.optInt("id")).optJSONObject("event");}catch(Exception ignored){}}String report=makeReport(hf,af,current);runOnUiThread(()->{b.setEnabled(true);b.setText(liveMode?"LIVE модель":"Модель");new AlertDialog.Builder(this).setTitle(h.optString("name")+" — "+a.optString("name")).setMessage(report).setPositiveButton("Закрыть",null).show();});}catch(Exception x){runOnUiThread(()->{b.setEnabled(true);b.setText("Повторить");new AlertDialog.Builder(this).setTitle("Ошибка").setMessage(x.getMessage()).setPositiveButton("ОК",null).show();});}});
    }

    private Features features(JSONArray a,int id){Features f=new Features();List<Double> gf=new ArrayList<>(),ga=new ArrayList<>(),tot=new ArrayList<>(),h1=new ArrayList<>();if(a==null)return f;for(int i=0;i<a.length()&&f.n<12;i++){JSONObject e=a.optJSONObject(i);if(e==null)continue;JSONObject st=e.optJSONObject("status");if(st==null||!"finished".equals(st.optString("type")))continue;JSONObject hs=e.optJSONObject("homeScore"),as=e.optJSONObject("awayScore"),ht=e.optJSONObject("homeTeam");if(hs==null||as==null||ht==null||!hs.has("current")||!as.has("current"))continue;boolean home=ht.optInt("id")==id;double x=hs.optDouble("current"),y=as.optDouble("current");gf.add(home?x:y);ga.add(home?y:x);tot.add(x+y);if(hs.has("period1")&&as.has("period1"))h1.add(hs.optDouble("period1")+as.optDouble("period1"));f.n++;}f.gf=wmean(gf);f.ga=wmean(ga);f.total=wmean(tot);f.h1=wmean(h1);return f;}
    private double wmean(List<Double> v){if(v.isEmpty())return 0;double n=0,d=0;for(int i=0;i<v.size();i++){double w=Math.pow(0.88,i);n+=v.get(i)*w;d+=w;}return n/d;}
    private int pct(double p){return(int)Math.round(Math.max(0,Math.min(1,p))*100);}private double fact(int n){double x=1;for(int i=2;i<=n;i++)x*=i;return x;}private double cdf(int k,double l){double s=0;for(int i=0;i<=k;i++)s+=Math.exp(-l)*Math.pow(l,i)/fact(i);return s;}private int over(double line,double l){return pct(1-cdf((int)Math.floor(line),l));}
    private Pick best(String p,double[] lines,double l){Pick b=new Pick("",-1);for(double x:lines){int o=over(x,l),u=100-o;if(o>b.prob)b=new Pick(p+": ТБ "+x+" ("+o+"%)",o);if(u>b.prob)b=new Pick(p+": ТМ "+x+" ("+u+"%)",u);}return b;}

    private String makeReport(Features h,Features a,JSONObject current){
        double attack=(h.gf+a.ga+a.gf+h.ga)/2.0,env=(h.total+a.total)/2.0,lm=Math.max(0.35,Math.min(5,0.70*attack+0.30*env));double raw=(h.h1>0&&a.h1>0)?(h.h1+a.h1)/2:(h.h1>0?h.h1:(a.h1>0?a.h1:lm*0.45));double lh=Math.max(0.15,Math.min(2.6,0.75*raw+0.25*lm*0.45));
        int h05=over(0.5,lh),h15=over(1.5,lh),m15=over(1.5,lm),m25=over(2.5,lm),m35=over(3.5,lm);
        int cur=0,curH1=-1;String live="";if(current!=null){JSONObject hs=current.optJSONObject("homeScore"),as=current.optJSONObject("awayScore");if(hs!=null&&as!=null&&hs.has("current")&&as.has("current")){cur=hs.optInt("current")+as.optInt("current");live="LIVE счёт: "+hs.optInt("current")+":"+as.optInt("current")+"\n";}if(hs!=null&&as!=null&&hs.has("period1")&&as.has("period1"))curH1=hs.optInt("period1")+as.optInt("period1");}
        if(cur>=2)m15=100;if(cur>=3)m25=100;if(cur>=4)m35=100;if(curH1>=1)h05=100;if(curH1>=2)h15=100;
        Pick bh=best("1-й тайм",new double[]{0.5,1.5},lh),bm=best("Матч",new double[]{1.5,2.5,3.5},lm);
        return live+"НАИБОЛЕЕ ВЕРОЯТНО ПО МОДЕЛИ\n"+bh.label+"\n"+bm.label+"\n\n1-Й ТАЙМ\nТБ 0.5 ("+h05+"%)    ТМ 0.5 ("+(100-h05)+"%)\nТБ 1.5 ("+h15+"%)    ТМ 1.5 ("+(100-h15)+"%)\n\nВЕСЬ МАТЧ\nТБ 1.5 ("+m15+"%)    ТМ 1.5 ("+(100-m15)+"%)\nТБ 2.5 ("+m25+"%)    ТМ 2.5 ("+(100-m25)+"%)\nТБ 3.5 ("+m35+"%)    ТМ 3.5 ("+(100-m35)+"%)\n\nОжидаемые голы до матча: 1Т "+String.format(Locale.US,"%.2f",lh)+", матч "+String.format(Locale.US,"%.2f",lm)+"\nВыборка: "+h.n+" + "+a.n+" матчей.\n\nВ LIVE текущий счёт учитывается как уже состоявшееся событие; модель не является гарантией результата.";
    }
    @Override protected void onDestroy(){super.onDestroy();pool.shutdownNow();}
}
