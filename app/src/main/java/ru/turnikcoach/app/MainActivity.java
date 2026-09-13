package ru.turnikcoach.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends Activity {
    private static final int BG = Color.rgb(12,13,16);
    private static final int CARD = Color.rgb(27,29,35);
    private static final int CARD_2 = Color.rgb(35,38,46);
    private static final int TEXT = Color.rgb(247,248,250);
    private static final int MUTED = Color.rgb(151,157,171);
    private static final int ACCENT = Color.rgb(255,216,77);
    private static final int CYAN = Color.rgb(94,222,201);
    private static final int RED = Color.rgb(255,107,107);

    private AppPrefs prefs;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable clockTask;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        prefs = new AppPrefs(this);
        prefs.ensureProfile();
        showHome();
    }

    @Override protected void onDestroy() {
        stopClock();
        super.onDestroy();
    }

    private void showHome() {
        stopClock();
        LinearLayout box = shell("home");
        List<SessionRecord> h = prefs.history();

        box.addView(over("TURNIK COACH · FREE TRAINING"));
        box.addView(hero("Тренируйся, когда есть время", "Никакого обязательного расписания. Приложение фиксирует то, что ты реально сделал."));

        Button start = primary(prefs.hasDraft() ? "Продолжить тренировку" : "Начать тренировку");
        start.setOnClickListener(v -> { if (prefs.hasDraft()) showActiveWorkout(); else showWorkoutPicker(); });
        box.addView(start, lp(16));

        LinearLayout metrics = row();
        metrics.addView(metric("Тренировок", String.valueOf(h.size())), weightLp(1));
        metrics.addView(metric("В этом месяце", String.valueOf(TrainingStats.sessionsLastDays(h, 30))), weightLp(1));
        box.addView(metrics, lp(14));

        LinearLayout metrics2 = row();
        metrics2.addView(metric("Подходов", String.valueOf(TrainingStats.totalSets(h))), weightLp(1));
        metrics2.addView(metric("Времени", prettyMinutes(TrainingStats.totalMinutes(h))), weightLp(1));
        box.addView(metrics2, lp(8));

        box.addView(section("Объём за 30 дней"));
        LinearLayout chartCard = cardBox();
        SessionChartView chart = new SessionChartView(this);
        chart.setValues(TrainingStats.dailyReps(h, null, 30));
        chartCard.addView(chart, new LinearLayout.LayoutParams(-1, dp(200)));
        chartCard.addView(text("Сумма повторений по всем упражнениям. Упражнения на время считаются отдельно в истории."));
        box.addView(chartCard, lp(8));

        if (!h.isEmpty()) {
            SessionRecord last = h.get(0);
            box.addView(section("Последняя тренировка"));
            box.addView(sessionCard(last));
        }

        Button max = ghost("Записать контрольный максимум подтягиваний");
        max.setOnClickListener(v -> showMaxDialog());
        box.addView(max, lp(16));
    }

    private void showWorkoutPicker() {
        stopClock();
        LinearLayout box = shell("train");
        box.addView(over("НОВАЯ ТРЕНИРОВКА"));
        box.addView(title("Что делаешь сегодня?"));
        box.addView(text("Выбери хоть одно упражнение. Можно оставить только подтягивания — приложение ничего не добавит само."));

        Set<String> selected = new HashSet<>();
        selected.add("pullups");
        List<ExerciseDef> defs = prefs.exercises();
        for (ExerciseDef e : defs) {
            LinearLayout c = cardBox();
            CheckBox cb = new CheckBox(this);
            cb.setText(e.name);
            cb.setTextColor(TEXT);
            cb.setTextSize(17);
            cb.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
            cb.setButtonTintList(android.content.res.ColorStateList.valueOf(ACCENT));
            cb.setChecked(selected.contains(e.id));
            cb.setOnCheckedChangeListener((b, on) -> { if (on) selected.add(e.id); else selected.remove(e.id); });
            c.addView(cb);
            c.addView(text((ExerciseDef.TIME.equals(e.metric) ? "Время" : "Повторения") + " · отдых по умолчанию " + e.restSec + " с"));
            box.addView(c, lp(8));
        }

        Button add = ghost("+ Создать своё упражнение");
        add.setOnClickListener(v -> showAddExerciseDialog(this::showWorkoutPicker));
        box.addView(add, lp(12));

        Button go = primary("Старт");
        go.setOnClickListener(v -> {
            if (selected.isEmpty()) { toast("Выбери хотя бы одно упражнение"); return; }
            SessionRecord r = new SessionRecord();
            r.timestamp = System.currentTimeMillis();
            r.workoutTitle = selected.size() == 1 ? nameFor(selected.iterator().next()) : "Свободная тренировка";
            for (ExerciseDef e : prefs.exercises()) if (selected.contains(e.id)) r.exercises.add(new ExerciseLog(e.id, e.name, e.metric));
            prefs.saveDraft(r);
            showActiveWorkout();
        });
        box.addView(go, lp(18));
    }

    private void showActiveWorkout() {
        stopClock();
        SessionRecord r = prefs.loadDraft();
        if (r == null || r.timestamp <= 0) { prefs.clearDraft(); showHome(); return; }

        LinearLayout box = fullScreen();
        box.addView(over("ТРЕНИРОВКА ИДЁТ"));
        TextView clock = title("00:00");
        clock.setTextSize(36);
        clock.setTextColor(ACCENT);
        box.addView(clock);
        box.addView(text(formatTime(r.timestamp) + " · " + r.workoutTitle));
        startClock(clock, r.timestamp);

        for (ExerciseLog log : r.exercises) renderActiveExercise(box, r, log);

        Button addExercise = ghost("+ Добавить упражнение в текущую тренировку");
        addExercise.setOnClickListener(v -> chooseExerciseForDraft(r));
        box.addView(addExercise, lp(14));

        Button finish = primary("Завершить и сохранить");
        finish.setOnClickListener(v -> finishWorkout(r));
        box.addView(finish, lp(16));

        Button cancel = danger("Отменить тренировку");
        cancel.setOnClickListener(v -> new AlertDialog.Builder(this)
                .setTitle("Удалить текущую тренировку?")
                .setMessage("Все записанные в ней подходы будут удалены.")
                .setPositiveButton("Удалить", (d,w) -> { prefs.clearDraft(); showHome(); })
                .setNegativeButton("Оставить", null).show());
        box.addView(cancel, lp(8));
    }

    private void renderActiveExercise(LinearLayout box, SessionRecord session, ExerciseLog log) {
        LinearLayout c = cardBox();
        c.addView(over("УПРАЖНЕНИЕ"));
        c.addView(strong(log.exerciseName));

        if (log.sets.isEmpty()) c.addView(text("Подходов пока нет"));
        else {
            for (int i = 0; i < log.sets.size(); i++) {
                WorkoutSetRecord s = log.sets.get(i);
                String value = ExerciseDef.TIME.equals(log.metric) ? s.seconds + " сек" : s.reps + " повт.";
                if (s.addedWeightKg > 0) value += " · +" + trimDouble(s.addedWeightKg) + " кг";
                c.addView(setLine((i + 1) + "", value, formatTime(s.timestamp)));
            }
            c.addView(accent("Итого: " + summary(log)));
        }

        LinearLayout actions = row();
        Button plus = miniPrimary("+ Подход");
        plus.setOnClickListener(v -> addSetDialog(session, log));
        actions.addView(plus, weightLp(1));
        if (!log.sets.isEmpty()) {
            Button undo = miniGhost("↶ Последний");
            undo.setOnClickListener(v -> { log.sets.remove(log.sets.size() - 1); prefs.saveDraft(session); showActiveWorkout(); });
            actions.addView(undo, weightLp(1));
        }
        c.addView(actions, lp(12));

        ExerciseDef def = prefs.exercise(log.exerciseId);
        if (def != null) {
            Button technique = tiny("Техника");
            technique.setOnClickListener(v -> showTechnique(def, true));
            c.addView(technique, lp(8));
        }
        box.addView(c, lp(12));
    }

    private void addSetDialog(SessionRecord session, ExerciseLog log) {
        LinearLayout form = dialogForm();
        boolean timed = ExerciseDef.TIME.equals(log.metric);
        EditText value = input(timed ? "Секунды" : "Повторения", true);
        form.addView(label(timed ? "Длительность подхода" : "Повторения")); form.addView(value, lp(5));
        EditText weight = null;
        if (!timed) {
            weight = input("Доп. вес, кг — необязательно", false);
            form.addView(label("Дополнительный вес"), lp(12)); form.addView(weight, lp(5));
        }
        final EditText weightField = weight;
        new AlertDialog.Builder(this).setTitle(log.exerciseName).setView(form)
                .setPositiveButton("Записать", (d,w) -> {
                    int x = parseInt(value.getText().toString(), 0);
                    if (x <= 0) { toast("Подход не записан: значение должно быть больше нуля"); return; }
                    double kg = weightField == null ? 0 : Math.max(0, parseDouble(weightField.getText().toString(), 0));
                    log.sets.add(new WorkoutSetRecord(System.currentTimeMillis(), timed ? 0 : x, timed ? x : 0, kg));
                    prefs.saveDraft(session);
                    showActiveWorkout();
                }).setNegativeButton("Отмена", null).show();
    }

    private void chooseExerciseForDraft(SessionRecord session) {
        List<ExerciseDef> all = prefs.exercises();
        List<ExerciseDef> available = new ArrayList<>();
        outer: for (ExerciseDef e : all) {
            for (ExerciseLog l : session.exercises) if (e.id.equals(l.exerciseId)) continue outer;
            available.add(e);
        }
        if (available.isEmpty()) { toast("Все упражнения уже добавлены"); return; }
        String[] names = new String[available.size()]; for (int i=0;i<names.length;i++) names[i]=available.get(i).name;
        new AlertDialog.Builder(this).setTitle("Добавить упражнение").setItems(names,(d,which)->{
            ExerciseDef e=available.get(which); session.exercises.add(new ExerciseLog(e.id,e.name,e.metric)); prefs.saveDraft(session); showActiveWorkout();
        }).show();
    }

    private void finishWorkout(SessionRecord r) {
        int sets = r.totalRecordedSets();
        if (sets == 0) {
            new AlertDialog.Builder(this).setTitle("Нет подходов")
                    .setMessage("Сохранить тренировку без записанных подходов?")
                    .setPositiveButton("Сохранить", (d,w) -> finishWithNote(r))
                    .setNegativeButton("Продолжить", null).show();
        } else finishWithNote(r);
    }

    private void finishWithNote(SessionRecord r) {
        EditText note = inputText("Заметка о тренировке — необязательно");
        new AlertDialog.Builder(this).setTitle("Завершить тренировку").setView(note)
                .setPositiveButton("Сохранить", (d,w) -> {
                    r.endTimestamp = System.currentTimeMillis();
                    r.durationSec = Math.max(1, (r.endTimestamp - r.timestamp) / 1000L);
                    r.note = note.getText().toString().trim();
                    r.totalSets = r.totalRecordedSets();
                    r.pullUpReps = r.repsFor("pullups") + r.repsFor("weighted") + r.repsFor("chest");
                    prefs.completeWorkout(r);
                    stopClock();
                    toast("Тренировка сохранена");
                    showStats();
                }).setNegativeButton("Отмена", null).show();
    }

    private void showStats() {
        stopClock();
        LinearLayout box = shell("stats");
        List<SessionRecord> h = prefs.history();
        box.addView(over("АНАЛИТИКА")); box.addView(title("Твой фактический прогресс"));

        LinearLayout a=row(); a.addView(metric("Тренировок",String.valueOf(h.size())),weightLp(1)); a.addView(metric("Подходов",String.valueOf(TrainingStats.totalSets(h))),weightLp(1)); box.addView(a,lp(8));
        LinearLayout b=row(); b.addView(metric("Повторений",String.valueOf(TrainingStats.totalReps(h))),weightLp(1)); b.addView(metric("Времени",prettyMinutes(TrainingStats.totalMinutes(h))),weightLp(1)); box.addView(b,lp(8));

        box.addView(section("Повторения · 30 дней"));
        LinearLayout cc=cardBox(); SessionChartView chart=new SessionChartView(this); chart.setValues(TrainingStats.dailyReps(h,null,30)); cc.addView(chart,new LinearLayout.LayoutParams(-1,dp(200))); box.addView(cc);

        box.addView(section("По упражнениям"));
        boolean any=false;
        for(ExerciseDef e:prefs.exercises()){
            int reps=TrainingStats.repsFor(h,e.id); int best=TrainingStats.bestSetFor(h,e.id);
            if(reps==0 && best==0) continue;
            any=true; LinearLayout c=cardBox(); c.addView(strong(e.name)); c.addView(accent(reps+" повторений · лучший подход "+best));
            SessionChartView exChart=new SessionChartView(this); exChart.setValues(TrainingStats.dailyReps(h,e.id,30)); c.addView(exChart,new LinearLayout.LayoutParams(-1,dp(150))); box.addView(c,lp(8));
        }
        if(!any) box.addView(text("После первой тренировки здесь появится статистика по каждому упражнению."));

        box.addView(section("История"));
        if(h.isEmpty()) box.addView(text("История пока пустая."));
        else for(int i=0;i<Math.min(30,h.size());i++) box.addView(sessionCard(h.get(i)),lp(8));
    }

    private void showLibrary() {
        stopClock();
        LinearLayout box = shell("library");
        box.addView(over("БИБЛИОТЕКА")); box.addView(title("Упражнения"));
        box.addView(text("Встроенные упражнения содержат собственную микроанимацию. Для материалов Школы Воркаута используется только ссылка на первоисточник — видео не копируется в приложение."));
        Button add=primary("+ Своё упражнение"); add.setOnClickListener(v->showAddExerciseDialog(this::showLibrary)); box.addView(add,lp(12));

        for(ExerciseDef e:prefs.exercises()){
            LinearLayout c=cardBox(); c.addView(over(e.builtIn?"ВСТРОЕННОЕ":"МОЁ")); c.addView(strong(e.name));
            c.addView(text((ExerciseDef.TIME.equals(e.metric)?"Учёт времени":"Учёт повторений")+" · отдых "+e.restSec+" с"));
            LinearLayout acts=row(); Button tech=miniGhost("Техника"); tech.setOnClickListener(v->showTechnique(e,false)); acts.addView(tech,weightLp(1));
            if(!e.builtIn){ Button del=miniDanger("Удалить"); del.setOnClickListener(v->confirmDeleteExercise(e)); acts.addView(del,weightLp(1)); }
            c.addView(acts,lp(10)); box.addView(c,lp(10));
        }
    }

    private void showTechnique(ExerciseDef e, boolean returnToWorkout) {
        stopClock();
        LinearLayout box = returnToWorkout ? fullScreen() : shell("library");
        Button back=ghost("← Назад"); back.setOnClickListener(v->{ if(returnToWorkout) showActiveWorkout(); else showLibrary(); }); box.addView(back);
        box.addView(over("МИКРОДЕМОНСТРАЦИЯ"),lp(14)); box.addView(title(e.name));
        LinearLayout visual=cardBox(); TechniqueMotionView mv=new TechniqueMotionView(this); mv.setMotion(e.animation); visual.addView(mv,new LinearLayout.LayoutParams(-1,dp(220))); box.addView(visual,lp(8));
        box.addView(section("Ключевые ориентиры")); box.addView(cardText(techniqueText(e.animation)));
        if(!e.sourceUrl.isEmpty()){
            Button src=primary("Открыть первоисточник"); src.setOnClickListener(v->{ try{startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(e.sourceUrl)));}catch(Exception ex){toast("Не удалось открыть ссылку");} }); box.addView(src,lp(16));
            box.addView(text("Ссылка открывает оригинальный материал автора. В приложение не встраиваются копии или вырезки роликов."));
        }
    }

    private void showAddExerciseDialog(Runnable after) {
        LinearLayout form=dialogForm(); EditText name=inputText("Название, например: подтягивания узким хватом");
        CheckBox timed=new CheckBox(this); timed.setText("Считать по времени, а не по повторениям"); timed.setTextColor(TEXT);
        EditText rest=input("Отдых между подходами, сек",true); rest.setText("120");
        form.addView(label("Название")); form.addView(name,lp(5)); form.addView(timed,lp(12)); form.addView(label("Отдых"),lp(8)); form.addView(rest,lp(5));
        new AlertDialog.Builder(this).setTitle("Новое упражнение").setView(form)
                .setPositiveButton("Создать",(d,w)->{
                    String n=name.getText().toString().trim(); if(n.isEmpty()){toast("Название не задано");return;}
                    prefs.addCustomExercise(n,timed.isChecked()?ExerciseDef.TIME:ExerciseDef.REPS,parseInt(rest.getText().toString(),120)); after.run();
                }).setNegativeButton("Отмена",null).show();
    }

    private void confirmDeleteExercise(ExerciseDef e){
        new AlertDialog.Builder(this).setTitle("Удалить «"+e.name+"»?")
                .setMessage("Старые тренировки сохранят название и статистику. Упражнение исчезнет только из библиотеки.")
                .setPositiveButton("Удалить",(d,w)->{prefs.deleteCustomExercise(e.id);showLibrary();}).setNegativeButton("Отмена",null).show();
    }

    private void showMaxDialog(){
        EditText e=input("Максимум строгих подтягиваний",true); e.setText(String.valueOf(prefs.loadProfile().maxPullUps));
        new AlertDialog.Builder(this).setTitle("Контрольный максимум").setView(e).setPositiveButton("Сохранить",(d,w)->prefs.updateMax(Math.max(0,parseInt(e.getText().toString(),0)))).setNegativeButton("Отмена",null).show();
    }

    private LinearLayout sessionCard(SessionRecord r){
        LinearLayout c=cardBox(); String date=new SimpleDateFormat("d MMMM · HH:mm",new Locale("ru","RU")).format(r.timestamp);
        String end=r.endTimestamp>0?formatTime(r.endTimestamp):"—"; c.addView(over(date.toUpperCase())); c.addView(strong(r.workoutTitle));
        c.addView(accent(formatTime(r.timestamp)+"–"+end+" · "+prettyDuration(r.durationSec)));
        c.addView(text(r.totalRecordedSets()+" подходов · "+r.totalReps()+" повторений"));
        for(ExerciseLog e:r.exercises) c.addView(text("• "+e.exerciseName+": "+summary(e)));
        if(!r.note.isEmpty()) c.addView(text("“"+r.note+"”")); return c;
    }

    private LinearLayout shell(String active){
        LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(BG);
        ScrollView sc=new ScrollView(this); sc.setFillViewport(true); LinearLayout box=new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setPadding(dp(18),dp(24),dp(18),dp(28)); sc.addView(box); root.addView(sc,new LinearLayout.LayoutParams(-1,0,1));
        LinearLayout nav=new LinearLayout(this); nav.setOrientation(LinearLayout.HORIZONTAL); nav.setPadding(dp(8),dp(7),dp(8),dp(9)); nav.setBackgroundColor(Color.rgb(18,20,25));
        nav.addView(navButton("Сегодня",active.equals("home"),this::showHome),weightLp(1));
        nav.addView(navButton("Тренировка",active.equals("train"),()->{if(prefs.hasDraft())showActiveWorkout();else showWorkoutPicker();}),weightLp(1));
        nav.addView(navButton("Прогресс",active.equals("stats"),this::showStats),weightLp(1));
        nav.addView(navButton("Упражнения",active.equals("library"),this::showLibrary),weightLp(1));
        root.addView(nav,new LinearLayout.LayoutParams(-1,dp(66))); setContentView(root); return box;
    }

    private LinearLayout fullScreen(){
        LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(BG); ScrollView sc=new ScrollView(this);
        LinearLayout box=new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setPadding(dp(18),dp(24),dp(18),dp(36)); sc.addView(box); root.addView(sc,new LinearLayout.LayoutParams(-1,-1)); setContentView(root); return box;
    }

    private Button navButton(String s,boolean on,Runnable r){ Button b=new Button(this); b.setText(s); b.setAllCaps(false); b.setTextSize(11); b.setTextColor(on?ACCENT:MUTED); b.setBackgroundColor(Color.TRANSPARENT); b.setOnClickListener(v->r.run()); return b; }
    private LinearLayout hero(String h,String sub){ LinearLayout c=cardBox(); c.setPadding(dp(18),dp(18),dp(18),dp(18)); TextView t=tv(h,27,TEXT); t.setTypeface(Typeface.create("sans-serif-black",Typeface.NORMAL)); c.addView(t); c.addView(text(sub)); return c; }
    private LinearLayout metric(String h,String v){ LinearLayout c=cardBox(); c.setPadding(dp(12),dp(11),dp(12),dp(11)); c.addView(over(h.toUpperCase())); TextView n=tv(v,23,TEXT); n.setTypeface(Typeface.create("sans-serif-black",Typeface.NORMAL)); c.addView(n); return c; }
    private LinearLayout cardBox(){ LinearLayout c=new LinearLayout(this); c.setOrientation(LinearLayout.VERTICAL); c.setPadding(dp(14),dp(13),dp(14),dp(13)); c.setBackground(round(CARD,18,Color.TRANSPARENT)); return c; }
    private TextView cardText(String s){ TextView t=text(s); t.setBackground(round(CARD,18,Color.TRANSPARENT)); t.setPadding(dp(15),dp(14),dp(15),dp(14)); return t; }
    private LinearLayout row(){ LinearLayout r=new LinearLayout(this); r.setOrientation(LinearLayout.HORIZONTAL); r.setGravity(Gravity.CENTER_VERTICAL); return r; }
    private LinearLayout setLine(String n,String value,String time){ LinearLayout r=row(); TextView a=tv(n,12,BG); a.setGravity(Gravity.CENTER); a.setTypeface(Typeface.DEFAULT_BOLD); a.setBackground(round(ACCENT,14,Color.TRANSPARENT)); r.addView(a,new LinearLayout.LayoutParams(dp(29),dp(29))); TextView b=strong(value); LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(0,-2,1); bp.leftMargin=dp(10); r.addView(b,bp); r.addView(tv(time,12,MUTED)); r.setPadding(0,dp(5),0,dp(5)); return r; }

    private TextView title(String s){ TextView t=tv(s,29,TEXT); t.setTypeface(Typeface.create("sans-serif-black",Typeface.NORMAL)); t.setPadding(0,dp(4),0,dp(8)); return t; }
    private TextView section(String s){ TextView t=tv(s,19,TEXT); t.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL)); t.setPadding(0,dp(22),0,dp(7)); return t; }
    private TextView strong(String s){ TextView t=tv(s,17,TEXT); t.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL)); return t; }
    private TextView over(String s){ TextView t=tv(s,10,CYAN); t.setTypeface(Typeface.DEFAULT_BOLD); t.setLetterSpacing(.12f); return t; }
    private TextView text(String s){ TextView t=tv(s,14,MUTED); t.setLineSpacing(0,1.12f); t.setPadding(0,dp(4),0,dp(3)); return t; }
    private TextView accent(String s){ TextView t=tv(s,14,ACCENT); t.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL)); t.setPadding(0,dp(5),0,dp(3)); return t; }
    private TextView label(String s){ TextView t=tv(s,12,MUTED); t.setTypeface(Typeface.DEFAULT_BOLD); return t; }
    private TextView tv(String s,int sp,int color){ TextView t=new TextView(this); t.setText(s); t.setTextSize(sp); t.setTextColor(color); return t; }

    private Button primary(String s){ return styledButton(s,ACCENT,BG); }
    private Button ghost(String s){ return styledButton(s,CARD_2,TEXT); }
    private Button danger(String s){ return styledButton(s,Color.rgb(72,32,36),RED); }
    private Button miniPrimary(String s){ Button b=styledButton(s,ACCENT,BG); b.setTextSize(13); return b; }
    private Button miniGhost(String s){ Button b=styledButton(s,CARD_2,TEXT); b.setTextSize(13); return b; }
    private Button miniDanger(String s){ Button b=styledButton(s,Color.rgb(72,32,36),RED); b.setTextSize(13); return b; }
    private Button tiny(String s){ Button b=styledButton(s,Color.rgb(41,45,54),CYAN); b.setTextSize(12); return b; }
    private Button styledButton(String s,int bg,int fg){ Button b=new Button(this); b.setText(s); b.setAllCaps(false); b.setTextColor(fg); b.setTextSize(15); b.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL)); b.setBackground(round(bg,16,Color.TRANSPARENT)); b.setMinHeight(dp(50)); return b; }

    private EditText input(String hint,boolean integer){ EditText e=inputText(hint); e.setInputType(integer?InputType.TYPE_CLASS_NUMBER:(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL)); return e; }
    private EditText inputText(String hint){ EditText e=new EditText(this); e.setHint(hint); e.setHintTextColor(Color.rgb(103,109,121)); e.setTextColor(TEXT); e.setTextSize(15); e.setSingleLine(false); e.setPadding(dp(13),dp(12),dp(13),dp(12)); e.setBackground(round(CARD_2,14,Color.rgb(56,60,70))); return e; }
    private LinearLayout dialogForm(){ LinearLayout f=new LinearLayout(this); f.setOrientation(LinearLayout.VERTICAL); f.setPadding(dp(20),dp(10),dp(20),0); return f; }

    private GradientDrawable round(int color,int radius,int stroke){ GradientDrawable g=new GradientDrawable(); g.setColor(color); g.setCornerRadius(dp(radius)); if(stroke!=Color.TRANSPARENT)g.setStroke(dp(1),stroke); return g; }
    private LinearLayout.LayoutParams lp(int top){ LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2); p.topMargin=dp(top); return p; }
    private LinearLayout.LayoutParams weightLp(float w){ LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,-2,w); p.setMargins(dp(4),0,dp(4),0); return p; }

    private void startClock(TextView t,long start){ stopClock(); clockTask=new Runnable(){@Override public void run(){ long sec=Math.max(0,(System.currentTimeMillis()-start)/1000L); t.setText(String.format(Locale.US,"%02d:%02d:%02d",sec/3600,(sec%3600)/60,sec%60)); handler.postDelayed(this,1000); }}; handler.post(clockTask); }
    private void stopClock(){ if(clockTask!=null){handler.removeCallbacks(clockTask);clockTask=null;} }

    private String summary(ExerciseLog e){ if(ExerciseDef.TIME.equals(e.metric)) return e.sets.size()+" подх. · "+e.totalSeconds()+" сек"; return e.sets.size()+" подх. · "+e.totalReps()+" повт. · лучший "+e.bestReps(); }
    private String nameFor(String id){ ExerciseDef e=prefs.exercise(id); return e==null?"Свободная тренировка":e.name; }
    private String formatTime(long ms){ return ms<=0?"—":new SimpleDateFormat("HH:mm",Locale.getDefault()).format(ms); }
    private String prettyDuration(long sec){ return sec<60?sec+" сек":(sec/3600>0?(sec/3600)+" ч ":"")+((sec%3600)/60)+" мин"; }
    private String prettyMinutes(int min){ return min<60?min+" мин":(min/60)+" ч "+(min%60)+" мин"; }
    private String trimDouble(double x){ return Math.abs(x-Math.rint(x))<0.001?String.valueOf((int)Math.rint(x)):String.format(Locale.US,"%.1f",x); }
    private String techniqueText(String m){
        if("pullup".equals(m)) return "Стартуй из контролируемого виса. Перед тягой стабилизируй лопатки. Поднимайся без рывка и раскачки, сохраняй корпус собранным, затем полностью контролируй опускание.";
        if("hang".equals(m)) return "Не проваливай плечи бесконтрольно. Держи кисть закрытой вокруг перекладины, корпус собранным, дыхание спокойным. Прекрати подход при боли в плече или локте.";
        if("scapular".equals(m)) return "Руки остаются прямыми. Движение начинается лопатками: опусти плечи от ушей и слегка подними корпус, затем вернись в исходное положение без раскачки.";
        if("negative".equals(m)) return "Начни сверху с подбородком выше перекладины и опускайся медленно под контролем. Не падай в нижнюю точку и не теряй положение плеч.";
        if("highpull".equals(m)) return "Тяни перекладину ниже уровня подбородка, сохраняя мощное, но контролируемое движение. Не заменяй высоту чрезмерной раскачкой.";
        if("dip".equals(m)) return "Стабилизируй упор над перекладиной. Опускай корпус контролируемо, удерживая плечи и локти под контролем, затем вернись в устойчивый верхний упор.";
        return "Выполняй движение в контролируемой амплитуде. Записывай в приложение только фактически выполненные подходы и используй собственную технику, соответствующую упражнению.";
    }

    private int dp(int v){ return Math.round(v*getResources().getDisplayMetrics().density); }
    private int parseInt(String s,int f){ try{return Integer.parseInt(s.trim());}catch(Exception e){return f;} }
    private double parseDouble(String s,double f){ try{return Double.parseDouble(s.trim().replace(',','.'));}catch(Exception e){return f;} }
    private void toast(String s){ Toast.makeText(this,s,Toast.LENGTH_SHORT).show(); }
}
