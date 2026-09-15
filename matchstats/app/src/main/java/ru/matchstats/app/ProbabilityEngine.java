package ru.matchstats.app;

final class ProbabilityEngine {
    static final class Input {
        double homeGF, homeGA, awayGF, awayGA;
        double homeVenueGF, homeVenueGA, awayVenueGF, awayVenueGA;
        double homeXGF, homeXGA, awayXGF, awayXGA;
        double homeSotF, homeSotA, awaySotF, awaySotA;
        double homeForm, awayForm;
        int homeN, awayN, homeVenueN, awayVenueN, homeXgN, awayXgN, homeSotN, awaySotN;
        boolean live; int minute, scoreH, scoreA;
        double liveXgH, liveXgA, liveSotH, liveSotA, liveShotsH, liveShotsA;
    }
    static final class Result {
        double lambdaH, lambdaA, remainingH, remainingA;
        int p1, px, p2, o15, o25, o35, btts, bttsO25, reliability;
    }
    static Result calculate(Input x) {
        Result r=new Result();
        double lh=1.35, la=1.15; double w=0;
        if(x.homeN>=5&&x.awayN>=5){lh=blend(lh,(x.homeGF+x.awayGA)/2.0,2.4,w);la=blend(la,(x.awayGF+x.homeGA)/2.0,2.4,w);w+=2.4;}
        if(x.homeVenueN>=3&&x.awayVenueN>=3){lh=blend(lh,(x.homeVenueGF+x.awayVenueGA)/2.0,2.0,w);la=blend(la,(x.awayVenueGF+x.homeVenueGA)/2.0,2.0,w);w+=2.0;}
        if(x.homeXgN>=3&&x.awayXgN>=3){lh=blend(lh,(x.homeXGF+x.awayXGA)/2.0,3.2,w);la=blend(la,(x.awayXGF+x.homeXGA)/2.0,3.2,w);w+=3.2;}
        if(x.homeSotN>=3&&x.awaySotN>=3){double dh=(x.homeSotF-x.homeSotA)-(x.awaySotF-x.awaySotA);lh*=clamp(1+.035*dh,.82,1.18);la*=clamp(1-.035*dh,.82,1.18);}
        double fd=clamp(x.homeForm-x.awayForm,-.55,.55);lh*=1+.18*fd;la*=1-.18*fd;
        lh=clamp(lh,0.20,3.60);la=clamp(la,0.15,3.30);
        r.lambdaH=lh;r.lambdaA=la;
        int quality=35; quality+=Math.min(20,Math.min(x.homeN,x.awayN)*2); if(x.homeVenueN>=3&&x.awayVenueN>=3)quality+=15;if(x.homeXgN>=3&&x.awayXgN>=3)quality+=20;if(x.homeSotN>=3&&x.awaySotN>=3)quality+=10;r.reliability=Math.min(100,quality);
        double rh=lh,ra=la;int bh=0,ba=0;
        if(x.live){bh=Math.max(0,x.scoreH);ba=Math.max(0,x.scoreA);double rem=clamp((96.0-Math.max(0,x.minute))/96.0,0,1);rh=lh*rem;ra=la*rem;double elapsed=clamp(Math.max(1,x.minute)/96.0,.04,1);if(x.liveXgH+x.liveXgA>0){double paceH=x.liveXgH/elapsed,paceA=x.liveXgA/elapsed;rh=.62*rh+.38*paceH*rem;ra=.62*ra+.38*paceA*rem;}double pressure=(x.liveSotH-x.liveSotA)*.025+(x.liveShotsH-x.liveShotsA)*.006;pressure=clamp(pressure,-.25,.25);rh*=1+pressure;ra*=1-pressure;rh=clamp(rh,.005,3.2);ra=clamp(ra,.005,3.0);}
        r.remainingH=rh;r.remainingA=ra;double[][] p=matrix(rh,ra);double p1=0,px=0,p2=0,o15=0,o25=0,o35=0,bt=0,bto=0,sum=0;for(int h=0;h<p.length;h++)for(int a=0;a<p[h].length;a++){double q=p[h][a];sum+=q;int H=bh+h,A=ba+a,t=H+A;if(H>A)p1+=q;else if(H==A)px+=q;else p2+=q;if(t>=2)o15+=q;if(t>=3)o25+=q;if(t>=4)o35+=q;if(H>0&&A>0){bt+=q;if(t>=3)bto+=q;}}
        r.p1=pct(p1/sum);r.px=pct(px/sum);r.p2=100-r.p1-r.px;r.o15=pct(o15/sum);r.o25=pct(o25/sum);r.o35=pct(o35/sum);r.btts=pct(bt/sum);r.bttsO25=pct(bto/sum);return r;
    }
    private static double blend(double old,double value,double nw,double ow){return ow<=0?value:(old*ow+value*nw)/(ow+nw);}    
    private static double[][] matrix(double lh,double la){double[][]p=new double[11][11];for(int h=0;h<11;h++)for(int a=0;a<11;a++){double q=pois(h,lh)*pois(a,la);if(h<=1&&a<=1)q*=tau(h,a,lh,la,-.08);p[h][a]=q;}return p;}
    private static double tau(int h,int a,double lh,double la,double rho){if(h==0&&a==0)return 1-lh*la*rho;if(h==0&&a==1)return 1+lh*rho;if(h==1&&a==0)return 1+la*rho;if(h==1&&a==1)return 1-rho;return 1;}
    private static double pois(int k,double l){double f=1;for(int i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f;}
    private static int pct(double p){return (int)Math.round(clamp(p,0,1)*100);}private static double clamp(double v,double a,double b){return Math.max(a,Math.min(b,v));}
}