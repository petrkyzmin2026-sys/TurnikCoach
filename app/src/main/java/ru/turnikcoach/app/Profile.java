package ru.turnikcoach.app;

public final class Profile {
    public int maxPullUps;
    public int daysPerWeek;
    public int targetReps;
    public int deadHangSec;
    public int chestToBarReps;
    public int straightBarDips;
    public int adaptationBias;
    public double bodyWeightKg;
    public double bestAddedWeightKg;
    public String goal;
    public boolean bodyweightExtras;
    public boolean hasPain;
    public boolean autoRegulation;
    public boolean allowAddedWeight;

    public Profile(int maxPullUps,
                   int daysPerWeek,
                   String goal,
                   boolean bodyweightExtras,
                   boolean hasPain,
                   double bodyWeightKg,
                   int targetReps,
                   int deadHangSec,
                   int chestToBarReps,
                   int straightBarDips,
                   double bestAddedWeightKg,
                   boolean autoRegulation,
                   boolean allowAddedWeight,
                   int adaptationBias) {
        this.maxPullUps = Math.max(0, maxPullUps);
        this.daysPerWeek = Math.max(2, Math.min(4, daysPerWeek));
        this.goal = goal == null ? WorkoutEngine.GOAL_REPS : goal;
        this.bodyweightExtras = bodyweightExtras;
        this.hasPain = hasPain;
        this.bodyWeightKg = Math.max(0.0, bodyWeightKg);
        this.targetReps = Math.max(1, targetReps);
        this.deadHangSec = Math.max(0, deadHangSec);
        this.chestToBarReps = Math.max(0, chestToBarReps);
        this.straightBarDips = Math.max(0, straightBarDips);
        this.bestAddedWeightKg = Math.max(0.0, bestAddedWeightKg);
        this.autoRegulation = autoRegulation;
        this.allowAddedWeight = allowAddedWeight;
        this.adaptationBias = Math.max(-2, Math.min(2, adaptationBias));
    }
}
