package ru.turnikcoach.app;

import org.json.JSONException;
import org.json.JSONObject;

public final class SessionRecord {
    public long timestamp;
    public long durationSec;
    public String workoutTitle;
    public String focus;
    public String note;
    public String exerciseSummary;
    public int readiness;
    public int quality;
    public int rpe;
    public int pullUpReps;
    public int totalSets;
    public boolean lightMode;

    public JSONObject toJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("timestamp", timestamp);
        o.put("durationSec", durationSec);
        o.put("workoutTitle", workoutTitle);
        o.put("focus", focus);
        o.put("note", note);
        o.put("exerciseSummary", exerciseSummary);
        o.put("readiness", readiness);
        o.put("quality", quality);
        o.put("rpe", rpe);
        o.put("pullUpReps", pullUpReps);
        o.put("totalSets", totalSets);
        o.put("lightMode", lightMode);
        return o;
    }

    public static SessionRecord fromJson(JSONObject o) {
        SessionRecord r = new SessionRecord();
        r.timestamp = o.optLong("timestamp", 0);
        r.durationSec = o.optLong("durationSec", 0);
        r.workoutTitle = o.optString("workoutTitle", "Тренировка");
        r.focus = o.optString("focus", "");
        r.note = o.optString("note", "");
        r.exerciseSummary = o.optString("exerciseSummary", "");
        r.readiness = o.optInt("readiness", 3);
        r.quality = o.optInt("quality", 2);
        r.rpe = o.optInt("rpe", 0);
        r.pullUpReps = o.optInt("pullUpReps", 0);
        r.totalSets = o.optInt("totalSets", 0);
        r.lightMode = o.optBoolean("lightMode", false);
        return r;
    }
}
