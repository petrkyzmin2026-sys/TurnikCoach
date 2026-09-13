package ru.turnikcoach.app;

import java.util.ArrayList;
import java.util.List;

public final class WorkoutEngine {
    public static final String GOAL_FIRST = "Первое подтягивание";
    public static final String GOAL_REPS = "Больше подтягиваний";
    public static final String GOAL_STRENGTH = "Сила и мышцы";
    public static final String GOAL_MUSCLEUP = "Выход силой";
    public static final String GOAL_ONE_ARM = "Подтягивание на одной руке";

    private WorkoutEngine() {}

    public static int level(int max) {
        if (max <= 0) return 0;
        if (max <= 3) return 1;
        if (max <= 7) return 2;
        if (max <= 12) return 3;
        if (max <= 20) return 4;
        return 5;
    }

    public static String levelName(int max) {
        switch (level(max)) {
            case 0: return "Уровень 0 · подготовка к первому подтягиванию";
            case 1: return "Уровень 1 · одиночные повторения";
            case 2: return "Уровень 2 · базовый объём";
            case 3: return "Уровень 3 · устойчивые подходы";
            case 4: return "Уровень 4 · продвинутые подтягивания";
            default: return "Уровень 5 · сила, взрывная работа и специальные навыки";
        }
    }

    public static int blockWeek(Profile p, int completedSessions) {
        int d = Math.max(2, p.daysPerWeek);
        return Math.floorMod(completedSessions / d, 4) + 1;
    }

    public static String blockLabel(Profile p, int completedSessions) {
        switch (blockWeek(p, completedSessions)) {
            case 1: return "Неделя 1/4 · вход в объём";
            case 2: return "Неделя 2/4 · наращивание";
            case 3: return "Неделя 3/4 · рабочий пик";
            default: return "Неделя 4/4 · облегчение и контроль";
        }
    }

    public static String blockInstruction(Profile p, int completedSessions) {
        switch (blockWeek(p, completedSessions)) {
            case 1: return "Стабилизируй технику и оставляй 2–3 повтора в резерве в основных подходах.";
            case 2: return "Добавляется небольшой объём. Не увеличивай одновременно повторения и дополнительный вес.";
            case 3: return "Самая насыщенная неделя блока. Работай качественно, без отказа в каждом подходе.";
            default: return "Объём снижен примерно на треть. В конце недели уместен контрольный тест, если восстановление нормальное.";
        }
    }

    public static int workReps(Profile p, double factor) {
        if (p.maxPullUps <= 0) return 0;
        double auto = p.autoRegulation ? (1.0 + p.adaptationBias * 0.04) : 1.0;
        return Math.max(1, (int)Math.floor(p.maxPullUps * factor * auto));
    }

    public static List<Workout> buildWeek(Profile p) {
        List<Workout> all = new ArrayList<>();
        all.add(buildStrength(p));
        all.add(buildBase(p));
        all.add(buildVolume(p));
        all.add(buildTechnique(p));
        if (p.daysPerWeek == 2) {
            List<Workout> result = new ArrayList<>();
            result.add(all.get(0));
            result.add(all.get(2));
            return result;
        }
        if (p.daysPerWeek == 3) {
            List<Workout> result = new ArrayList<>();
            result.add(all.get(0));
            result.add(all.get(1));
            result.add(all.get(2));
            return result;
        }
        return all;
    }

    public static Workout workoutForIndex(Profile p, int completedSessions) {
        List<Workout> week = buildWeek(p);
        Workout base = week.get(Math.floorMod(completedSessions, week.size()));
        return applyBlockPhase(base, blockWeek(p, completedSessions));
    }

    public static Workout lightVersion(Workout source) {
        Workout w = new Workout(source.code, source.title + " · лёгкий режим", source.focus + ". Сниженный объём для восстановления.");
        for (Exercise e : source.exercises) {
            if (e.targetSets > 0) w.addExercise(e.adjusted(0.65, e.targetReps > 1 ? -1 : 0));
            else w.addExercise(e);
        }
        return w;
    }

