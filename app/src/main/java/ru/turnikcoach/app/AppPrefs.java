package ru.turnikcoach.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class AppPrefs {
    private static final String NAME = "turnik_coach";
    private static final String HISTORY = "history_json";
    private static final String TESTS = "tests_json";
    private static final String CUSTOM_EXERCISES = "custom_exercises_json";
    private static final String DRAFT = "active_session_json";
    private final SharedPreferences p;

    public AppPrefs(Context context) { p = context.getSharedPreferences(NAME, Context.MODE_PRIVATE); }

    public boolean hasProfile() { return p.contains("max"); }

    public Profile loadProfile() {
        return new Profile(
                p.getInt("max", 0), p.getInt("days", 3), p.getString("goal", WorkoutEngine.GOAL_REPS),
                p.getBoolean("extras", true), p.getBoolean("pain", false),
                Double.longBitsToDouble(p.getLong("bodyWeightBits", Double.doubleToLongBits(0.0))),
                p.getInt("targetReps", 20), p.getInt("hang", 0), p.getInt("chest", 0), p.getInt("dips", 0),
                Double.longBitsToDouble(p.getLong("addedWeightBits", Double.doubleToLongBits(0.0))),
                p.getBoolean("autoReg", true), p.getBoolean("allowAdded", true), p.getInt("adaptBias", 0));
    }

    public void saveProfile(Profile x) {
        p.edit().putInt("max", x.maxPullUps).putInt("days", x.daysPerWeek).putString("goal", x.goal)
                .putBoolean("extras", x.bodyweightExtras).putBoolean("pain", x.hasPain)
                .putLong("bodyWeightBits", Double.doubleToRawLongBits(x.bodyWeightKg)).putInt("targetReps", x.targetReps)
                .putInt("hang", x.deadHangSec).putInt("chest", x.chestToBarReps).putInt("dips", x.straightBarDips)
                .putLong("addedWeightBits", Double.doubleToRawLongBits(x.bestAddedWeightKg))
                .putBoolean("autoReg", x.autoRegulation).putBoolean("allowAdded", x.allowAddedWeight)
                .putInt("adaptBias", x.adaptationBias).apply();
    }

    public void ensureProfile() {
        if (!hasProfile()) saveProfile(new Profile(0, 3, WorkoutEngine.GOAL_REPS, true, false, 0, 20, 0, 0, 0, 0, true, true, 0));
    }

    public List<ExerciseDef> exercises() {
        List<ExerciseDef> out = new ArrayList<>();
        out.add(new ExerciseDef("pullups", "Подтягивания строгие", ExerciseDef.REPS, 120,
                "https://youtu.be/lD8ISfk-RoQ", "pullup", true));
        out.add(new ExerciseDef("active_hang", "Активный вис", ExerciseDef.TIME, 90,
                "https://youtube.com/@calisthenicsschoolru", "hang", true));
        out.add(new ExerciseDef("scapular", "Лопаточные подтягивания", ExerciseDef.REPS, 75,
                "https://youtube.com/@calisthenicsschoolru", "scapular", true));
        out.add(new ExerciseDef("negative", "Негативные подтягивания", ExerciseDef.REPS, 120,
                "https://youtu.be/lD8ISfk-RoQ", "negative", true));
        out.add(new ExerciseDef("chest", "Высокие подтягивания к груди", ExerciseDef.REPS, 150,
                "https://www.youtube.com/watch?v=wzARwHHBU8s", "highpull", true));
        out.add(new ExerciseDef("weighted", "Подтягивания с дополнительным весом", ExerciseDef.REPS, 180,
                "https://youtu.be/mEHbiPA9QyM", "pullup", true));
        out.add(new ExerciseDef("bar_dips", "Отжимания на перекладине", ExerciseDef.REPS, 120,
                "https://www.youtube.com/watch?v=wzARwHHBU8s", "dip", true));
        try {
            JSONArray a = new JSONArray(p.getString(CUSTOM_EXERCISES, "[]"));
            for (int i = 0; i < a.length(); i++) {
                JSONObject o = a.optJSONObject(i);
                if (o != null) out.add(ExerciseDef.fromJson(o));
            }
        } catch (Exception ignored) { }
        return out;
    }

    public ExerciseDef exercise(String id) {
        for (ExerciseDef e : exercises()) if (e.id.equals(id)) return e;
        return null;
    }

    public ExerciseDef addCustomExercise(String name, String metric, int restSec) {
        String id = "custom_" + System.currentTimeMillis();
        ExerciseDef e = new ExerciseDef(id, name.trim(), metric, Math.max(0, restSec), "", "generic", false);
        JSONArray a;
        try { a = new JSONArray(p.getString(CUSTOM_EXERCISES, "[]")); } catch (Exception ex) { a = new JSONArray(); }
        try { a.put(e.toJson()); } catch (JSONException ignored) { }
        p.edit().putString(CUSTOM_EXERCISES, a.toString()).apply();
        return e;
    }

    public void deleteCustomExercise(String id) {
        JSONArray out = new JSONArray();
        try {
            JSONArray a = new JSONArray(p.getString(CUSTOM_EXERCISES, "[]"));
            for (int i = 0; i < a.length(); i++) {
                JSONObject o = a.optJSONObject(i);
                if (o != null && !id.equals(o.optString("id"))) out.put(o);
            }
        } catch (Exception ignored) { }
        p.edit().putString(CUSTOM_EXERCISES, out.toString()).apply();
    }

    public boolean hasDraft() { return p.contains(DRAFT); }

    public SessionRecord loadDraft() {
        try { return SessionRecord.fromJson(new JSONObject(p.getString(DRAFT, "{}"))); }
        catch (Exception e) { return null; }
    }

    public void saveDraft(SessionRecord r) {
        try { p.edit().putString(DRAFT, r.toJson().toString()).apply(); } catch (Exception ignored) { }
    }

    public void clearDraft() { p.edit().remove(DRAFT).apply(); }

    public List<SessionRecord> history() {
        List<SessionRecord> out = new ArrayList<>();
        try {
            JSONArray a = new JSONArray(p.getString(HISTORY, "[]"));
            for (int i = 0; i < a.length(); i++) {
                JSONObject o = a.optJSONObject(i);
                if (o != null) out.add(SessionRecord.fromJson(o));
            }
        } catch (Exception ignored) { }
        Collections.sort(out, (a, b) -> Long.compare(b.timestamp, a.timestamp));
        return out;
    }

    public void completeWorkout(SessionRecord r) {
        List<SessionRecord> list = history();
        list.add(0, r);
        if (list.size() > 500) list = new ArrayList<>(list.subList(0, 500));
        JSONArray a = new JSONArray();
        for (SessionRecord x : list) try { a.put(x.toJson()); } catch (JSONException ignored) { }
        p.edit().putString(HISTORY, a.toString()).remove(DRAFT).apply();
    }

    public int completed() { return history().size(); }
    public int bestMax() { return p.getInt("bestMax", p.getInt("max", 0)); }

    public void updateMax(int max) {
        ensureProfile();
        int safe = Math.max(0, max);
        p.edit().putInt("max", safe).putInt("bestMax", Math.max(safe, bestMax())).apply();
        addTest(new TestRecord(System.currentTimeMillis(), TestRecord.PULLUPS, safe));
    }

    public List<TestRecord> tests(String type) {
        List<TestRecord> out = new ArrayList<>();
        try {
            JSONArray a = new JSONArray(p.getString(TESTS, "[]"));
            for (int i = 0; i < a.length(); i++) {
                JSONObject o = a.optJSONObject(i);
                if (o == null) continue;
                TestRecord t = TestRecord.fromJson(o);
                if (type == null || type.equals(t.type)) out.add(t);
            }
        } catch (Exception ignored) { }
        Collections.sort(out, (a,b) -> Long.compare(a.timestamp,b.timestamp));
        return out;
    }

    private void addTest(TestRecord r) {
        JSONArray a;
        try { a = new JSONArray(p.getString(TESTS, "[]")); } catch (Exception e) { a = new JSONArray(); }
        try { a.put(r.toJson()); } catch (JSONException ignored) { }
        p.edit().putString(TESTS, a.toString()).apply();
    }

    public String exportJson() {
        JSONObject root = new JSONObject();
        try {
            root.put("history", new JSONArray(p.getString(HISTORY, "[]")));
            root.put("tests", new JSONArray(p.getString(TESTS, "[]")));
            root.put("customExercises", new JSONArray(p.getString(CUSTOM_EXERCISES, "[]")));
            if (hasDraft()) root.put("draft", new JSONObject(p.getString(DRAFT, "{}")));
        } catch (Exception ignored) { }
        return root.toString();
    }

    public void resetProgress() {
        p.edit().remove(HISTORY).remove(TESTS).remove(DRAFT).remove("bestMax").apply();
    }
}
