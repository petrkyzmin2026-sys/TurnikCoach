package ru.turnikcoach.app;

public final class Exercise {
    public static final String METRIC_REPS = "reps";
    public static final String METRIC_TIME = "time";
    public static final String METRIC_FREE = "free";

    public final String name;
    public final String prescription;
    public final String rest;
    public final String cue;
    public final int targetSets;
    public final int targetReps;
    public final int targetSeconds;
    public final int restSeconds;
    public final String metric;
    public final boolean pullUpMain;

    public Exercise(String name, String prescription, String rest, String cue) {
        this(name, prescription, rest, cue, 0, 0, 0, 0, METRIC_FREE, false);
    }

    public Exercise(String name, String prescription, String rest, String cue,
                    int targetSets, int targetReps, int targetSeconds, int restSeconds,
                    String metric, boolean pullUpMain) {
        this.name = name;
        this.prescription = prescription;
        this.rest = rest;
        this.cue = cue;
        this.targetSets = Math.max(0, targetSets);
        this.targetReps = Math.max(0, targetReps);
        this.targetSeconds = Math.max(0, targetSeconds);
        this.restSeconds = Math.max(0, restSeconds);
        this.metric = metric == null ? METRIC_FREE : metric;
        this.pullUpMain = pullUpMain;
    }

    public Exercise adjusted(double setFactor, int repDelta) {
        if (targetSets <= 0) return this;
        int sets = Math.max(1, (int)Math.round(targetSets * setFactor));
        int reps = targetReps > 0 ? Math.max(1, targetReps + repDelta) : 0;
        int seconds = targetSeconds > 0 ? Math.max(5, targetSeconds + repDelta * 5) : 0;
        String p;
        if (METRIC_REPS.equals(metric) && reps > 0) p = sets + "×" + reps;
        else if (METRIC_TIME.equals(metric) && seconds > 0) p = sets + "×" + seconds + " с";
        else p = prescription;
        return new Exercise(name, p, rest, cue, sets, reps, seconds, restSeconds, metric, pullUpMain);
    }
}
