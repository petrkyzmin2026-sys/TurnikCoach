package ru.turnikcoach.app;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;

public class TechniqueMotionView extends View {
    private final Paint bar = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint body = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint accent = new Paint(Paint.ANTI_ALIAS_FLAG);
    private float phase;
    private String motion = "pullup";
    private ValueAnimator animator;

    public TechniqueMotionView(Context c) {
        super(c);
        bar.setColor(Color.rgb(125,131,145)); bar.setStrokeWidth(dp(5)); bar.setStrokeCap(Paint.Cap.ROUND);
        body.setColor(Color.rgb(244,246,249)); body.setStrokeWidth(dp(5)); body.setStyle(Paint.Style.STROKE); body.setStrokeCap(Paint.Cap.ROUND);
        accent.setColor(Color.rgb(255,216,77)); accent.setStrokeWidth(dp(5)); accent.setStyle(Paint.Style.STROKE); accent.setStrokeCap(Paint.Cap.ROUND);
        setMinimumHeight(Math.round(dp(210)));
        start();
    }

    public void setMotion(String m) { motion = m == null ? "generic" : m; invalidate(); }

    private void start() {
        animator = ValueAnimator.ofFloat(0f,1f);
        animator.setDuration(1700); animator.setRepeatCount(ValueAnimator.INFINITE); animator.setRepeatMode(ValueAnimator.REVERSE);
        animator.setInterpolator(new AccelerateDecelerateInterpolator());
        animator.addUpdateListener(a->{phase=(float)a.getAnimatedValue(); invalidate();}); animator.start();
    }

    @Override protected void onDetachedFromWindow(){ if(animator!=null) animator.cancel(); super.onDetachedFromWindow(); }

    @Override protected void onDraw(Canvas c) {
        super.onDraw(c);
        float w=getWidth(), top=dp(38), cx=w/2f;
        c.drawLine(dp(28),top,w-dp(28),top,bar);
        float rise;
        if("hang".equals(motion)) rise=phase*dp(8);
        else if("scapular".equals(motion)) rise=phase*dp(18);
        else if("negative".equals(motion)) rise=(1f-phase)*dp(72);
        else if("dip".equals(motion)) { drawDip(c,cx,top); return; }
        else if("highpull".equals(motion)) rise=phase*dp(100);
        else rise=phase*dp(82);

        float handY=top+dp(3), shoulderY=top+dp(52)-rise, hipY=shoulderY+dp(58), footY=hipY+dp(70);
        float spread=dp(36);
        c.drawLine(cx-spread,handY,cx-dp(18),shoulderY,accent);
        c.drawLine(cx+spread,handY,cx+dp(18),shoulderY,accent);
        c.drawCircle(cx,shoulderY-dp(15),dp(12),body);
        c.drawLine(cx,shoulderY,cx,hipY,body);
        c.drawLine(cx,hipY,cx-dp(20),footY,body);
        c.drawLine(cx,hipY,cx+dp(20),footY,body);
    }

    private void drawDip(Canvas c,float cx,float top){
        float drop=phase*dp(34), shoulderY=top+dp(26)+drop, hipY=shoulderY+dp(55), handY=top+dp(6);
        c.drawCircle(cx,shoulderY-dp(14),dp(12),body);
        c.drawLine(cx,shoulderY,cx,hipY,body);
        c.drawLine(cx-dp(5),shoulderY,cx-dp(40),handY,accent);
        c.drawLine(cx+dp(5),shoulderY,cx+dp(40),handY,accent);
        c.drawLine(cx,hipY,cx-dp(16),hipY+dp(62),body); c.drawLine(cx,hipY,cx+dp(16),hipY+dp(62),body);
    }

    private float dp(float v){ return v*getResources().getDisplayMetrics().density; }
}
