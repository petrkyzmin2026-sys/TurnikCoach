package ru.turnikcoach.app;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public final class SessionRecord {
    // New free-workout fields.
    public long timestamp;      // Start time, kept for backward compatibility.
    public long endTimestamp;
    public long durationSec;
    public String workoutTitle = "Свободная тренировка";
    public String note = "";
    public final List<ExerciseLog> exercises = new ArrayList<>();

    // Legacy fields kept so old installs/history continue to load.
    public String focus = "";
    public String exerciseSummary = "";
    public int readiness = 3;
    public int quality = 2;
    public int rpe;
    public int pullUpReps;
    public int totalSets;
    public boolean lightMode;

    public int totalRecordedSets() {
        int n = 0;
        if (!exercises.isEmpty()) {
            for (ExerciseLog e : exercises) n += e.sets.size();
            return n;
        }
        return Math.max(0, totalSets);
    }

    public int totalReps() {
        int n = 0;
        if (!exercises.isEmpty()) {
            for (ExerciseLog e : exercises) n += e.totalReps();
            return n;
        }
        return Math.max(0, pullUpReps);
    }

    public int repsFor(String exerciseId) {
        int n = 0;
        for (ExerciseLog e : exercises) if (exerciseId.equals(e.exerciseId)) n += e.totalReps();
        return n;
    }

    public int bestSetFor(String exerciseId) {
        int best = 0;
        for (ExerciseLog e : exercises) if (exerciseId.equals(e.exerciseId)) best = Math.max(best, e.bestReps());
        return best;
    }

    public JSONObject toJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("timestamp", timestamp);
        o.put("endTimestamp", endTimestamp);
        o.put("durationSec", durationSec);
        o.put("workoutTitle", workoutTitle);
        o.put("note", note);
        JSONArray logs = new JSONArray();
        for (ExerciseLog e : exercises) logs.put(e.toJson());
        o.put("exercises", logs);

        o.put("focus", focus);
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
        r.endTimestamp = o.optLong("endTimestamp", r.timestamp + o.optLong("durationSec", 0) * 1000L);
        r.durationSec = o.optLong("durationSec", Math.max(0, (r.endTimestamp - r.timestamp) / 1000L));
        r.workoutTitle = o.optString("workoutTitle", "Тренировка");
        r.note = o.optString("note", "");
        JSONArray logs = o.optJSONArray("exercises");
        if (logs != null) {
            for (int i = 0; i < logs.length(); i++) {
                JSONObject item = logs.optJSONObject(i);
                if (item != null) r.exercises.add(ExerciseLog.fromJson(item));
            }
        }
        r.focus = o.optString("focus", "");
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