    private static Workout applyBlockPhase(Workout source, int week) {
        if (week == 1) return source;
        double sets = 1.0;
        int repDelta = 0;
        if (week == 2) repDelta = 1;
        if (week == 3) { sets = 1.10; repDelta = 1; }
        if (week == 4) { sets = 0.68; repDelta = -1; }
        Workout w = new Workout(source.code, source.title, source.focus);
        for (Exercise e : source.exercises) {
            if (e.targetSets > 0 && (e.pullUpMain || week == 4)) w.addExercise(e.adjusted(sets, repDelta));
            else w.addExercise(e);
        }
        return w;
    }

    private static Workout buildStrength(Profile p) {
        int l = level(p.maxPullUps);
        Workout w = new Workout("A", "Тренировка A", "Сила подтягивания + контроль лопаток");
        addWarmup(w);
        if (l == 0) {
            w.reps("Активный вис / работа лопатками", 4, 6, 75, "Локти прямые. Движение начинается лопатками, без раскачки.", false)
             .reps("Негативные подтягивания", 5, 2, 120, "Начинай сверху с опоры. Опускание 4–6 секунд, без падения вниз.", true)
             .time("Удержание сверху", 3, 15, 90, "Подбородок выше перекладины, плечи не зажимать к ушам.");
        } else if (l <= 2) {
            int r = workReps(p, 0.60);
            w.reps("Строгие подтягивания", 5, r, 165, "Оставляй запас техники; прекращай подход до раскачки и рывков.", true)
             .reps("Подтягивания с паузой сверху", 3, Math.max(1, r - 1), 120, "Фиксация 1–2 секунды, затем контролируемый спуск.", true)
             .reps("Активный вис", 3, 8, 60, "Лопатки вниз-назад без сгибания локтей.", false);
        } else {
            int r = Math.max(3, workReps(p, 0.42));
            boolean weighted = p.allowAddedWeight && (GOAL_STRENGTH.equals(p.goal) || GOAL_MUSCLEUP.equals(p.goal)) && p.maxPullUps >= 10;
            w.reps(weighted ? "Силовые подтягивания / подтягивания с дополнительным весом" : "Строгие силовые подтягивания",
                    5, r, 180, weighted ? "Вес небольшой. Повторения остаются строгими; прекращай подход до потери амплитуды." : "Работай мощно вверх и контролируемо вниз.", true)
             .reps("Подтягивания с паузой", 3, Math.max(3, workReps(p, 0.32)), 120, "Фиксация без раскачки.", true)
             .time("Вис на время", 3, l >= 5 ? 55 : 45, 75, "Хват плотный, плечевой пояс контролируемый.");
        }
        addGoalSpecific(w, p, true);
        addCore(w, p);
        return w;
    }

    private static Workout buildBase(Profile p) {
        Workout w = new Workout("B", "Тренировка B", "База всего тела, турник остаётся главным движением");
        addWarmup(w);
        int l = level(p.maxPullUps);
        if (l == 0) {
            w.reps("Негативные подтягивания", 4, 2, 120, "Медленный спуск 4–6 секунд без падения вниз.", true);
        } else {
            int r = Math.max(1, workReps(p, 0.50));
            w.reps("Подтягивания", 4, r, 120, "Чистые повторения в одинаковой амплитуде.", true);
        }
        if (p.bodyweightExtras) {
            w.reps("Отжимания от пола", 4, l <= 1 ? 8 : 12, 90, "Корпус собран, амплитуда одинаковая.", false)
             .reps("Приседания с собственным весом", 4, l <= 1 ? 15 : 20, 75, "Колени следуют направлению стоп; темп контролируемый.", false);
        }
        addCore(w, p);
        return w;
    }

