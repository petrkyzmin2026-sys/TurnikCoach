from pathlib import Path
import re

p = Path("app/src/main/java/ru/matchstats/app/MainActivity.java")
s = p.read_text(encoding="utf-8")

# 1. Constants: 2-minute refresh and Fonbet fallback.
needle = '    private static final String BC_SCORE = "https://ad.betcity.ru/d/score?rev=5&date=%s&ver=60&lng=1&csn=ooca9s";\n'
insert = needle + '''    private static final long LIVE_REFRESH_MS = 120000L;\n    private static final String FB_BASE = "https://line-lb51.bk6bba-resources.com";\n    private static final String FB_LIST = FB_BASE + "/events/listBase?scopeMarket=1600&lang=ru";\n'''
if needle not in s:
    raise SystemExit("BC_SCORE marker not found")
s = s.replace(needle, insert, 1)

# 2. Live refresh period.
s = s.replace('handler.postDelayed(this,30000);', 'handler.postDelayed(this,LIVE_REFRESH_MS);')
s = s.replace('handler.postDelayed(liveRefresh,30000);', 'handler.postDelayed(liveRefresh,LIVE_REFRESH_MS);')

# 3. Current bookmaker shown to the user.
needle = '    private String selectedCountry="",selectedLeague="",status="Загрузка BETCITY…",searchText="";\n'
if needle not in s:
    raise SystemExit("state marker not found")
s = s.replace(needle, needle + '    private String oddsProvider="BETCITY";\n', 1)

# 4. BETCITY primary; Fonbet is used only when BETCITY fails or returns no events.
load_re = re.compile(r'    private void load\(boolean live\)\{.*?\n    \}\n\n    private List<Match> loadBetcity', re.S)
new_load = r'''    private void load(boolean live){
        if(!busy.compareAndSet(false,true))return;
        status=live?"Обновление LIVE…":"Загрузка линии…";render();
        io.execute(()->{
            List<Match> out=new ArrayList<>();String err="";String provider="BETCITY";
            try{
                ensureProfiles();
                out=loadBetcity(live);
                if(out.isEmpty())throw new Exception("BETCITY: пустая выборка");
            }catch(Exception betcityError){
                err=message(betcityError);
                try{
                    out=loadFonbet(live);
                    if(out.isEmpty())throw new Exception("FONBET: пустая выборка");
                    provider="FONBET";
                    err="";
                }catch(Exception fonbetError){
                    err=err+" · "+message(fonbetError);
                }
            }
            final List<Match> r=out;final String er=err;final String src=provider;
            runOnUiThread(()->{
                List<Match> dst=live?liveMatches:lineMatches;dst.clear();dst.addAll(r);
                oddsProvider=src;
                status=r.isEmpty()?(!er.isEmpty()?er:(live?"Сейчас нет матчей LIVE":"Линия пуста"))
                        :(live?"LIVE: ":"ЛИНИЯ: ")+r.size()+" матчей · "+src;
                busy.set(false);render();
            });
        });
    }

    private List<Match> loadFonbet(boolean wantLive)throws Exception{
        JSONObject root=getJsonGeneric(FB_LIST,"https://fon.bet/");
        JSONArray events=root.optJSONArray("events");
        if(events==null)events=root.optJSONArray("eventView");
        if(events==null)throw new Exception("FONBET: список событий не найден");
        Map<String,Match> map=new LinkedHashMap<>();
        for(int i=0;i<events.length();i++){
            JSONObject e=events.optJSONObject(i);if(e==null)continue;
            int sk=e.optInt("skId",e.optInt("sportId",0));
            String sport=e.optString("skName",e.optString("sportName","")).toLowerCase(Locale.ROOT);
            if(sk!=1&&!sport.contains("футбол")&&!sport.contains("football"))continue;
            String home=e.optString("team1","").trim(),away=e.optString("team2","").trim();
            if(home.length()<2||away.length()<2)continue;
            String place=e.optString("place","");
            String state=e.optString("state","");
            boolean eventLive="live".equalsIgnoreCase(place)||state.toLowerCase(Locale.ROOT).contains("live")
                    ||truth(e.opt("live"))||truth(e.opt("isLive"))||e.optInt("timerSeconds",0)>0;
            if(wantLive&&!eventLive)continue;
            if(!wantLive&&eventLive)continue;
            Match m=new Match();
            m.id=String.valueOf(e.optLong("id",e.optLong("eventId",0)));
            m.home=home;m.away=away;
            m.league=e.optString("competitionName",e.optString("competitionCaption","Прочие соревнования"));
            if(m.league.trim().isEmpty())m.league="Прочие соревнования";
            m.country=countryFromLeague(m.league);
            m.ts=parseBetcityDate(e.has("startTimeTimestamp")?e.opt("startTimeTimestamp"):e.opt("startTime"));
            m.hg=-1;m.ag=-1;m.h1g=-1;m.a1g=-1;
            int sh=e.optInt("score1",-1),sa=e.optInt("score2",-1);
            if(sh>=0&&sa>=0){m.hg=sh;m.ag=sa;}
            m.min=parseMinute(e.optString("timer",e.optString("timerString","")));
            map.put(m.id,m);
        }
        applyFonbetMiscs(root.optJSONArray("eventMiscs"),map);
        applyFonbetFactorGroups(root.optJSONArray("customFactors"),map);
        List<Match> out=new ArrayList<>(map.values());
        Collections.sort(out,(a,b)->Long.compare(a.ts,b.ts));
        for(Match m:out){applyProfile(m);calculateModel(m,wantLive);}
        return out;
    }

    private void applyFonbetMiscs(JSONArray a,Map<String,Match> map){
        if(a==null)return;
        for(int i=0;i<a.length();i++){
            JSONObject o=a.optJSONObject(i);if(o==null)continue;
            String id=String.valueOf(o.optLong("id",o.optLong("eventId",0)));
            Match m=map.get(id);if(m==null)continue;
            int h=o.optInt("score1",-1),g=o.optInt("score2",-1);
            if(h>=0&&g>=0){m.hg=h;m.ag=g;}
            int minute=parseMinute(o.optString("timer",o.optString("timerString","")));
            if(minute>0)m.min=minute;
        }
    }

    private void applyFonbetFactorGroups(JSONArray groups,Map<String,Match> map){
        if(groups==null)return;
        for(int i=0;i<groups.length();i++){
            JSONObject g=groups.optJSONObject(i);if(g==null)continue;
            String id=String.valueOf(g.optLong("e",g.optLong("eventId",g.optLong("id",0))));
            Match m=map.get(id);if(m==null)continue;
            JSONArray factors=g.optJSONArray("factors");
            if(factors==null)continue;
            for(int j=0;j<factors.length();j++){
                JSONObject f=factors.optJSONObject(j);if(f==null)continue;
                int fid=f.optInt("f",f.optInt("factorId",-1));
                double value=numObj(f.has("v")?f.opt("v"):f.opt("value"));
                if(value<=1.0)continue;
                // Fonbet factor ids for the football 1X2 market.
                if(fid==921)m.p1Odd=value;
                else if(fid==922)m.xOdd=value;
                else if(fid==923)m.p2Odd=value;
            }
        }
    }

    private List<Match> loadBetcity'''
