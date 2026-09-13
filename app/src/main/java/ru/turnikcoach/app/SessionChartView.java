package ru.turnikcoach.app;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.view.View;

public class SessionChartView extends View {
    private int[] values = new int[0];
    private final Paint grid = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint line = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint label = new Paint(Paint.ANTI_ALIAS_FLAG);

    public SessionChartView(Context c) {
        super(c);
        grid.setColor(Color.rgb(55,59,70)); grid.setStrokeWidth(dp(1));
        line.setColor(Color.rgb(255,216,77)); line.setStrokeWidth(dp(3)); line.setStyle(Paint.Style.STROKE);
        fill.setColor(Color.argb(38,255,216,77)); fill.setStyle(Paint.Style.FILL);
        label.setColor(Color.rgb(150,156,170)); label.setTextSize(dp(10));
        setMinimumHeight(Math.round(dp(190)));
    }

    public void setValues(int[] v) { values = v == null ? new int[0] : v; invalidate(); }

    @Override protected void onDraw(Canvas c) {
        super.onDraw(c);
        float l=dp(12), r=getWidth()-dp(12), t=dp(20), b=getHeight()-dp(28);
        for(int i=0;i<=3;i++){ float y=t+(b-t)*i/3f; c.drawLine(l,y,r,y,grid); }
        if(values.length==0) return;
        int max=1; for(int v:values) max=Math.max(max,v);
        Path p=new Path(); Path area=new Path();
        for(int i=0;i<values.length;i++){
            float x=values.length==1?(l+r)/2f:l+(r-l)*i/(values.length-1f);
            float y=b-(b-t)*values[i]/(float)max;
            if(i==0){p.moveTo(x,y); area.moveTo(x,b); area.lineTo(x,y);} else {p.lineTo(x,y); area.lineTo(x,y);} 
        }
        area.lineTo(r,b); area.close(); c.drawPath(area,fill); c.drawPath(p,line);
        c.drawText("−30 дн.",l,getHeight()-dp(8),label);
        String mx="пик " + max; c.drawText(mx,r-label.measureText(mx),getHeight()-dp(8),label);
        c.drawText("сегодня",r-label.measureText("сегодня"),getHeight()-dp(8),label);
    }

    private float dp(float v){return v*getResources().getDisplayMetrics().density;}
}
