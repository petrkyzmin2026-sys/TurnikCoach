package ru.turnikcoach.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.text.InputType;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.List;

public class MainActivity extends Activity {
    private static final int BG = Color.rgb(16,17,20);
    private static final int CARD = Color.rgb(31,33,39);
    private static final int TEXT = Color.rgb(245,246,248);
    private static final int MUTED = Color.rgb(173,178,189);
    private static final int ACCENT = Color.rgb(255,216,77);
    private AppPrefs prefs;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        prefs = new AppPrefs(this);
        if (!prefs.hasProfile()) showSetup(); else showHome();
    }

    private void showSetup() {
        LinearLayout box = base();
        box.addView(title("ТУРНИК ТРЕНЕР"));
        box.addView(text("Первичная калибровка. Укажи максимум строгих подтягиваний."));
        EditText max = input("Максимум подтягиваний", true);
        EditText weight = input("Масса тела, кг (необязательно)", false);
        EditText target = input("Цель по подтягиваниям", true); target.setText("20");
        box.addView(max); box.addView(weight); box.addView(target);
        Button save = primary("Сформировать программу");
        save.setOnClickListener(v -> {
            int m = parseInt(max.getText().toString(),0);
            double bw = parseDouble(weight.getText().toString(),0);
            int tr = Math.max(1,parseInt(target.getText().toString(),20));
            Profile p = new Profile(m,3,WorkoutEngine.GOAL_REPS,true,false,bw,tr,0,0,0,0,true,true,0);
            prefs.saveProfile(p);
            prefs.updateMax(m);
            showHome();
        });
        box.addView(save, lp(16));
    }

    private void showHome() {
        LinearLayout box = base();
        Profile p = prefs.loadProfile();
        List<SessionRecord> history = prefs.history();
        Workout w = WorkoutEngine.workoutForIndex(p, history.size());
        box.addView(over("ПЕРСОНАЛЬНЫЙ ПЛАН"));
        box.addView(title("Турник Тренер"));
        box.addView(text(WorkoutEngine.levelName(p.maxPullUps)));
        box.addView(card("Максимум", String.valueOf(p.maxPullUps)));
        box.addView(card("Цель", WorkoutEngine.targetProgress(p)));
        box.addView(card("Цикл", WorkoutEngine.blockLabel(p,history.size()) + "\n" + WorkoutEngine.blockInstruction(p,history.size())));
        box.addView(section(w.title));
        box.addView(text(w.focus));
        renderWorkout(box,w);
        Button done = primary("Завершить тренировку");
        done.setOnClickListener(v -> complete(w,false));
        box.addView(done,lp(14));
        Button light = secondary("Лёгкий режим · −30% объёма");
        light.setOnClickListener(v -> showLight());
        box.addView(light,lp(8));
        Button test = secondary("Записать контрольный максимум");
        test.setOnClickListener(v -> showMaxDialog());
        box.addView(test,lp(8));
        Button profile = secondary("Изменить цель / профиль");
        profile.setOnClickListener(v -> showProfile());
        box.addView(profile,lp(8));
        if (!history.isEmpty()) {
            box.addView(section("Статистика"));
            box.addView(card("Тренировок", String.valueOf(history.size())));
            box.addView(card("Объём подтягиваний", String.valueOf(TrainingStats.totalPullUps(history))));
            box.addView(card("Серия недель", String.valueOf(TrainingStats.activeWeekStreak(history))));
        }
    }

    private void showLight() {
        LinearLayout box = base();
        Profile p = prefs.loadProfile();
        Workout w = WorkoutEngine.lightVersion(WorkoutEngine.workoutForIndex(p,prefs.history().size()));
        box.addView(over("ЛЁГКИЙ РЕЖИМ"));
        box.addView(title(w.title));
        box.addView(text(w.focus));
        renderWorkout(box,w);
        Button done = primary("Завершить лёгкую тренировку");
        done.setOnClickListener(v -> complete(w,true)); box.addView(done,lp(14));
        Button back = secondary("Назад"); back.setOnClickListener(v -> showHome()); box.addView(back,lp(8));
    }

    private void renderWorkout(LinearLayout box, Workout w) {
        int i=1;
        for (Exercise e : w.exercises) {
            LinearLayout c = new LinearLayout(this); c.setOrientation(LinearLayout.VERTICAL); c.setPadding(dp(14),dp(12),dp(14),dp(12)); c.setBackgroundColor(CARD);
            c.addView(over(String.format("%02d",i++)));
            c.addView(strong(e.name));
            c.addView(accent(e.prescription + " · отдых " + e.rest));
            c.addView(text(e.cue));
            box.addView(c,lp(8));
        }
    }

    private void complete(Workout w, boolean light) {
        SessionRecord r = new SessionRecord();
        r.timestamp = System.currentTimeMillis();
        r.durationSec = 0;
        r.workoutTitle = w.title;
        r.focus = w.focus;
        r.note = "";
        r.exerciseSummary = "Выполнено по плану";
        r.readiness = 3;
        r.quality = 2;
        r.rpe = light ? 6 : 7;
        r.lightMode = light;
        int reps=0,sets=0;
        for (Exercise e : w.exercises) {
            if (e.targetSets>0) sets += e.targetSets;
            if (e.pullUpMain && e.targetSets>0 && e.targetReps>0) reps += e.targetSets*e.targetReps;
        }
        r.pullUpReps = reps; r.totalSets = sets;
        prefs.completeWorkout(r);
        Toast.makeText(this,"Тренировка сохранена",Toast.LENGTH_SHORT).show();
        showHome();
    }

    private void showMaxDialog() {
        EditText e = input("Новый максимум",true);
        e.setText(String.valueOf(prefs.loadProfile().maxPullUps));
        new AlertDialog.Builder(this).setTitle("Контрольный максимум").setView(e)
                .setPositiveButton("Сохранить",(d,w)->{ prefs.updateMax(Math.max(0,parseInt(e.getText().toString(),0))); showHome(); })
                .setNegativeButton("Отмена",null).show();
    }

    private void showProfile() {
        Profile p = prefs.loadProfile();
        LinearLayout form = new LinearLayout(this); form.setOrientation(LinearLayout.VERTICAL); form.setPadding(dp(20),dp(10),dp(20),0);
        EditText max=input("Максимум",true); max.setText(String.valueOf(p.maxPullUps)); form.addView(max);
        EditText target=input("Цель по повторениям",true); target.setText(String.valueOf(p.targetReps)); form.addView(target);
        String[] goals={WorkoutEngine.GOAL_FIRST,WorkoutEngine.GOAL_REPS,WorkoutEngine.GOAL_STRENGTH,WorkoutEngine.GOAL_MUSCLEUP,WorkoutEngine.GOAL_ONE_ARM};
        new AlertDialog.Builder(this).setTitle("Профиль").setView(form)
                .setSingleChoiceItems(goals,indexOf(goals,p.goal),(dialog,which)-> p.goal = goals[which])
                .setPositiveButton("Сохранить",(d,w)->{
                    int m=Math.max(0,parseInt(max.getText().toString(),p.maxPullUps));
                    p.maxPullUps=m;
                    p.targetReps=Math.max(1,parseInt(target.getText().toString(),p.targetReps));
                    prefs.saveProfile(p);
                    prefs.updateMax(m);
                    showHome();
                }).setNegativeButton("Отмена",null).show();
    }

    private int indexOf(String[] a,String s){ for(int i=0;i<a.length;i++) if(a[i].equals(s)) return i; return 1; }

    private LinearLayout base() {
        LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(BG);
        ScrollView sc=new ScrollView(this); LinearLayout box=new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setPadding(dp(18),dp(22),dp(18),dp(30)); sc.addView(box); root.addView(sc,new LinearLayout.LayoutParams(-1,-1)); setContentView(root); return box;
    }
    private LinearLayout card(String h,String b){ LinearLayout c=new LinearLayout(this); c.setOrientation(LinearLayout.VERTICAL); c.setPadding(dp(14),dp(12),dp(14),dp(12)); c.setBackgroundColor(CARD); c.addView(over(h.toUpperCase())); c.addView(strong(b)); return c; }
    private TextView title(String s){ TextView t=tv(s,28,TEXT); t.setTypeface(Typeface.DEFAULT,Typeface.BOLD); t.setPadding(0,dp(4),0,dp(8)); return t; }
    private TextView section(String s){ TextView t=tv(s,20,TEXT); t.setTypeface(Typeface.DEFAULT,Typeface.BOLD); t.setPadding(0,dp(22),0,dp(8)); return t; }
    private TextView strong(String s){ TextView t=tv(s,17,TEXT); t.setTypeface(Typeface.DEFAULT,Typeface.BOLD); return t; }
    private TextView over(String s){ TextView t=tv(s,11,MUTED); t.setTypeface(Typeface.DEFAULT,Typeface.BOLD); return t; }
    private TextView text(String s){ TextView t=tv(s,14,MUTED); t.setPadding(0,dp(4),0,dp(4)); return t; }
    private TextView accent(String s){ TextView t=tv(s,14,ACCENT); t.setTypeface(Typeface.DEFAULT,Typeface.BOLD); return t; }
    private TextView tv(String s,int sp,int color){ TextView t=new TextView(this); t.setText(s); t.setTextSize(sp); t.setTextColor(color); return t; }
    private EditText input(String hint,boolean integer){ EditText e=new EditText(this); e.setHint(hint); e.setHintTextColor(MUTED); e.setTextColor(TEXT); e.setBackgroundColor(CARD); e.setPadding(dp(12),dp(12),dp(12),dp(12)); e.setInputType(integer?InputType.TYPE_CLASS_NUMBER:(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL)); return e; }
    private Button primary(String s){ Button b=new Button(this); b.setText(s); b.setAllCaps(false); b.setTextColor(BG); b.setBackgroundColor(ACCENT); return b; }
    private Button secondary(String s){ Button b=new Button(this); b.setText(s); b.setAllCaps(false); b.setTextColor(TEXT); b.setBackgroundColor(CARD); return b; }
    private LinearLayout.LayoutParams lp(int top){ LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,ViewGroup.LayoutParams.WRAP_CONTENT); p.topMargin=dp(top); return p; }
    private int dp(int v){ return Math.round(v*getResources().getDisplayMetrics().density); }
    private int parseInt(String s,int f){ try{return Integer.parseInt(s.trim());}catch(Exception e){return f;} }
    private double parseDouble(String s,double f){ try{return Double.parseDouble(s.trim().replace(',','.'));}catch(Exception e){return f;} }
}