m = load_re.search(s)
if not m:
    raise SystemExit("load() block not found")
s = s[:m.start()] + new_load + s[m.end():]

# 5. Generic HTTP JSON reader for the fallback bookmaker.
marker = '    private JSONObject getJson(String url,boolean live)throws Exception{\n'
generic = '''    private JSONObject getJsonGeneric(String url,String referer)throws Exception{\n        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(10000);c.setReadTimeout(15000);\n        c.setRequestProperty("Accept","application/json, text/plain, */*");c.setRequestProperty("Accept-Language","ru-RU,ru;q=0.9");\n        c.setRequestProperty("User-Agent","Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36");\n        if(referer!=null&&!referer.isEmpty())c.setRequestProperty("Referer",referer);\n        int code=c.getResponseCode();InputStream is=code>=200&&code<300?c.getInputStream():c.getErrorStream();String body=read(is);c.disconnect();\n        if(code<200||code>=300)throw new Exception("FONBET: HTTP "+code);\n        if(body.trim().isEmpty())throw new Exception("FONBET: пустой ответ");\n        return new JSONObject(body);\n    }\n\n'''
if marker not in s:
    raise SystemExit("getJson marker not found")
s = s.replace(marker, generic + marker, 1)

# 6. Visible source and refresh period.
s = s.replace('Вероятность DENZL · коэффициенты BETCITY', 'Вероятность DENZL · коэффициенты: "+oddsProvider+"')
s = s.replace('LIVE обновляется автоматически каждые 30 секунд', 'LIVE обновляется автоматически каждые 2 минуты')
s = s.replace('Матчи, LIVE и коэффициенты: BETCITY. Вероятности рассчитывает DENZL.', 'Матчи и LIVE: источник "+oddsProvider+". Вероятности рассчитывает DENZL независимо от БК.')

# The previous replacements deliberately convert complete Java string arguments into concatenations.
# Fix the two generated quote boundaries if the exact literals were present.
s = s.replace('txt("Вероятность DENZL · коэффициенты: "+oddsProvider+"",12', 'txt("Вероятность DENZL · коэффициенты: "+oddsProvider,12')
s = s.replace('txt("Матчи и LIVE: источник "+oddsProvider+". Вероятности рассчитывает DENZL независимо от БК.",10', 'txt("Матчи и LIVE: источник "+oddsProvider+". Вероятности рассчитывает DENZL независимо от БК.",10')

p.write_text(s,encoding="utf-8")
print("DENZL v1.3 patch applied")
