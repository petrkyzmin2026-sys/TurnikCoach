package ru.turnikcoach.app;

import org.json.JSONException;
import org.json.JSONObject;

public final class TestRecord {
    public static final String PULLUPS = "pullups";
    public static final String HANG = "hang";
    public static final String CHEST = "chest";
    public static final String DIPS = "dips";
    public static final String WEIGHT = "weight";

    public long timestamp;
    public String type;
    public double value;

    public TestRecord(long timestamp, String type, double value) {
        this.timestamp = timestamp;
        this.type = type;
        this.value = value;
    }

    public JSONObject toJson() throws JSONException {
        return new JSONObject().put("timestamp", timestamp).put("type", type).put("value", value);
    }

    public static TestRecord fromJson(JSONObject o) {
        return new TestRecord(o.optLong("timestamp", 0), o.optString("type", ""), o.optDouble("value", 0));
    }
}
