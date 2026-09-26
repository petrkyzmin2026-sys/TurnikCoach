# TurnikCoach — UX audit, block 2: button and interaction inventory
Date: 2026-09-26
Scope: inventory only. No production behavior changed.

## Baseline audited
- main: c5624cb6f7d36b5c3598a71c7e4010cb8b859b5a
- live hotfix: 5.16.22-forced-handover
- live course module: 1.0.19-webview-confirm
- actual packaged base inspected from the successful main build artifact (restored v5.13 web application).

The packaged v5.13 base is important: the checked-in app_v4.js/index.html are not the exact web UI restored by the APK workflow. Audit conclusions below use the packaged build plus live/hotfix.js.

## Inventory summary
- packaged base: 27 button templates in the actual index.html
- live course layer: 52 distinct button templates
- live hotfix: 10 programmatic button constructions (update, navigation, discard, close, info)
- inline action references are backed by functions once the actual packaged v5.13 base is included; closeSheet() is defined in the packaged base.

## Critical findings

### C1 — extra workout is structurally blocked after the main course workout
Current tcRenderToday() does this first:
1. detects tcTodayCourseRecord();
2. renders only the saved-workout / undo strip;
3. returns immediately.

Because of that return, tcBuildExtraItems() may contain valid extra exercises, but the extra-workout card below is never rendered after the main workout has been saved.

This directly explains the reported scenario:
main workout completed -> user returns to Today -> extra workout cannot be started.

This is not primarily a touch problem. It is a state-rendering dead end.

### C2 — explicit “Exit without saving” is injected into a DOM container that does not exist in the packaged v5.13 workout screen
Hotfix 5.16.22 searches:
  #workout.screen.on .controls

Actual packaged v5.13 workout markup uses:
  .stageControls

Therefore the intended explicit tcDiscardWorkoutBtn is not inserted on the active workout screen.

The Back control is inserted into .stageHeader and can reach the discard confirmation, but the dedicated visible action requested by the user is absent.

### C3 — update state is not observable
MainActivity:
- downloads live/hotfix.js;
- caches it;
- applies it with evaluateJavascript;
- catches download/apply exceptions without exposing them to the UI.

The user cannot see:
- last update check;
- downloaded version;
- active hotfix version;
- failure reason;
- whether cached or fresh code is running.

Hotfix 5.16.22 also contains an automatic handover for active 5.16.19–5.16.21: it can approve the new version and reload without a normal completion message.

Therefore “no update arrived” and “update applied silently” are indistinguishable from the UI.

### C4 — several visible start actions can become silent no-ops
Examples:
- tcStartCourseWorkout(): silent return when not due, W exists, no runnable definitions, or no built items.
- tcStartExtraWorkout(): silent return when W exists or extra item list is empty.
- tcStartAuxWorkout(): silent return when W exists, aux is no longer due, or no items can be built.
- tcStartSupplementWorkout(): one compound silent guard covers many state restrictions.
- tcStartCourseTest(): silent return for active workout or recovery restriction.

If the screen was rendered before state changed, or rendering and guard logic disagree, the user taps a normal-looking button and receives no reaction.

Rule for next remediation block: a visible enabled button may not terminate in a silent guard.

## High-priority UX findings

### H1 — “Завершить” is a save action, not an exit action
The packaged v5.13 active-workout button “Завершить” opens:
- “Сохранить и завершить”
- “Продолжить”

confirmEarlyFinish() marks all remaining sets as skipped and then records the workout.

This is technically consistent with its implementation but unsafe for exploration: a user who opens a workout to inspect it can easily convert that inspection into a completed course day.

The active workout needs clearly separated semantics:
- save/finish;
- discard/exit without saving.

### H2 — touch targets below Android’s 48 dp target exist
Known values:
- tcBackBtn: 38 x 38
- tcSheetClose: 36 x 36
- tcInfoBtn: 36 x 36
- week navigation buttons: minimum 30 x 32
- tcUndoTodayCourseBtn: minimum height 46
- base checkbox: 21 x 21
- base endBtn has 8 px vertical padding and no minimum height

