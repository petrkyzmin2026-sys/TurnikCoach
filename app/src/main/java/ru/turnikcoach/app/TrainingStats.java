package ru.turnikcoach.app;

import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class TrainingStats {
    private TrainingStats() {}

    public static int totalMinutes(List<SessionRecord> h) {
        long sec = 0;
        for (SessionRecord r : h) sec += Math.max(0, r.durationSec);
        return (int)(sec / 60L);
    }

    public static int totalSets(List<SessionRecord> h) {
        int n = 0;
        for (SessionRecord r : h) n += r.totalRecordedSets();
        return n;
    }

    public static int totalReps(List<SessionRecord> h) {
        int n = 0;
        for (SessionRecord r : h) n += r.totalReps();
        return n;
    }

    public static int totalPullUps(List<SessionRecord> h) {
        int n = 0;
        for (SessionRecord r : h) {
            int x = r.repsFor("pullups") + r.repsFor("weighted") + r.repsFor("chest");
            n += x > 0 ? x : Math.max(0, r.pullUpReps);
        }
        return n;
    }

    public static int repsFor(List<SessionRecord> h, String id) {
        int n = 0;
        for (SessionRecord r : h) n += r.repsFor(id);
        return n;
    }

    public static int bestSetFor(List<SessionRecord> h, String id) {
        int best = 0;
        for (SessionRecord r : h) best = Math.max(best, r.bestSetFor(id));
        return best;
    }

    public static int sessionsLastDays(List<SessionRecord> h, int days) {
        long from = System.currentTimeMillis() - days * 86_400_000L;
        int n = 0;
        for (SessionRecord r : h) if (r.timestamp >= from) n++;
        return n;
    }

    public static int currentWeekSessions(List<SessionRecord> h) {
        long start = weekKey(System.currentTimeMillis());
        int n = 0;
        for (SessionRecord r : h) if (r.timestamp >= start) n++;
        return n;
    }

    public static int activeWeekStreak(List<SessionRecord> h) {
        if (h.isEmpty()) return 0;
        Set<Long> weeks = new HashSet<>();
        for (SessionRecord r : h) weeks.add(weekKey(r.timestamp));
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(weekKey(System.currentTimeMillis()));
        if (!weeks.contains(c.getTimeInMillis())) c.add(Calendar.DAY_OF_MONTH, -7);
        int streak = 0;
        while (weeks.contains(c.getTimeInMillis())) { streak++; c.add(Calendar.DAY_OF_MONTH, -7); }
        return streak;
    }

    public static int[] dailyReps(List<SessionRecord> h, String exerciseId, int days) {
        int[] out = new int[days];
        long today = dayKey(System.currentTimeMillis());
        for (SessionRecord r : h) {
            long d = dayKey(r.timestamp);
            int ago = (int)((today - d) / 86_400_000L);
            if (ago >= 0 && ago < days) out[days - 1 - ago] += exerciseId == null ? r.totalReps() : r.repsFor(exerciseId);
        }
        return out;
    }

    public static int[] dailySessions(List<SessionRecord> h, int days) {
        int[] out = new int[days];
        long today = dayKey(System.currentTimeMillis());
        for (SessionRecord r : h) {
            int ago = (int)((today - dayKey(r.timestamp)) / 86_400_000L);
            if (ago >= 0 && ago < days) out[days - 1 - ago]++;
        }
        return out;
    }

    public static long dayKey(long ms) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(ms);
        c.set(Calendar.HOUR_OF_DAY,0); c.set(Calendar.MINUTE,0); c.set(Calendar.SECOND,0); c.set(Calendar.MILLISECOND,0);
        return c.getTimeInMillis();
    }

    private static long weekKey(long ms) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(ms);
        c.set(Calendar.HOUR_OF_DAY,0); c.set(Calendar.MINUTE,0); c.set(Calendar.SECOND,0); c.set(Calendar.MILLISECOND,0);
        int dow = c.get(Calendar.DAY_OF_WEEK);
        int offset = dow == Calendar.SUNDAY ? 6 : dow - Calendar.MONDAY;
        c.add(Calendar.DAY_OF_MONTH, -offset);
        return c.getTimeInMillis();
    }
}
