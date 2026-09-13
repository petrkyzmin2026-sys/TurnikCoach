package ru.turnikcoach.app;

import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class TrainingStats {
    private TrainingStats() {}

    public static int totalPullUps(List<SessionRecord> history) {
        int sum = 0;
        for (SessionRecord r : history) sum += Math.max(0, r.pullUpReps);
        return sum;
    }

    public static int totalMinutes(List<SessionRecord> history) {
        long sec = 0;
        for (SessionRecord r : history) sec += Math.max(0, r.durationSec);
        return (int)(sec / 60L);
    }

    public static int sessionsLastDays(List<SessionRecord> history, int days) {
        long from = System.currentTimeMillis() - days * 86_400_000L;
        int count = 0;
        for (SessionRecord r : history) if (r.timestamp >= from) count++;
        return count;
    }

    public static int currentWeekSessions(List<SessionRecord> history) {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 0); c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 0); c.set(Calendar.MILLISECOND, 0);
        int dow = c.get(Calendar.DAY_OF_WEEK);
        int mondayOffset = dow == Calendar.SUNDAY ? 6 : dow - Calendar.MONDAY;
        c.add(Calendar.DAY_OF_MONTH, -mondayOffset);
        long start = c.getTimeInMillis();
        int count = 0;
        for (SessionRecord r : history) if (r.timestamp >= start) count++;
        return count;
    }

    public static int streakDays(List<SessionRecord> history) {
        if (history.isEmpty()) return 0;
        Set<Long> days = new HashSet<>();
        for (SessionRecord r : history) days.add(dayKey(r.timestamp));
        long today = dayKey(System.currentTimeMillis());
        long one = 86_400_000L;
        long cursor = days.contains(today) ? today : today - one;
        int streak = 0;
        while (days.contains(cursor)) { streak++; cursor -= one; }
        return streak;
    }

    public static int activeWeekStreak(List<SessionRecord> history) {
        if (history.isEmpty()) return 0;
        Set<Long> weeks = new HashSet<>();
        for (SessionRecord r : history) weeks.add(weekKey(r.timestamp));
        long current = weekKey(System.currentTimeMillis());
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(current);
        if (!weeks.contains(current)) c.add(Calendar.DAY_OF_MONTH, -7);
        int streak = 0;
        while (weeks.contains(c.getTimeInMillis())) {
            streak++;
            c.add(Calendar.DAY_OF_MONTH, -7);
        }
        return streak;
    }

    private static long weekKey(long millis) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(millis);
        c.set(Calendar.HOUR_OF_DAY, 0); c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 0); c.set(Calendar.MILLISECOND, 0);
        int dow = c.get(Calendar.DAY_OF_WEEK);
        int offset = dow == Calendar.SUNDAY ? 6 : dow - Calendar.MONDAY;
        c.add(Calendar.DAY_OF_MONTH, -offset);
        return c.getTimeInMillis();
    }

    private static long dayKey(long millis) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(millis);
        c.set(Calendar.HOUR_OF_DAY, 0); c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 0); c.set(Calendar.MILLISECOND, 0);
        return c.getTimeInMillis();
    }

    public static double averageRpe(List<SessionRecord> history, int limit) {
        int sum = 0, count = 0;
        for (SessionRecord r : history) {
            if (r.rpe > 0) { sum += r.rpe; count++; }
            if (count >= limit) break;
        }
        return count == 0 ? 0.0 : (double)sum / count;
    }
}