The bottom navigation and +/- controls are large enough; many secondary controls are not.

### H3 — destructive and recovery actions are mixed into normal content
The saved-today screen gives the destructive undo action strong visual priority while valid next actions are absent.
This caused the screen to act as a dead end instead of a completed-state screen.

### H4 — update prompt has no persistent version/status surface
Even when update logic works, there is no place in the app to inspect active version later.

Recommended diagnostic fields for a later block:
- APK/base version
- active hotfix version
- cached hotfix version
- last successful check
- last failed check/reason

## Interaction map by area

### Update overlay
- Позже -> dismisses only this runtime prompt.
- Обновить -> refuses while W is active with text explanation; otherwise approves/reloads/activates.
- Risk: no persistent result/status; native fetch failures are silent.

### Bottom navigation
- Тренировка / Сегодня / История -> go(...).
- Base target area is the 72 px navigation bar; acceptable size.
- Risk during active workout is managed by nav foundation / Back interception, but this must be device-tested.

### Today / course calendar
- day buttons -> select read-only date preview.
- week back/forward -> changes week.
- Сегодня -> resets calendar.
- Risk: week navigation controls are too small.

### Main course start
- Начать основной комплекс / адаптированную тренировку -> tcStartCourseWorkout().
- Risks: multiple silent guards.

### Extra workout
- Начать дополнительную тренировку -> tcStartExtraWorkout().
- Handler exists.
- Critical state defect: current saved-main branch returns before this button can be rendered after the main workout.

### Course auxiliary / supplement
- auxiliary start -> tcStartAuxWorkout().
- supplement start -> tcStartSupplementWorkout().
- Risks: compound silent guards.

### Saved-today recovery
- Отменить запись и начать заново -> programmatically bound to tcOpenUndoTodayCourseConfirm().
- Confirmation buttons are programmatically bound in the sheet.
- Source-level binding is present in 5.16.22.
- Device state cannot be trusted until update observability is fixed, because the phone may still be executing an older cached hotfix.

### Active workout
Packaged base:
- Завершить -> early-save flow.
- − / + -> adjust current result.
- Сделано -> setDone(false).
- Пропустить подход -> setDone(true).

Hotfix:
- Back arrow -> tcNavigateBack(); from workout this opens discard confirmation.
- Intended “Выйти без сохранения” explicit button -> currently fails to insert because selector .controls does not exist in packaged v5.13.

### Rest
- Готов раньше -> finishRest().
- +30 секунд -> addRest().
- injected Back -> returns toward workout.
- injected Exit without saving -> can be inserted because .rest exists.
- injected info -> opens training info.
- Risk: injected Back/info controls are below 48 dp.

### Sheets / dialogs
- close/cancel actions use actual packaged closeSheet().
- hotfix also injects an X close button.
- Risk: injected X is 36 x 36.
- validation sheets often keep buttons enabled and validate only after tap; acceptable if failure is visible.

### Tests and level transitions
- start test, save result, defer 7 days, mastery test, advance level.
- Several handlers use silent state guards.
- Numeric validation provides field highlighting or explanatory sheet in many paths.
- Transition actions require state-consistency testing in a later block.

## Block 2 conclusion
The reported “non-clickable buttons” are not one defect class. The audit found three mechanisms:
1. action is never rendered because an earlier state branch returns;
2. control injection targets the wrong DOM selector;
3. visible button handler contains silent guards and can return with no feedback.

The update complaint is a fourth class: the action may run or fail, but the application does not expose enough state for the user to know which occurred.

## Next block boundary
Block 3 should modify only the critical user path:
1. make update status observable;
2. render and start valid extra workout after a saved main course workout;
3. provide a guaranteed visible Exit without saving on the actual v5.13 workout DOM;
4. replace silent failure on those three critical actions with visible reason/status.

Do not touch calendar sizing, tests, level transitions, or secondary controls in Block 3.
