package ru.turnikcoach.app;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class ExerciseLog {
    public String exerciseId;
    public String exerciseName;
    public String metric;
    public final List<WorkoutSetRecord> sets = new ArrayList<>();

    public ExerciseLog(String exerciseId, String exerciseName, String metric) {
        this.exerciseId = exerciseId;
        this.exerciseName = exerciseName;
        this.metric = metric;
    }

    public int totalReps() {
        int sum = 0;
        for (WorkoutSetRecord s : sets) sum += Math.max(0, s.reps);
        return sum;
    }

    public int totalSeconds() {
        int sum = 0;
        for (WorkoutSetRecord s : sets) sum += Math.max(0, s.seconds);
        return sum;
    }

    public int bestReps() {
        int best = 0;
        for (WorkoutSetRecord s : sets) best = Math.max(best, s.reps);
        return best;
    }

    public double tonnage(double bodyWeightKg) {
        double sum = 0;
        for (WorkoutSetRecord s : sets) {
            if (s.reps > 0) sum += s.reps * Math.max(0, bodyWeightKg + s.addedWeightKg);
        }
        return sum;
    }

    public JSONObject toJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("exerciseId", exerciseId);
        o.put("exerciseName", exerciseName);
        o.put("metric", metric);
        JSONArray a = new JSONArray();
        for (WorkoutSetRecord s : sets) a.put(s.toJson());
        o.put("sets", a);
        return o;
    }

    public static ExerciseLog fromJson(JSONObject o) {
        ExerciseLog r = new ExerciseLog(
                o.optString("exerciseId", ""),
                o.optString("exerciseName", "Упражнение"),
                o.optString("metric", ExerciseDef.REPS));
        JSONArray a = o.optJSONArray("sets");
        if (a != null) for (int i = 0; i < a.length(); i++) r.sets.add(WorkoutSetRecord.fromJson(a.optJSONObject(i)));
        return r;
    }
}
