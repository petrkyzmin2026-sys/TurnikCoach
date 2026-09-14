package ru.matchstats.app;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private static final int BG = Color.rgb(10, 15, 20);
    private static final int CARD = Color.rgb(20, 28, 36);
    private static final int CARD2 = Color.rgb(26, 36, 46);
    private static final int TEXT = Color.rgb(240, 244, 247);
    private static final int MUTED = Color.rgb(145, 157, 169);
    private static final int GREEN = Color.rgb(38, 166, 91);
    private static final int RED = Color.rgb(210, 74, 74);
    private static final int ACCENT = Color.rgb(64, 145, 255);

    private LinearLayout content;
    private boolean liveMode = false;
    private int liveTick = 0;

    private final List<Match> lineMatches = new ArrayList<>();
    private final List<Match> liveMatches = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        seedData();
        render();
    }

    private void seedData() {
        lineMatches.add(new Match("Англия · Премьер-лига", "Арсенал", "Челси", "Сегодня 19:30", 56, 25, 19, 64, 36, 58, 42, 0, 0, 0));
        lineMatches.add(new Match("Испания · Ла Лига", "Реал Сосьедад", "Вильярреал", "Сегодня 22:00", 43, 29, 28, 54, 46, 47, 53, 0, 0, 0));
        lineMatches.add(new Match("Италия · Серия A", "Аталанта", "Лацио", "Завтра 21:45", 49, 27, 24, 61, 39, 55, 45, 0, 0, 0));

        liveMatches.add(new Match("Германия · Бундеслига", "Байер", "Фрайбург", "LIVE", 63, 22, 15, 72, 28, 66, 34, 1, 0, 57));
        liveMatches.add(new Match("Франция · Лига 1", "Лилль", "Ренн", "LIVE", 39, 34, 27, 46, 54, 38, 62, 0, 0, 31));
    }

    private void render() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);
        root.setPadding(dp(14), dp(12), dp(14), dp(12));

        TextView title = text("MATCH STATS", 25, TEXT, true);
        root.addView(title);
        TextView subtitle = text("Вероятности исходов и тоталов", 13, MUTED, false);
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
            Button refresh = new Button(this);
            refresh.setText("ОБНОВИТЬ LIVE");
            refresh.setTextColor(Color.WHITE);
            refresh.setTextSize(13);
            refresh.setAllCaps(false);
            refresh.setBackground(roundRect(ACCENT, 12));
            LinearLayout.LayoutParams rp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(44));
            rp.setMargins(0, dp(10), 0, dp(4));
            root.addView(refresh, rp);
            refresh.setOnClickListener(v -> {
                liveTick++;
                for (Match m : liveMatches) m.advance(liveTick);
                render();
            });
        }

        ScrollView scroll = new ScrollView(this);
        content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        List<Match> src = liveMode ? liveMatches : lineMatches;
        for (Match m : src) content.addView(matchCard(m));
        scroll.addView(content);
        root.addView(scroll, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1));

        TextView note = text("Зелёный = предпочтительный тотал модели при уверенности от 58%. Данные этой версии демонстрационные и хранятся локально.", 11, MUTED, false);
        note.setPadding(0, dp(8), 0, 0);
        root.addView(note);

        setContentView(root);
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

        LinearLayout outcomes = new LinearLayout(this);
        outcomes.setOrientation(LinearLayout.HORIZONTAL);
        outcomes.setWeightSum(3);
        outcomes.addView(probBox("П1", m.p1, false), new LinearLayout.LayoutParams(0, dp(58), 1));
        outcomes.addView(probBox("X", m.px, false), new LinearLayout.LayoutParams(0, dp(58), 1));
        outcomes.addView(probBox("П2", m.p2, false), new LinearLayout.LayoutParams(0, dp(58), 1));
        card.addView(outcomes);

        TextView totalLabel = text("ТОТАЛ 2.5", 11, MUTED, true);
        totalLabel.setPadding(0, dp(12), 0, dp(5));
        card.addView(totalLabel);

        LinearLayout totals = new LinearLayout(this);
        totals.setOrientation(LinearLayout.HORIZONTAL);
        totals.setWeightSum(2);
        boolean overGreen = m.over25 >= 58 && m.over25 > m.under25;
        boolean underGreen = m.under25 >= 58 && m.under25 > m.over25;
        totals.addView(probBox("ТБ 2.5", m.over25, overGreen), new LinearLayout.LayoutParams(0, dp(60), 1));
        totals.addView(probBox("ТМ 2.5", m.under25, underGreen), new LinearLayout.LayoutParams(0, dp(60), 1));
        card.addView(totals);

        TextView total15 = text("ТБ 1.5 (" + m.over15 + "%)   •   ТМ 1.5 (" + m.under15 + "%)", 13, TEXT, false);
        total15.setPadding(0, dp(10), 0, 0);
        card.addView(total15);

        TextView details = text("Показать статистику", 13, ACCENT, true);
        details.setGravity(Gravity.CENTER);
        details.setPadding(0, dp(12), 0, dp(4));
        card.addView(details);
        details.setOnClickListener(v -> toggleDetails(card, details, m));
        return card;
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
        box.addView(statLine("xG", m.liveMinute > 0 ? String.format(java.util.Locale.US, "%.2f — %.2f", 1.15 + liveTick * 0.09, 0.62 + liveTick * 0.04) : "1.78 — 1.21"));
        box.addView(statLine("Форма 5 матчей", "В-В-Н-В-П / Н-П-В-Н-П"));
        box.addView(statLine("Расчёт", "локальная модель-прототип"));
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
        row.addView(b, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        return row;
    }

    private View probBox(String label, int probability, boolean highlighted) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(dp(4), dp(4), dp(4), dp(4));
        box.setBackground(roundRect(highlighted ? GREEN : CARD2, 11));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(58), 1);
        lp.setMargins(dp(3), 0, dp(3), 0);
        box.setLayoutParams(lp);
        TextView a = text(label, 12, highlighted ? Color.WHITE : MUTED, true);
        TextView b = text("(" + probability + "%)", 17, Color.WHITE, true);
        box.addView(a);
        box.addView(b);
        return box;
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

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    static class Match {
        String league, home, away, time;
        int p1, px, p2, over25, under25, over15, under15, homeGoals, awayGoals, liveMinute;

        Match(String league, String home, String away, String time, int p1, int px, int p2,
              int over25, int under25, int over15, int under15, int homeGoals, int awayGoals, int liveMinute) {
            this.league = league; this.home = home; this.away = away; this.time = time;
            this.p1 = p1; this.px = px; this.p2 = p2; this.over25 = over25; this.under25 = under25;
            this.over15 = over15; this.under15 = under15; this.homeGoals = homeGoals; this.awayGoals = awayGoals; this.liveMinute = liveMinute;
        }

        void advance(int tick) {
            liveMinute = Math.min(89, liveMinute + 2);
            if (tick % 4 == 0 && homeGoals + awayGoals < 4) homeGoals++;
            int boost = homeGoals + awayGoals > 0 ? 3 : 0;
            over25 = Math.min(89, over25 + 1 + boost);
            under25 = 100 - over25;
            over15 = Math.min(94, over15 + 1);
            under15 = 100 - over15;
            if (homeGoals > awayGoals) {
                p1 = Math.min(88, p1 + 2);
                p2 = Math.max(5, p2 - 1);
                px = 100 - p1 - p2;
            }
        }
    }
}
