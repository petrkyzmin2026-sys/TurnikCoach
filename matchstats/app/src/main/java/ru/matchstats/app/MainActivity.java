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

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int BG = Color.rgb(10, 15, 20);
    private static final int CARD = Color.rgb(20, 28, 36);
    private static final int CARD2 = Color.rgb(26, 36, 46);
    private static final int TEXT = Color.rgb(240, 244, 247);
    private static final int MUTED = Color.rgb(145, 157, 169);
    private static final int GREEN = Color.rgb(38, 166, 91);
    private static final int ACCENT = Color.rgb(64, 145, 255);

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final List<Match> lineMatches = new ArrayList<>();
    private final List<Match> liveMatches = new ArrayList<>();
    private boolean liveMode = false;
    private int liveTick = 0;

    private final Runnable liveUpdater = new Runnable() {
        @Override public void run() {
            if (!liveMode) return;
            liveTick++;
            for (Match m : liveMatches) m.advance(liveTick);
            render();
            handler.postDelayed(this, 5000);
        }
    };

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        seedData();
        render();
    }

    @Override protected void onDestroy() {
        handler.removeCallbacks(liveUpdater);
        super.onDestroy();
    }

    private void seedData() {
        lineMatches.add(new Match("Англия · Премьер-лига", "Арсенал", "Челси", "Сегодня 19:30", 56,25,19,1.72,3.70,4.80,64,36,1.86,2.02,58,42,1.44,2.75,49,34,17,2.05,2.18,4.90,68,32,1.58,2.42,31,69,3.05,1.38,0,0,0));
        lineMatches.add(new Match("Испания · Ла Лига", "Реал Сосьедад", "Вильярреал", "Сегодня 22:00", 43,29,28,2.20,3.30,3.10,54,46,1.94,1.90,47,53,1.52,2.45,38,39,23,2.48,2.08,4.05,59,41,1.82,2.03,26,74,3.55,1.28,0,0,0));
        lineMatches.add(new Match("Италия · Серия A", "Аталанта", "Лацио", "Завтра 21:45", 49,27,24,2.00,3.55,3.75,61,39,1.82,2.08,55,45,1.47,2.60,43,36,21,2.28,2.14,4.45,64,36,1.70,2.20,29,71,3.30,1.33,0,0,0));

        liveMatches.add(new Match("Германия · Бундеслига", "Байер", "Фрайбург", "LIVE",63,22,15,1.46,4.30,7.20,72,28,1.55,2.55,66,34,1.24,3.95,56,29,15,1.62,2.70,7.80,74,26,1.46,2.85,37,63,2.65,1.48,1,0,57));
        liveMatches.add(new Match("Франция · Лига 1", "Лилль", "Ренн", "LIVE",39,34,27,2.45,2.95,3.20,46,54,2.06,1.78,38,62,1.78,2.05,35,43,22,2.75,1.92,4.60,57,43,1.88,1.92,22,78,4.20,1.22,0,0,31));
    }

    private void render() {
        handler.removeCallbacks(liveUpdater);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);
        root.setPadding(dp(14), dp(12), dp(14), dp(12));

        root.addView(text("DENZL", 26, TEXT, true));
        TextView subtitle = text("Статистика матчей · вероятность модели + коэффициент букмекера", 12, MUTED, false);
        subtitle.setPadding(0, 0, 0, dp(12));
        root.addView(subtitle);

        LinearLayout tabs = new LinearLayout(this);
        tabs.setOrientation(LinearLayout.HORIZONTAL);
        tabs.setWeightSum(2);
        Button line = tabButton("ЛИНИЯ", !liveMode);
        Button live = tabButton("LIVE", liveMode);
        line.setOnClickListener(v -> { liveMode = false; render(); });
        live.setOnClickListener(v -> { liveMode = true; render(); });
        tabs.addView(line, new LinearLayout.LayoutParams(0, dp(48), 1));
        tabs.addView(live, new LinearLayout.LayoutParams(0, dp(48), 1));
        root.addView(tabs);

        if (liveMode) {
            TextView auto = text("LIVE обновляется автоматически каждые 5 секунд", 12, GREEN, true);
            auto.setGravity(Gravity.CENTER);
            auto.setPadding(0, dp(10), 0, dp(2));
            root.addView(auto);
        }

        ScrollView scroll = new ScrollView(this);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        for (Match m : (liveMode ? liveMatches : lineMatches)) content.addView(matchCard(m));
        scroll.addView(content);
        root.addView(scroll, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1));

        TextView note = text("Формат: вероятность модели % (коэффициент букмекера). Зелёный = предпочтительный тотал модели при уверенности от 58%.", 11, MUTED, false);
        note.setPadding(0, dp(8), 0, 0);
        root.addView(note);
        setContentView(root);

        if (liveMode) handler.postDelayed(liveUpdater, 5000);
    }

    private View matchCard(Match m) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(14), dp(12), dp(14), dp(12));
        card.setBackground(roundRect(CARD, 16));
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        cp.setMargins(0, dp(10), 0, 0);
        card.setLayoutParams(cp);

        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        TextView league = text(m.league, 12, MUTED, false);
        TextView time = text(m.liveMinute > 0 ? m.liveMinute + "'" : m.time, 12, m.liveMinute > 0 ? GREEN : MUTED, true);
        top.addView(league, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        top.addView(time);
        card.addView(top);

        String score = m.liveMinute > 0 ? "   " + m.homeGoals + ":" + m.awayGoals : "";
        TextView teams = text(m.home + " — " + m.away + score, 18, TEXT, true);
        teams.setPadding(0, dp(8), 0, dp(10));
        card.addView(teams);

        LinearLayout marketTabs = new LinearLayout(this);
        marketTabs.setOrientation(LinearLayout.HORIZONTAL);
        marketTabs.setWeightSum(2);
        Button full = smallTab("МАТЧ", true);
        Button first = smallTab("1-Й ТАЙМ", false);
        marketTabs.addView(full, new LinearLayout.LayoutParams(0, dp(40), 1));
        marketTabs.addView(first, new LinearLayout.LayoutParams(0, dp(40), 1));
        card.addView(marketTabs);

        LinearLayout marketHost = new LinearLayout(this);
        marketHost.setOrientation(LinearLayout.VERTICAL);
        marketHost.addView(fullMatchMarket(m));
        card.addView(marketHost);

        full.setOnClickListener(v -> {
            marketHost.removeAllViews();
            marketHost.addView(fullMatchMarket(m));
            full.setBackground(roundRect(ACCENT, 10));
            first.setBackground(roundRect(CARD2, 10));
        });
        first.setOnClickListener(v -> {
            marketHost.removeAllViews();
            marketHost.addView(firstHalfMarket(m));
            first.setBackground(roundRect(ACCENT, 10));
            full.setBackground(roundRect(CARD2, 10));
        });

        TextView details = text("Показать статистику", 13, ACCENT, true);
        details.setGravity(Gravity.CENTER);
        details.setPadding(0, dp(12), 0, dp(4));
        card.addView(details);
        details.setOnClickListener(v -> toggleDetails(card, details, m));
        return card;
    }

    private View fullMatchMarket(Match m) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(0, dp(10), 0, 0);

        LinearLayout outcomes = new LinearLayout(this);
        outcomes.setOrientation(LinearLayout.HORIZONTAL);
        outcomes.setWeightSum(3);
        outcomes.addView(probBox("П1", m.p1, m.o1, false), new LinearLayout.LayoutParams(0, dp(66), 1));
        outcomes.addView(probBox("X", m.px, m.ox, false), new LinearLayout.LayoutParams(0, dp(66), 1));
        outcomes.addView(probBox("П2", m.p2, m.o2, false), new LinearLayout.LayoutParams(0, dp(66), 1));
        box.addView(outcomes);

        addTotalPair(box, "ТОТАЛ 2.5", "ТБ 2.5", m.over25, m.oOver25, "ТМ 2.5", m.under25, m.oUnder25);
        addTotalPair(box, "ТОТАЛ 1.5", "ТБ 1.5", m.over15, m.oOver15, "ТМ 1.5", m.under15, m.oUnder15);
        return box;
    }

    private View firstHalfMarket(Match m) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(0, dp(10), 0, 0);

        TextView h = text("1-Й ТАЙМ", 11, MUTED, true);
        h.setPadding(0, 0, 0, dp(5));
        box.addView(h);

        LinearLayout outcomes = new LinearLayout(this);
        outcomes.setOrientation(LinearLayout.HORIZONTAL);
        outcomes.setWeightSum(3);
        outcomes.addView(probBox("П1", m.h1p1, m.h1o1, false), new LinearLayout.LayoutParams(0, dp(66), 1));
        outcomes.addView(probBox("X", m.h1px, m.h1ox, false), new LinearLayout.LayoutParams(0, dp(66), 1));
        outcomes.addView(probBox("П2", m.h1p2, m.h1o2, false), new LinearLayout.LayoutParams(0, dp(66), 1));
        box.addView(outcomes);

        addTotalPair(box, "1-Й ТАЙМ · ТОТАЛ 0.5", "ТБ 0.5", m.h1Over05, m.h1OOver05, "ТМ 0.5", m.h1Under05, m.h1OUnder05);
        addTotalPair(box, "1-Й ТАЙМ · ТОТАЛ 1.5", "ТБ 1.5", m.h1Over15, m.h1OOver15, "ТМ 1.5", m.h1Under15, m.h1OUnder15);
        return box;
    }

    private void addTotalPair(LinearLayout parent, String title, String leftLabel, int leftP, double leftO, String rightLabel, int rightP, double rightO) {
        TextView label = text(title, 11, MUTED, true);
        label.setPadding(0, dp(12), 0, dp(5));
        parent.addView(label);
        boolean leftGreen = leftP >= 58 && leftP > rightP;
        boolean rightGreen = rightP >= 58 && rightP > leftP;
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setWeightSum(2);
        row.addView(probBox(leftLabel, leftP, leftO, leftGreen), new LinearLayout.LayoutParams(0, dp(66), 1));
        row.addView(probBox(rightLabel, rightP, rightO, rightGreen), new LinearLayout.LayoutParams(0, dp(66), 1));
        parent.addView(row);
    }

    private View probBox(String label, int probability, double odds, boolean highlighted) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(dp(3), dp(4), dp(3), dp(4));
        box.setBackground(roundRect(highlighted ? GREEN : CARD2, 11));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(66), 1);
        lp.setMargins(dp(3), 0, dp(3), 0);
        box.setLayoutParams(lp);
        box.addView(text(label, 12, highlighted ? Color.WHITE : MUTED, true));
        box.addView(text(String.format(Locale.US, "%d%% (%.2f)", probability, odds), 15, Color.WHITE, true));
        return box;
    }

    private void toggleDetails(LinearLayout card, TextView control, Match m) {
        Object tag = control.getTag();
        if (tag instanceof View) {
            card.removeView((View) tag);
            control.setTag(null);
            control.setText("Показать статистику");
            return;
        }
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(12), dp(10), dp(12), dp(10));
        box.setBackground(roundRect(CARD2, 12));
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        bp.setMargins(0, dp(8), 0, 0);
        box.setLayoutParams(bp);
        box.addView(statLine("Удары", m.liveMinute > 0 ? (8 + liveTick) + " — " + (5 + liveTick / 2) : "14.2 — 10.8"));
        box.addView(statLine("Удары в створ", m.liveMinute > 0 ? (4 + liveTick / 2) + " — 2" : "5.6 — 3.9"));
        box.addView(statLine("Владение", m.liveMinute > 0 ? "58% — 42%" : "55% — 45%"));
        box.addView(statLine("xG", m.liveMinute > 0 ? String.format(Locale.US, "%.2f — %.2f", 1.15 + liveTick * 0.09, 0.62 + liveTick * 0.04) : "1.78 — 1.21"));
        box.addView(statLine("Форма 5 матчей", "В-В-Н-В-П / Н-П-В-Н-П"));
        card.addView(box);
        control.setTag(box);
        control.setText("Скрыть статистику");
    }

    private View statLine(String left, String right) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setPadding(0, dp(3), 0, dp(3));
        TextView a = text(left, 12, MUTED, false);
        TextView b = text(right, 12, TEXT, true);
        b.setGravity(Gravity.END);
        row.addView(a, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        row.addView(b);
        return row;
    }

    private Button tabButton(String label, boolean active) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextSize(14);
        b.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        b.setTextColor(Color.WHITE);
        b.setBackground(roundRect(active ? ACCENT : CARD, 12));
        return b;
    }

    private Button smallTab(String label, boolean active) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextSize(12);
        b.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        b.setTextColor(Color.WHITE);
        b.setBackground(roundRect(active ? ACCENT : CARD2, 10));
        return b;
    }

    private TextView text(String s, float size, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(size);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return t;
    }

    private GradientDrawable roundRect(int color, int radiusDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(radiusDp));
        return d;
    }

    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    static class Match {
        String league, home, away, time;
        int p1, px, p2, over25, under25, over15, under15;
        double o1, ox, o2, oOver25, oUnder25, oOver15, oUnder15;
        int h1p1, h1px, h1p2, h1Over05, h1Under05, h1Over15, h1Under15;
        double h1o1, h1ox, h1o2, h1OOver05, h1OUnder05, h1OOver15, h1OUnder15;
        int homeGoals, awayGoals, liveMinute;

        Match(String league, String home, String away, String time,
              int p1, int px, int p2, double o1, double ox, double o2,
              int over25, int under25, double oOver25, double oUnder25,
              int over15, int under15, double oOver15, double oUnder15,
              int h1p1, int h1px, int h1p2, double h1o1, double h1ox, double h1o2,
              int h1Over05, int h1Under05, double h1OOver05, double h1OUnder05,
              int h1Over15, int h1Under15, double h1OOver15, double h1OUnder15,
              int homeGoals, int awayGoals, int liveMinute) {
            this.league=league; this.home=home; this.away=away; this.time=time;
            this.p1=p1; this.px=px; this.p2=p2; this.o1=o1; this.ox=ox; this.o2=o2;
            this.over25=over25; this.under25=under25; this.oOver25=oOver25; this.oUnder25=oUnder25;
            this.over15=over15; this.under15=under15; this.oOver15=oOver15; this.oUnder15=oUnder15;
            this.h1p1=h1p1; this.h1px=h1px; this.h1p2=h1p2; this.h1o1=h1o1; this.h1ox=h1ox; this.h1o2=h1o2;
            this.h1Over05=h1Over05; this.h1Under05=h1Under05; this.h1OOver05=h1OOver05; this.h1OUnder05=h1OUnder05;
            this.h1Over15=h1Over15; this.h1Under15=h1Under15; this.h1OOver15=h1OOver15; this.h1OUnder15=h1OUnder15;
            this.homeGoals=homeGoals; this.awayGoals=awayGoals; this.liveMinute=liveMinute;
        }

        void advance(int tick) {
            liveMinute = Math.min(89, liveMinute + 1);
            if (tick % 5 == 0 && homeGoals + awayGoals < 4) homeGoals++;

            int boost = homeGoals + awayGoals > 0 ? 2 : 0;
            over25 = Math.min(90, over25 + 1 + boost);
            under25 = 100 - over25;
            over15 = Math.min(95, over15 + 1);
            under15 = 100 - over15;
            if (homeGoals > awayGoals) {
                p1 = Math.min(89, p1 + 1);
                p2 = Math.max(5, p2 - 1);
                px = Math.max(5, 100 - p1 - p2);
            }
            o1 = clamp(o1 - 0.02,1.05,20); ox = clamp(ox + 0.01,1.05,20); o2 = clamp(o2 + 0.03,1.05,20);
            oOver25 = clamp(oOver25 - 0.02,1.05,20); oUnder25 = clamp(oUnder25 + 0.02,1.05,20);
            oOver15 = clamp(oOver15 - 0.01,1.05,20); oUnder15 = clamp(oUnder15 + 0.02,1.05,20);

            if (liveMinute <= 45) {
                h1Over05 = Math.min(94, h1Over05 + 1 + boost);
                h1Under05 = 100 - h1Over05;
                h1Over15 = Math.min(88, h1Over15 + (tick % 2));
                h1Under15 = 100 - h1Over15;
                if (homeGoals > awayGoals) {
                    h1p1 = Math.min(90, h1p1 + 1);
                    h1p2 = Math.max(4, h1p2 - 1);
                    h1px = Math.max(4, 100 - h1p1 - h1p2);
                }
                h1OOver05 = clamp(h1OOver05 - 0.02,1.05,20);
                h1OUnder05 = clamp(h1OUnder05 + 0.03,1.05,20);
                h1OOver15 = clamp(h1OOver15 - 0.01,1.05,20);
                h1OUnder15 = clamp(h1OUnder15 + 0.02,1.05,20);
            }
        }

        static double clamp(double v, double min, double max) { return Math.max(min, Math.min(max, v)); }
    }
}
