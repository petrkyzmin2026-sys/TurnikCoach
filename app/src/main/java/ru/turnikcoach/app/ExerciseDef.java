package ru.turnikcoach.app;

import org.json.JSONException;
import org.json.JSONObject;

public class ExerciseDef {
    public static final String REPS = "reps";
    public static final String TIME = "time";

    public String id;
    public String name;
    public String metric;
    public int restSec;
    public String sourceUrl;
    public String animation;
    public boolean builtIn;

    public ExerciseDef(String id, String name, String metric, int restSec, String sourceUrl, String animation, boolean builtIn) {
        this.id = id;
        this.name = name;
        this.metric = metric;
        this.restSec = restSec;
        this.sourceUrl = sourceUrl == null ? "" : sourceUrl;
        this.animation = animation == null ? "generic" : animation;
        this.builtIn = builtIn;
    }

    public JSONObject toJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("id", id);
        o.put("name", name);
        o.put("metric", metric);
        o.put("restSec", restSec);
        o.put("sourceUrl", sourceUrl);
        o.put("animation", animation);
        o.put("builtIn", builtIn);
        return o;
    }

    public static ExerciseDef fromJson(JSONObject o) {
        return new ExerciseDef(
                o.optString("id"),
                o.optString("name", "Упражнение"),
                o.optString("metric", REPS),
                o.optInt("restSec", 120),
                o.optString("sourceUrl", ""),
                o.optString("animation", "generic"),
                o.optBoolean("builtIn", false));
    }
}