    private static Workout buildVolume(Profile p) {
        int l = level(p.maxPullUps);
        Workout w = new Workout("C", "Тренировка C", "Объём подтягиваний + хват");
        addWarmup(w);
        if (l == 0) {
            w.reps("Активный вис", 5, 6, 60, "Контроль плечевого пояса.", false)
             .reps("Негативные подтягивания", 6, 1, 90, "Каждое повторение одинаково медленное.", true)
             .time("Удержание в середине амплитуды", 3, 12, 90, "Без проваливания плеч.");
        } else if (l == 1) {
            w.reps("Одиночные строгие подтягивания", Math.min(12, Math.max(8, p.maxPullUps * 3)), 1, 75, "Каждое повторение отдельное и чистое; это не тест максимума.", true)
             .reps("Негативные подтягивания", 3, 2, 90, "Контроль 4–5 секунд вниз.", true);
        } else {
            int r = Math.max(2, workReps(p, 0.38));
            int sets = l >= 4 ? 8 : 6;
            w.reps("Многоподходные подтягивания", sets, r, l >= 4 ? 105 : 90, "Цель — одинаковая техника и накопление качественного объёма.", true);
            if (l >= 3) {
                w.reps("Высокие / взрывные подтягивания", 4, l >= 5 ? 4 : 3, 150, "Тяни перекладину к верхней части груди. Без болезненных рывков и раскачки.", true);
            }
            w.time("Вис на время", 3, l >= 4 ? 60 : 45, 75, "Развитие хвата без потери контроля плеч.");
        }
        addGoalSpecific(w, p, false);
        addCore(w, p);
        return w;
    }

    private static Workout buildTechnique(Profile p) {
        int l = level(p.maxPullUps);
        Workout w = new Workout("D", "Тренировка D", "Техника, кисти, восстановительный объём");
        addWarmup(w);
        w.reps("Активный вис", 4, 8, 60, "Только лопаточное движение, локти прямые.", false);
        if (p.maxPullUps == 0) w.reps("Негативные подтягивания — техника", 3, 1, 105, "Один медленный качественный негатив.", true);
        else w.reps("Строгие подтягивания — техника", 4, Math.max(1, workReps(p, 0.32)), 105, "Не гонись за количеством; повторения должны быть одинаковыми.", true);
        w.time("Вис комфортным хватом", 3, l >= 3 ? 35 : 25, 60, "Не проваливай плечи; прекращай при боли или онемении.");
        if (GOAL_MUSCLEUP.equals(p.goal) && l >= 2) {
            w.reps("Подтягивания к груди — техника", 4, Math.max(1, Math.min(4, p.chestToBarReps > 0 ? p.chestToBarReps - 1 : 2)), 120,
                    "Цель — высота и траектория, а не количество.", true);
        }
        if (p.bodyweightExtras) {
            w.reps("Лёгкие отжимания", 3, 10, 60, "Не до отказа; поддерживающая работа.", false)
             .reps("Спокойные приседания", 3, 15, 60, "Работа без форсирования.", false);
        }
        return w;
    }

    private static void addGoalSpecific(Workout w, Profile p, boolean strengthDay) {
        int l = level(p.maxPullUps);
        if (GOAL_MUSCLEUP.equals(p.goal)) {
            if (l < 2) {
                w.reps("Подтягивание с акцентом на скорость", 3, 1, 120, "Только чистое повторение; задача — ускорение вверх без рывка.", true);
            } else if (l == 2) {
                w.reps("Высокое подтягивание", 4, 2, 150, "Стремись поднять грудь выше обычного уровня без раскачки.", true);
            } else {
                w.reps("Высокое подтягивание к нижней части груди", 4, Math.min(4, Math.max(2, p.chestToBarReps)), 150,
                        "Скорость и высота важнее количества.", true);
                if (p.straightBarDips > 0 || l >= 4) {
                    w.reps("Отжимания в упоре на перекладине", 3, Math.max(3, Math.min(8, p.straightBarDips > 0 ? p.straightBarDips - 1 : 5)), 120,
                            "Начинай из устойчивого упора. Не проваливай плечи.", false);
                }
            }
        } else if (GOAL_ONE_ARM.equals(p.goal) && l >= 4) {
            if (strengthDay) {
                w.reps("Подтягивания лучника", 4, 3, 150, "Смещай корпус к рабочей руке, сохраняй контроль лопатки.", true)
                 .reps("Подтягивание с самоассистом второй рукой", 3, 2, 180, "Вторая рука помогает ровно настолько, чтобы сохранить строгую траекторию.", true);
            }
        } else if (GOAL_REPS.equals(p.goal) && l >= 3 && !strengthDay) {
            w.reps("Лестница подтягиваний", 3, Math.max(2, workReps(p, 0.25)), 75,
                    "Небольшие ступени, без выхода в отказ. Остановись при ухудшении техники.", true);
        }
    }

