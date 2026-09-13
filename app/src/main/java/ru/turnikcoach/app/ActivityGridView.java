package ru.turnikcoach.app;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.view.View;

import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class ActivityGridView extends View {
    private final Paint empty = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint active = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint today = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint text = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Set<Long> trainedDays = new HashSet<>();

    public ActivityGridView(Context context) {
        super(context);
        empty.setColor(Color.rgb(47, 50, 58));
        active.setColor(Color.rgb(255, 216, 77));
        today.setColor(Color.rgb(245, 246, 248));
        today.setStyle(Paint.Style.STROKE);
        today.setStrokeWidth(dp(1.5f));
        text.setColor(Color.rgb(160, 165, 176));
        text.setTextSize(dp(10));
        setMinimumHeight((int)dp(150));
    }

    public void setHistory(List<SessionRecord> history) {
        trainedDays.clear();
        if (history != null) for (SessionRecord r : history) trainedDays.add(dayKey(r.timestamp));
        invalidate();
    }

    @Override protected void onDraw(Canvas c) {
        super.onDraw(c);
        String[] labels = {"ПН","ВТ","СР","ЧТ","ПТ","СБ","ВС"};
        float gap = dp(6), left = dp(2), top = dp(22);
        float cell = Math.min((getWidth() - left * 2 - gap * 6) / 7f, dp(35));
        for (int i = 0; i < 7; i++) c.drawText(labels[i], left + i * (cell + gap) + dp(5), dp(12), text);

        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0); cal.set(Calendar.MINUTE,0); cal.set(Calendar.SECOND,0); cal.set(Calendar.MILLISECOND,0);
        long todayKey = cal.getTimeInMillis();
        int dow = cal.get(Calendar.DAY_OF_WEEK);
        int offset = dow == Calendar.SUNDAY ? 6 : dow - Calendar.MONDAY;
        cal.add(Calendar.DAY_OF_MONTH, -offset - 21);

        for (int row = 0; row < 4; row++) {
            for (int col = 0; col < 7; col++) {
                long key = cal.getTimeInMillis();
                float x = left + col * (cell + gap);
                float y = top + row * (cell + gap);
                c.drawRoundRect(x, y, x + cell, y + cell, dp(5), dp(5), trainedDays.contains(key) ? active : empty);
                if (key == todayKey) c.drawRoundRect(x, y, x + cell, y + cell, dp(5), dp(5), today);
                cal.add(Calendar.DAY_OF_MONTH, 1);
            }
        }
    }

    private long dayKey(long millis) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(millis);
        c.set(Calendar.HOUR_OF_DAY,0); c.set(Calendar.MINUTE,0); c.set(Calendar.SECOND,0); c.set(Calendar.MILLISECOND,0);
        return c.getTimeInMillis();
    }

    private float dp(float v) { return v * getResources().getDisplayMetrics().density; }
}
