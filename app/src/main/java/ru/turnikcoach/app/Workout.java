package ru.turnikcoach.app;

import java.util.ArrayList;
import java.util.List;

public final class Workout {
    public final String code;
    public final String title;
    public final String focus;
    public final List<Exercise> exercises = new ArrayList<>();

    public Workout(String code, String title, String focus) {
        this.code = code;
        this.title = title;
        this.focus = focus;
    }

    public Workout(String title, String focus) {
        this("", title, focus);
    }

    public Workout add(String name, String prescription, String rest, String cue) {
        exercises.add(new Exercise(name, prescription, rest, cue));
        return this;
    }

    public Workout reps(String name, int sets, int reps, int restSeconds, String cue, boolean pullUpMain) {
        exercises.add(new Exercise(name, sets + "×" + reps, restLabel(restSeconds), cue,
                sets, reps, 0, restSeconds, Exercise.METRIC_REPS, pullUpMain));
        return this;
    }

    public Workout time(String name, int sets, int seconds, int restSeconds, String cue) {
        exercises.add(new Exercise(name, sets + "×" + seconds + " с", restLabel(restSeconds), cue,
                sets, 0, seconds, restSeconds, Exercise.METRIC_TIME, false));
        return this;
    }

    public Workout addExercise(Exercise e) {
        exercises.add(e);
        return this;
    }

    private static String restLabel(int sec) {
        if (sec <= 0) return "—";
        if (sec % 60 == 0) return (sec / 60) + " мин";
        return sec + " с";
    }
}
