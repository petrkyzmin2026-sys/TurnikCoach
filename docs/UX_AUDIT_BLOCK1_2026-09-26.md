# TurnikCoach — UX audit, block 1
Date: 2026-09-26
Scope: research and rules only. No production code changes in this block.

## Frozen production baseline
- main commit: c5624cb6f7d36b5c3598a71c7e4010cb8b859b5a
- production hotfix: 5.16.22-forced-handover
- bundled course module: 1.0.19-webview-confirm
- do not merge any earlier unfinished audit branches into main.

## External UX references reviewed
- Android accessibility: interactive touch targets should be at least 48 x 48 dp.
  https://developer.android.com/guide/topics/ui/accessibility/apps
- Android Snackbar guidance: short, visible confirmation for actions and state changes; optional undo for reversible destructive actions.
  https://developer.android.com/develop/ui/compose/components/snackbar
- Android navigation guidance: Back navigation must be predictable and preserve user context.
  https://developer.android.com/guide/navigation
- Hevy: active workout has explicit Finish; a started workout can be discarded separately; an accidentally saved workout can be edited or deleted later.
  https://www.hevyapp.com/features/start-empty-workout/
  https://www.hevyapp.com/features/workout-log/
- Strong: an active workout remains editable and can be finished at any time.
  https://help.strongapp.io/article/229-my-first-workout

## UX rules accepted for TurnikCoach

### 1. Visible action must always produce a visible result
A button may not silently return from its handler.
If an action is unavailable, choose one:
- hide the action;
- render it disabled and show the reason;
- allow tap and show the blocking reason.

Silent guards such as `if (...) return;` are acceptable internally only when the triggering control cannot be shown in that state.

### 2. Save and discard are different operations
During an active workout the user must always have two conceptually separate actions:
- Finish / Save;
- Exit without saving.

A user who only opened a workout to inspect it must not be forced to create a saved workout record.

### 3. Destructive actions require explicit confirmation
Delete, undo saved workout, or discard active unsaved workout must use an in-app confirmation surface that works inside Android WebView.
Do not depend on browser JavaScript dialogs.

### 4. Completion is not a dead end
After the main Morozov workout is completed:
- the course sequence is already advanced exactly once;
- non-conflicting extra exercises selected by the user remain available the same day;
- extra workout is saved as a separate record;
- extra workout must not advance the Morozov course again.

### 5. Critical actions require direct feedback
After update, save, delete, undo, or settings save, show a visible confirmation.
The user must be able to tell whether the action actually happened.

### 6. Touch targets
All important touch targets: minimum 48 dp effective target.
Audit includes:
- calendar days;
- back/close icons;
- info icons;
- finish/discard actions;
- bottom navigation;
- checkboxes and small star/main-exercise buttons.

### 7. Active workout must remain recoverable
Back/Home/return from rest or modal must not unexpectedly discard data.
If leaving risks losing current unsaved sets, ask first.

### 8. One screen = one dominant state
Avoid two large cards that describe contradictory or competing states.
For example, after a completed main workout:
- one compact completed state;
- then the next valid action: extra workout, history, or undo.

## First production defects to audit in block 2
1. Update path: user cannot reliably tell whether a hotfix was received/applied.
2. After-main extra workout: currently reported as non-clickable.
3. Same-day undo: previously reported as non-clickable.
4. Active workout exit/discard: must be visible and reachable, not injected below a clipped fixed-height container.
5. All `tcStart*` handlers with silent guard returns.
6. Small controls below 48 dp.
7. Dynamic buttons created after render and their event binding.

## Release rule
No production merge from UX work until:
1. every button in the target block is inventoried;
2. handlers are mapped;
3. blocked states have visible reasons;
4. Android WebView smoke test performs real taps through the target scenario;
5. the test ends in the expected user-visible state.
