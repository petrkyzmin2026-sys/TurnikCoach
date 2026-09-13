package ru.turnikcoach.app;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.view.View;

import java.util.ArrayList;
import java.util.List;

public final class ProgressChartView extends View {
    private final Paint axis = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint line = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint point = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint text = new Paint(Paint.ANTI_ALIAS_FLAG);
    private List<TestRecord> data = new ArrayList<>();

    public ProgressChartView(Context context) {
        super(context);
        axis.setColor(Color.rgb(75, 78, 87));
        axis.setStrokeWidth(dp(1));
        line.setColor(Color.rgb(255, 216, 77));
        line.setStrokeWidth(dp(3));
        line.setStyle(Paint.Style.STROKE);
        point.setColor(Color.rgb(255, 216, 77));
        text.setColor(Color.rgb(180, 185, 195));
        text.setTextSize(dp(11));
        setMinimumHeight((int)dp(180));
    }

    public void setData(List<TestRecord> values) {
        data = values == null ? new ArrayList<>() : values;
        invalidate();
    }

    @Override protected void onDraw(Canvas c) {
        super.onDraw(c);
        float left = dp(34), top = dp(14), right = getWidth() - dp(12), bottom = getHeight() - dp(28);
        c.drawLine(left, bottom, right, bottom, axis);
        c.drawLine(left, top, left, bottom, axis);
        if (data.isEmpty()) {
            c.drawText("Нет контрольных тестов", left + dp(12), top + dp(28), text);
            return;
        }
        double min = Double.MAX_VALUE, max = -Double.MAX_VALUE;
        for (TestRecord t : data) { min = Math.min(min, t.value); max = Math.max(max, t.value); }
        if (max - min < 1.0) { min = Math.max(0, min - 1); max += 1; }
        int n = data.size();
        Path p = new Path();
        for (int i = 0; i < n; i++) {
            TestRecord t = data.get(i);
            float x = n == 1 ? (left + right) / 2f : left + (right - left) * i / (n - 1f);
            float y = bottom - (float)((t.value - min) / (max - min)) * (bottom - top);
            if (i == 0) p.moveTo(x, y); else p.lineTo(x, y);
            c.drawCircle(x, y, dp(4), point);
        }
        c.drawPath(p, line);
        c.drawText(String.valueOf((int)Math.round(max)), dp(4), top + dp(5), text);
        c.drawText(String.valueOf((int)Math.round(min)), dp(4), bottom, text);
        c.drawText("контрольные тесты →", right - dp(110), getHeight() - dp(6), text);
    }

    private float dp(float v) { return v * getResources().getDisplayMetrics().density; }
}
