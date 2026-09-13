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
    private final SharedPreferences p;

    public AppPrefs(Context context) { p = context.getSharedPreferences(NAME, Context.MODE_PRIVATE); }

    public boolean hasProfile() { return p.contains("max"); }

    public Profile loadProfile() {
        return new Profile(
                p.getInt("max", 0),
                p.getInt("days", 3),
                p.getString("goal", WorkoutEngine.GOAL_REPS),
                p.getBoolean("extras", true),
                p.getBoolean("pain", false),
                Double.longBitsToDouble(p.getLong("bodyWeightBits", Double.doubleToLongBits(0.0))),
                p.getInt("targetReps", 20),
                p.getInt("hang", 0),
                p.getInt("chest", 0),
                p.getInt("dips", 0),
                Double.longBitsToDouble(p.getLong("addedWeightBits", Double.doubleToLongBits(0.0))),
                p.getBoolean("autoReg", true),
                p.getBoolean("allowAdded", true),
                p.getInt("adaptBias", 0));
    }

    public void saveProfile(Profile profile) {
        p.edit()
                .putInt("max", profile.maxPullUps)
                .putInt("days", profile.daysPerWeek)
                .putString("goal", profile.goal)
                .putBoolean("extras", profile.bodyweightExtras)
                .putBoolean("pain", profile.hasPain)
                .putLong("bodyWeightBits", Double.doubleToRawLongBits(profile.bodyWeightKg))
                .putInt("targetReps", profile.targetReps)
                .putInt("hang", profile.deadHangSec)
                .putInt("chest", profile.chestToBarReps)
                .putInt("dips", profile.straightBarDips)
                .putLong("addedWeightBits", Double.doubleToRawLongBits(profile.bestAddedWeightKg))
                .putBoolean("autoReg", profile.autoRegulation)
                .putBoolean("allowAdded", profile.allowAddedWeight)
                .putInt("adaptBias", profile.adaptationBias)
                .apply();
    }

    public int completed() { return history().size(); }
    public int bestMax() { return p.getInt("bestMax", p.getInt("max", 0)); }
    public long lastWorkout() {
        List<SessionRecord> h = history();
        return h.isEmpty() ? 0 : h.get(0).timestamp;
    }
    public String lastNote() {
        List<SessionRecord> h = history();
        return h.isEmpty() ? "" : h.get(0).note;
    }

    public void completeWorkout(SessionRecord record) {
        List<SessionRecord> list = history();
        list.add(0, record);
        if (list.size() > 300) list = new ArrayList<>(list.subList(0, 300));
        saveHistory(list);
        updateAdaptiveBias(record);
    }

    private void updateAdaptiveBias(SessionRecord r) {
        Profile profile = loadProfile();
        if (!profile.autoRegulation) return;
        int bias = profile.adaptationBias;
        if (r.quality >= 3 && r.rpe > 0 && r.rpe <= 7 && r.readiness >= 3) bias++;
        else if (r.quality <= 1 || r.rpe >= 9 || r.readiness <= 2) bias--;
        else if (bias > 0) bias--;
        else if (bias < 0) bias++;
        profile.adaptationBias = Math.max(-2, Math.min(2, bias));
        saveProfile(profile);
    }

    public void updateMax(int max) {
        int safe = Math.max(0, max);
        int best = Math.max(safe, bestMax());
        p.edit().putInt("max", safe).putInt("bestMax", best).apply();
        addTest(new TestRecord(System.currentTimeMillis(), TestRecord.PULLUPS, safe));
    }

    public void updateTests(Integer hang, Integer chest, Integer dips, Double weight) {
        Profile profile = loadProfile();
        long now = System.currentTimeMillis();
        if (hang != null) {
            profile.deadHangSec = Math.max(0, hang);
            addTest(new TestRecord(now, TestRecord.HANG, profile.deadHangSec));
        }
        if (chest != null) {
            profile.chestToBarReps = Math.max(0, chest);
            addTest(new TestRecord(now, TestRecord.CHEST, profile.chestToBarReps));
        }
        if (dips != null) {
            profile.straightBarDips = Math.max(0, dips);
            addTest(new TestRecord(now, TestRecord.DIPS, profile.straightBarDips));
        }
        if (weight != null) {
            profile.bestAddedWeightKg = Math.max(0, weight);
            addTest(new TestRecord(now, TestRecord.WEIGHT, profile.bestAddedWeightKg));
        }
        saveProfile(profile);
    }

    public List<SessionRecord> history() {
        String raw = p.getString(HISTORY, "[]");
        List<SessionRecord> result = new ArrayList<>();
        try {
            JSONArray a = new JSONArray(raw);
            for (int i = 0; i < a.length(); i++) result.add(SessionRecord.fromJson(a.getJSONObject(i)));
        } catch (Exception ignored) { }
        Collections.sort(result, (a, b) -> Long.compare(b.timestamp, a.timestamp));
        return result;
    }

    public List<TestRecord> tests(String type) {
        List<TestRecord> result = new ArrayList<>();
        try {
            JSONArray a = new JSONArray(p.getString(TESTS, "[]"));
            for (int i = 0; i < a.length(); i++) {
                TestRecord t = TestRecord.fromJson(a.getJSONObject(i));
                if (type == null || type.equals(t.type)) result.add(t);
            }
        } catch (Exception ignored) { }
        Collections.sort(result, (a, b) -> Long.compare(a.timestamp, b.timestamp));
        return result;
    }

    private void saveHistory(List<SessionRecord> list) {
        JSONArray a = new JSONArray();
        for (SessionRecord r : list) {
            try { a.put(r.toJson()); } catch (JSONException ignored) { }
        }
        p.edit().putString(HISTORY, a.toString()).apply();
    }

    private void addTest(TestRecord record) {
        JSONArray a;
        try { a = new JSONArray(p.getString(TESTS, "[]")); }
        catch (Exception e) { a = new JSONArray(); }
        try { a.put(record.toJson()); } catch (JSONException ignored) { }
        while (a.length() > 400) {
            JSONArray trimmed = new JSONArray();
            for (int i = 1; i < a.length(); i++) {
                try { trimmed.put(a.getJSONObject(i)); } catch (JSONException ignored) { }
            }
            a = trimmed;
        }
        p.edit().putString(TESTS, a.toString()).apply();
    }

    public String exportJson() {
        JSONObject root = new JSONObject();
        Profile pr = loadProfile();
        try {
            JSONObject profile = new JSONObject();
            profile.put("maxPullUps", pr.maxPullUps);
            profile.put("daysPerWeek", pr.daysPerWeek);
            profile.put("goal", pr.goal);
            profile.put("bodyWeightKg", pr.bodyWeightKg);
            profile.put("targetReps", pr.targetReps);
            profile.put("deadHangSec", pr.deadHangSec);
            profile.put("chestToBarReps", pr.chestToBarReps);
            profile.put("straightBarDips", pr.straightBarDips);
            profile.put("bestAddedWeightKg", pr.bestAddedWeightKg);
            profile.put("adaptationBias", pr.adaptationBias);
            profile.put("bodyweightExtras", pr.bodyweightExtras);
            profile.put("hasPain", pr.hasPain);
            profile.put("autoRegulation", pr.autoRegulation);
            profile.put("allowAddedWeight", pr.allowAddedWeight);
            root.put("profile", profile);
            root.put("history", new JSONArray(p.getString(HISTORY, "[]")));
            root.put("tests", new JSONArray(p.getString(TESTS, "[]")));
        } catch (JSONException ignored) { }
        return root.toString();
    }

    public boolean importJson(String raw) {
        try {
            JSONObject root = new JSONObject(raw);
            JSONObject pr = root.getJSONObject("profile");
            Profile profile = new Profile(
                    pr.optInt("maxPullUps", 0),
                    pr.optInt("daysPerWeek", 3),
                    pr.optString("goal", WorkoutEngine.GOAL_REPS),
                    pr.optBoolean("bodyweightExtras", true),
                    pr.optBoolean("hasPain", false),
                    pr.optDouble("bodyWeightKg", 0),
                    pr.optInt("targetReps", 20),
                    pr.optInt("deadHangSec", 0),
                    pr.optInt("chestToBarReps", 0),
                    pr.optInt("straightBarDips", 0),
                    pr.optDouble("bestAddedWeightKg", 0),
                    pr.optBoolean("autoRegulation", true),
                    pr.optBoolean("allowAddedWeight", true),
                    pr.optInt("adaptationBias", 0));
            saveProfile(profile);
            p.edit()
                    .putString(HISTORY, root.optJSONArray("history") == null ? "[]" : root.optJSONArray("history").toString())
                    .putString(TESTS, root.optJSONArray("tests") == null ? "[]" : root.optJSONArray("tests").toString())
                    .putInt("bestMax", profile.maxPullUps)
                    .apply();
            for (TestRecord t : tests(TestRecord.PULLUPS)) {
                if (t.value > p.getInt("bestMax", 0)) p.edit().putInt("bestMax", (int)Math.round(t.value)).apply();
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void resetProgress() {
        Profile pr = loadProfile();
        pr.adaptationBias = 0;
        saveProfile(pr);
        p.edit().remove(HISTORY).remove(TESTS).remove("bestMax").apply();
    }
}
