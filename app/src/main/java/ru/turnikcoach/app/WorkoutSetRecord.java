package ru.turnikcoach.app;

import org.json.JSONException;
import org.json.JSONObject;

public class WorkoutSetRecord {
    public long timestamp;
    public int reps;
    public int seconds;
    public double addedWeightKg;

    public WorkoutSetRecord() {}

    public WorkoutSetRecord(long timestamp, int reps, int seconds, double addedWeightKg) {
        this.timestamp = timestamp;
        this.reps = reps;
        this.seconds = seconds;
        this.addedWeightKg = addedWeightKg;
    }

    public JSONObject toJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("timestamp", timestamp);
        o.put("reps", reps);
        o.put("seconds", seconds);
        o.put("addedWeightKg", addedWeightKg);
        return o;
    }

    public static WorkoutSetRecord fromJson(JSONObject o) {
        return new WorkoutSetRecord(
                o.optLong("timestamp", 0),
                o.optInt("reps", 0),
                o.optInt("seconds", 0),
                o.optDouble("addedWeightKg", 0));
    }
}