    private static void addWarmup(Workout w) {
        w.add("Разминка", "5–8 мин", "—", "Кисти, локти, плечи; лёгкий вис, лопаточные движения и 1–2 пробных подхода. Боль — основание остановить упражнение.");
    }

    private static void addCore(Workout w, Profile p) {
        if (level(p.maxPullUps) >= 2) {
            w.reps("Подъём коленей / ног в висе", 3, 10, 75, "Без раскачки; таз подкручивать в верхней части движения.", false);
        } else {
            w.reps("Подъём коленей в висе", 3, 6, 75, "Если хват ограничивает — сократи подход, сохрани контроль корпуса.", false);
        }
        if (p.bodyweightExtras) {
            w.time("Планка / hollow hold", 3, 35, 60, "Корпус жёсткий; поясница не провисает.");
        }
    }

    public static String progressionRule(Profile p) {
        int l = level(p.maxPullUps);
        String auto = p.autoRegulation ? " Автокоррекция сейчас: " + adaptationText(p.adaptationBias) + "." : "";
        if (l == 0) return "Переход уровня: 1 строгое подтягивание без рывка. До этого прогрессируй временем контроля в негативе и качеством активного виса." + auto;
        if (l <= 2) return "Если все рабочие подходы выполнены чисто два раза подряд — добавь 1 повтор к части подходов либо проведи новый контрольный тест." + auto;
        if (l <= 4) return "Прогрессируй одним параметром за раз: повторения, общий объём либо небольшой дополнительный вес. Не повышай всё одновременно." + auto;
        return "На продвинутом уровне чередуй силовой, объёмный и взрывной стимул. Специальные элементы добавляй поверх устойчивой базы, а не вместо неё." + auto;
    }

    public static String adaptationText(int bias) {
        if (bias <= -2) return "существенно сниженная нагрузка";
        if (bias == -1) return "слегка сниженная нагрузка";
        if (bias == 1) return "слегка повышенная нагрузка";
        if (bias >= 2) return "повышенная нагрузка";
        return "нейтральная нагрузка";
    }

    public static int muscleUpReadiness(Profile p) {
        int score = 0;
        score += Math.min(40, p.maxPullUps * 3);
        score += Math.min(30, p.chestToBarReps * 6);
        score += Math.min(20, p.straightBarDips * 3);
        if (p.deadHangSec >= 45) score += 10;
        return Math.min(100, score);
    }

    public static String muscleUpReadinessText(Profile p) {
        int s = muscleUpReadiness(p);
        if (s < 35) return "Сначала укрепляй базовые подтягивания, активный вис и контроль лопаток.";
        if (s < 60) return "База формируется. Главный приоритет — высокие подтягивания и уверенный упор на перекладине.";
        if (s < 80) return "Есть база для целенаправленной подготовки к выходу силой. Увеличивай высоту и скорость тяги.";
        return "Базовые показатели высокие. Основная задача — техника перехода и сохранение чистой траектории.";
    }

    public static String targetProgress(Profile p) {
        if (GOAL_FIRST.equals(p.goal)) {
            return p.maxPullUps > 0 ? "Первое строгое подтягивание уже выполнено. Можно сменить цель." : "Цель: первое строгое подтягивание.";
        }
        if (GOAL_REPS.equals(p.goal)) {
            int left = Math.max(0, p.targetReps - p.maxPullUps);
            return left == 0 ? "Целевой максимум достигнут или превышен." : "До цели " + p.targetReps + " осталось " + left + " повторений.";
        }
        if (GOAL_STRENGTH.equals(p.goal)) {
            return p.bestAddedWeightKg > 0 ? "Лучший дополнительный вес: +" + trim(p.bestAddedWeightKg) + " кг." : "Сначала закрепи строгие подходы, затем фиксируй лучший дополнительный вес.";
        }
        if (GOAL_MUSCLEUP.equals(p.goal)) {
            return "Готовность к выходу силой: " + muscleUpReadiness(p) + "% · " + muscleUpReadinessText(p);
        }
        return "Специальная силовая цель. Приоритет — асимметричная тяга, контроль лопатки и постепенное снижение помощи второй руки.";
    }

    private static String trim(double d) {
        if (Math.abs(d - Math.rint(d)) < 0.0001) return String.valueOf((int)Math.rint(d));
        return String.format(java.util.Locale.US, "%.1f", d);
    }
}
