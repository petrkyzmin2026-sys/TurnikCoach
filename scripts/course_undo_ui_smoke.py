import os
import re
import base64
import json
import subprocess
import time
import xml.etree.ElementTree as ET

PKG=os.environ.get("TC_TEST_PKG","ru.turnikcoach.app.calendarpreview")
OUT=os.environ.get("TC_OUT_DIR",os.environ.get("GITHUB_WORKSPACE",".")+"/undo-ui-test-output")
FONT_SCALE=float(os.environ.get("TC_FONT_SCALE","1.0"))
os.makedirs(OUT,exist_ok=True)

def adb(*args,check=True,timeout=20):
    cmd=["adb",*args]
    try:
        return subprocess.run(cmd,check=check,text=True,capture_output=True,timeout=timeout)
    except subprocess.TimeoutExpired as e:
        if check:
            raise
        return subprocess.CompletedProcess(cmd,124,e.stdout or "",e.stderr or "ADB command timed out")

def dump():
    last=None
    for _ in range(6):
        r=adb("shell","uiautomator","dump","/sdcard/window.xml",check=False,timeout=8)
        if r.returncode==0:
            p=adb("pull","/sdcard/window.xml","/tmp/window.xml",check=False)
            if p.returncode==0:
                try:
                    return ET.parse("/tmp/window.xml").getroot()
                except Exception as e:
                    last=e
        else:
            last=RuntimeError((r.stderr or r.stdout or "").strip())
        time.sleep(1)
    raise RuntimeError("UI dump failed after retries: "+str(last))

def center(bounds):
    nums=[int(x) for x in re.findall(r"\d+",bounds)]
    return ((nums[0]+nums[2])//2,(nums[1]+nums[3])//2)

def find_text(text,contains=True):
    target=text.lower()
    for n in dump().iter("node"):
        value=(n.attrib.get("text") or "")
        ok=(target in value.lower()) if contains else (target==value.lower())
        if ok and n.attrib.get("bounds"):
            return center(n.attrib["bounds"]),value
    return None,None

def wait_text(text,timeout=12,contains=True):
    end=time.time()+timeout
    while time.time()<end:
        # Emulator Quickstep can raise a transient ANR over the WebView at any point,
        # not only immediately after launch. Dismiss it before evaluating app UI.
        try:
            dismiss_system_anr()
        except NameError:
            pass
        pos,value=find_text(text,contains)
        if pos:return pos,value
        time.sleep(.5)
    raise AssertionError("Text not found: "+text)

def tap_text(text,contains=True):
    pos,_=wait_text(text,contains=contains)
    adb("shell","input","tap",str(pos[0]),str(pos[1]))
    time.sleep(.8)

def clickable_text_position(text):
    target=text.lower()
    for n in dump().iter("node"):
        value=(n.attrib.get("content-desc") or n.attrib.get("text") or "")
        bounds=n.attrib.get("bounds") or ""
        if value.lower()!=target or n.attrib.get("clickable")!="true" or not bounds:
            continue
        nums=[int(x) for x in re.findall(r"\d+",bounds)]
        if len(nums)!=4 or nums[2]<=nums[0] or nums[3]<=nums[1]:
            continue
        return center(bounds),bounds
    return None,None

def scroll_clickable_into_view(text,timeout=12):
    # UiAutomator may report a truncated bottom 27px of an actual 128px CTA as
    # a "clickable" button. Require the full touch target above the bottom
    # navigation safe region, not merely a non-empty accessibility node.
    size=adb("shell","wm","size").stdout
    match=re.search(r"(\d+)x(\d+)",size)
    if not match: raise AssertionError("Cannot determine emulator screen size for scroll")
    _,h=map(int,match.groups())
    safe_top=int(h*.13)
    safe_bottom=int(h*.82)
    last_bounds=None
    end=time.time()+timeout
    while time.time()<end:
        dismiss_system_anr()
        pos,bounds=clickable_text_position(text)
        if pos:
            nums=[int(x) for x in re.findall(r"\d+",bounds)]
            top,bottom=nums[1],nums[3]
            if top>=safe_top and bottom<=safe_bottom and bottom-top>=115:
                print("TC_DIAG scroll_target_visible",text,"bounds",bounds,"center",pos,flush=True)
                return pos
            if bounds!=last_bounds:
                print("TC_DIAG scroll_target_clipped",text,"bounds",bounds,
                    "safe",[safe_top,safe_bottom],flush=True)
                last_bounds=bounds
        # Start inside Today's content viewport, away from fixed navigation.
        adb("shell","input","swipe","540","1450","540","650","350",check=False)
        time.sleep(.6)
    raise AssertionError("Clickable text not safely reachable by scrolling: "+text+
        " last bounds="+str(last_bounds))

def tap_clickable_text(text,timeout=12):
    end=time.time()+timeout
    while time.time()<end:
        dismiss_system_anr()
        pos,bounds=clickable_text_position(text)
        if pos:
            print("TC_DIAG tap_clickable_text",text,"bounds",bounds,"center",pos,flush=True)
            adb("shell","input","tap",str(pos[0]),str(pos[1]))
            time.sleep(.8)
            return pos
        time.sleep(.5)
    raise AssertionError("Clickable text not found: "+text)

def press_clickable_text(text,timeout=12):
    target=text.lower()
    end=time.time()+timeout
    while time.time()<end:
        dismiss_system_anr()
        for n in dump().iter("node"):
            value=(n.attrib.get("text") or "")
            if value.lower()!=target or n.attrib.get("clickable")!="true" or not n.attrib.get("bounds"):
                continue
            pos=center(n.attrib["bounds"])
            print("TC_DIAG press_clickable_text",text,"bounds",n.attrib.get("bounds"),"center",pos,flush=True)
            adb("shell","input","touchscreen","swipe",str(pos[0]),str(pos[1]),str(pos[0]),str(pos[1]),"120")
            time.sleep(.8)
            return pos
        time.sleep(.5)
    raise AssertionError("Clickable text not found for press: "+text)

def test_eval(js,label):
    marker="TC_TEST_EVAL_RESULT:"
    wrapped="(function(){try{var __tcv=("+js+");console.log('"+marker+"'+JSON.stringify(__tcv));return __tcv;}catch(e){console.error('TC_TEST_EVAL_ERROR:'+(e&&e.stack||e));throw e;}})()"
    encoded=base64.b64encode(wrapped.encode("utf-8")).decode("ascii")
    adb("shell","run-as",PKG,"rm","-f","files/tc-test-js-result.txt",check=False)
    adb("logcat","-c",check=False)
    sent=adb("shell","am","broadcast","-a","ru.turnikcoach.TEST_EVAL","-p",PKG,"--es","js_b64",encoded,check=False)
    result=""
    deadline=time.time()+6
    output=""
    while time.time()<deadline:
        file_result=adb("shell","run-as",PKG,"cat","files/tc-test-js-result.txt",check=False)
        if file_result.returncode==0 and (file_result.stdout or "").strip():
            result=(file_result.stdout or "").strip()
            break
        log=adb("logcat","-d","-s","TurnikCoachBridge:D","TurnikCoachJSResult:D","TurnikCoachJS:D","*:S",check=False)
        output=(log.stdout or "")+"\n"+(log.stderr or "")
        for line in output.splitlines():
            if marker in line:
                result=line.split(marker,1)[1].split(" @ ",1)[0].strip()
        if result:
            break
        time.sleep(.25)
    print("TC_DIAG JS",label,"start_rc",sent.returncode,"result",result,"log",output[-3000:],flush=True)
    with open(OUT+"/04b-js-"+label+".txt","w",encoding="utf-8") as fp:
        fp.write("start:\n"+(sent.stdout or "")+"\n"+(sent.stderr or "")+"\nresult:\n"+result+"\nlog:\n"+output)
    if sent.returncode!=0:
        raise AssertionError("TEST_EVAL broadcast failed for "+label+": "+(sent.stderr or sent.stdout or ""))
    if not result:
        raise AssertionError("TEST_EVAL returned no WebView console result for "+label)
    return result

def test_exec(js,label):
    encoded=base64.b64encode(("(function(){"+js+"})()").encode("utf-8")).decode("ascii")
    sent=adb("shell","am","broadcast","-a","ru.turnikcoach.TEST_EVAL","-p",PKG,"--es","js_b64",encoded,check=False)
    print("TC_DIAG EXEC",label,"start_rc",sent.returncode,flush=True)
    if sent.returncode!=0:
        raise AssertionError("TEST_EXEC broadcast failed for "+label+": "+(sent.stderr or sent.stdout or ""))
    return True

def test_eval_json(js,label):
    raw=test_eval(js,label)
    try:
        value=json.loads(raw)
        if isinstance(value,str):
            try:
                return json.loads(value)
            except Exception:
                return value
        return value
    except Exception as e:
        raise AssertionError("Invalid TEST_EVAL JSON for "+label+": "+raw+" / "+str(e))

def tap_bottom_nav(slot):
    size=adb("shell","wm","size").stdout
    m=re.search(r"(\d+)x(\d+)",size)
    if not m:
        raise AssertionError("Cannot determine screen size")
    w,h=map(int,m.groups())
    xs={"workout":0.17,"today":0.50,"history":0.83}
    adb("shell","input","tap",str(int(w*xs[slot])),str(int(h*0.91)))
    time.sleep(1)

def tap_visible_text(text,contains=True,attempts=8):
    size=adb("shell","wm","size").stdout
    m=re.search(r"(\d+)x(\d+)",size)
    if not m:
        raise AssertionError("Cannot determine screen size")
    w,h=map(int,m.groups())
    for _ in range(attempts):
        pos,_=find_text(text,contains)
        if pos and int(h*0.08) < pos[1] < int(h*0.86):
            adb("shell","input","tap",str(pos[0]),str(pos[1]))
            time.sleep(.8)
            return
        adb("shell","input","swipe",str(w//2),str(int(h*.76)),str(w//2),str(int(h*.32)),"300")
        time.sleep(.6)
    raise AssertionError("Visible text not reached: "+text)

def screenshot(name):
    remote="/sdcard/"+name+".png"
    adb("shell","screencap","-p",remote)
    adb("pull",remote,OUT+"/"+name+".png")

def assert_touch_target(text,min_dp=48,contains=False):
    density_out=adb("shell","wm","density").stdout
    m=re.search(r"(\d+)",density_out.split("Override density:")[-1])
    if not m:
        raise AssertionError("Cannot determine screen density")
    dpi=int(m.group(1))
    min_px=min_dp*dpi/160.0
    target=text.lower()
    candidates=[]
    for n in dump().iter("node"):
        value=(n.attrib.get("text") or "")
        ok=(target in value.lower()) if contains else (target==value.lower())
        if not ok or not n.attrib.get("bounds"):
            continue
        nums=[int(x) for x in re.findall(r"\d+",n.attrib["bounds"])]
        if len(nums)!=4:
            continue
        w,h=nums[2]-nums[0],nums[3]-nums[1]
        candidates.append((w,h,value,n.attrib["bounds"]))
    if not candidates:
        raise AssertionError("Touch target not found: "+text)
    if not any(w>=min_px and h>=min_px for w,h,_,_ in candidates):
        raise AssertionError("Touch target below %ddp: %s"%(min_dp,candidates))

def assert_accessibility_target(label,min_dp=48):
    density_out=adb("shell","wm","density").stdout
    m=re.search(r"(\d+)",density_out.split("Override density:")[-1])
    if not m:
        raise AssertionError("Cannot determine screen density")
    min_px=min_dp*int(m.group(1))/160.0
    target=label.lower()
    candidates=[]
    for n in dump().iter("node"):
        values=[n.attrib.get("text") or "",n.attrib.get("content-desc") or ""]
        if not any(target==v.lower() for v in values if v):
            continue
        nums=[int(x) for x in re.findall(r"\d+",n.attrib.get("bounds") or "")]
        if len(nums)!=4:
            continue
        w,h=nums[2]-nums[0],nums[3]-nums[1]
        candidates.append((w,h,values,n.attrib.get("bounds")))
    if not candidates:
        raise AssertionError("Accessible touch target not found: "+label)
    if not any(w>=min_px and h>=min_px for w,h,_,_ in candidates):
        raise AssertionError("Accessible touch target below %ddp: %s"%(min_dp,candidates))

def wait_log_tokens(tokens,timeout=12):
    deadline=time.time()+timeout
    last=""
    while time.time()<deadline:
        log=adb("logcat","-d","-s","TurnikCoachJS:D","*:S",check=False)
        last=(log.stdout or "")+"\n"+(log.stderr or "")
        for line in last.splitlines():
            if all(token in line for token in tokens):
                return line
        time.sleep(.4)
    raise AssertionError("Log marker not found: %r\n%s"%(tokens,last[-4000:]))

def dismiss_system_anr():
    # Android emulator can transiently show a launcher/Quickstep ANR over the tested app.
    # Close only the emulator launcher ANR; never hide a TurnikCoach ANR.
    for _ in range(8):
        root=dump()
        title=None
        for n in root.iter("node"):
            value=n.attrib.get("text") or ""
            if "isn't responding" in value.lower():
                title=value
                break
        if not title:
            return
        if "quickstep" in title.lower():
            close=None
            for n in root.iter("node"):
                if n.attrib.get("resource-id")=="android:id/aerr_close" and n.attrib.get("bounds"):
                    close=center(n.attrib["bounds"])
                    break
            if close:
                adb("shell","input","tap",str(close[0]),str(close[1]))
                time.sleep(1.5)
                continue
        wait=None
        for n in root.iter("node"):
            if n.attrib.get("resource-id")=="android:id/aerr_wait" and n.attrib.get("bounds"):
                wait=center(n.attrib["bounds"])
                break
        if wait:
            adb("shell","input","tap",str(wait[0]),str(wait[1]))
            time.sleep(1.5)
            continue
        adb("shell","input","keyevent","4")
        time.sleep(1)

def launch():
    adb("shell","monkey","-p",PKG,"-c","android.intent.category.LAUNCHER","1")
    time.sleep(5)

launch()
dismiss_system_anr()

# Exact update path: packaged 5.14 + cached 5.16.51 is active first; staged 5.16.52 must be offered explicitly.
time.sleep(3)
screenshot("00-before-update-assert")
adb("shell","uiautomator","dump","/sdcard/uxb3-before-update.xml",check=False)
adb("pull","/sdcard/uxb3-before-update.xml",OUT+"/00-before-update.xml",check=False)
try:
    wait_text("Доступно обновление TurnikCoach 5.16.52",timeout=35)
except Exception:
    log=adb("logcat","-d","-t","700",check=False)
    with open(OUT+"/00-logcat.txt","w",encoding="utf-8") as fp:
        fp.write((log.stdout or "")+"\n"+(log.stderr or ""))
    print("TC_DIAG update-prompt-logcat",log.stdout or "",flush=True)
    raise
wait_text("Обновить",contains=False)
screenshot("01-update-offered")

tap_clickable_text("Обновить")
wait_text("TurnikCoach обновлён до 5.16.52",timeout=25)
assert_accessibility_target("План",48)
assert_accessibility_target("Прогресс",48)
screenshot("02-update-installed")
nav_hit=test_eval_json("(function(){var b=document.getElementById('n3'),r=b.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2,h=document.elementFromPoint(x,y),n=document.getElementById('nav');return {rect:{top:r.top,bottom:r.bottom},hit:h&&h.id||h&&h.tagName||'',inNav:!!(h&&n.contains(h)),sheetOpen:!!document.querySelector('#sheet.open')};})()","progress-nav-real-hit-test")
print("TC_DIAG bottom-nav-hit",nav_hit,flush=True)
assert nav_hit["inNav"] and not nav_hit["sheetOpen"], "Progress nav center must not be covered by the Today undo action at large text"

# Progress summary must be available without completing a new workout.
tap_clickable_text("Прогресс",timeout=20)
progress_probe=test_eval_json("(function(){var h=document.getElementById('historyScreen'),n=document.getElementById('tcProgressSummary');return {screen:(document.querySelector('.screen.on')||{}).id||'',hotfix:window.__TC_HOTFIX_ACTIVE_VERSION,history:!!h,scroll:!!(h&&h.querySelector('.scroll')),summary:!!n,text:n&&n.textContent||'',renderHook:typeof window.tcRenderProgressSummary};})()","progress-nav-diagnostic")
print("TC_DIAG progress-nav",progress_probe,flush=True)
screenshot("02a-progress-after-real-tap")
time.sleep(2.5)  # Verify superseded 5.16.38 prompt cannot reopen after the new update.
summary=test_eval_json("(function(){var n=document.getElementById('tcProgressSummary'),r=n&&n.getBoundingClientRect(),p=document.getElementById('tcUpdatePrompt');return {present:!!n,items:n&&n.children.length||0,text:n&&n.textContent||'',first:!!n&&n.parentElement.firstElementChild===n,screen:(document.querySelector('.screen.on')||{}).id||'',visible:!!r&&r.width>0&&r.height>0&&r.top<window.innerHeight,blocked:!!p,labels:n&&[...n.children].map(c=>c.getAttribute('aria-label'))||[]};})()","progress-summary-layout")
print("TC_DIAG progress-summary-verified",summary,flush=True)
assert summary["screen"]=="historyScreen" and summary["present"] and summary["items"]==3 and summary["first"] and summary["visible"], "Progress cards must be rendered and visible at top of Progress"
assert not summary["blocked"], "Obsolete cached update must not cover the Progress screen"
assert summary["labels"] and all(x in "|".join(summary["labels"]) for x in ["За 7 дней","Всего тренировок","MAX подтяг."]), "Progress cards need accessible value labels"
screenshot("02b-progress-summary")
course_stats=test_eval_json("(function(){var w=document.getElementById('tcCourseHistoryWrap'),c=JSON.parse(localStorage.getItem('tc_morozov_course_v1')||'{}'),r=(c.courseRuns||[]).find(x=>x.id===c.activeRunId),h=(c.history||[])[0];return {present:!!w,text:w&&w.textContent||'',runs:(c.courseRuns||[]).length,active:c.activeRunId||'',baseline:r&&r.baselinePullMax,historyRun:h&&h.runId||''};})()","morozov-course-stats")
print("TC_DIAG morozov-course-stats",course_stats,flush=True)
stats_text=course_stats["text"].lower()
assert course_stats["present"] and "курс морозова" in stats_text and "выполнение курса" in stats_text and "вовремя" in stats_text and "пропущено" in stats_text, "Progress must show compact Morozov course statistics"
assert course_stats["runs"]>=1 and course_stats["active"] and course_stats["historyRun"]==course_stats["active"] and course_stats["baseline"]==20, "5.16.52 must preserve the seeded active course run and history"
screenshot("02c-morozov-course-stats")
core_probe=test_eval_json("(function(){var c=window.TurnikCore&&TurnikCore.debug?TurnikCore.debug():null;var d=window.TurnikDomain&&TurnikDomain.debug?TurnikDomain.debug():null;var u=window.TurnikUI&&TurnikUI.debug?TurnikUI.debug():null;var st=window.TurnikWorkoutStore&&TurnikWorkoutStore.debug?TurnikWorkoutStore.debug():null;var ss=window.TurnikWorkoutStore&&TurnikWorkoutStore.summary?TurnikWorkoutStore.summary({now:Date.now()}):null;var f=window.__TC_CORE_FOUNDATION||null;var dc=localStorage.getItem('tc_module_domain_1.0.0')||'',uc=localStorage.getItem('tc_module_ui_1.0.0')||'',sc=localStorage.getItem('tc_module_store_1.2.0-undo-restore')||'',cc=localStorage.getItem('tc_module_course_1.0.41-control-transactions')||'';var v=typeof window.tcGetCourseViewState==='function'?window.tcGetCourseViewState():null;return {core:c,domain:d,ui:u,store:st,storeSummary:ss,foundation:f,domainCache:dc.length,uiCache:uc.length,storeCache:sc.length,courseCache:cc.length,today:v&&v.today&&v.today.kind||'',plan:v&&v.plan&&v.plan.kind||'',progress:v&&v.progress&&v.progress.kind||'',active:window.__TC_HOTFIX_ACTIVE_VERSION};})()","unified-workout-store")
print("TC_DIAG unified-workout-store",core_probe,flush=True)
assert core_probe["core"] and core_probe["core"]["version"]=="1.0.0", "TurnikCore must be active in the real WebView"
assert sorted(core_probe["core"]["sources"])==["course","generic"], "TurnikCore must register both state sources"
assert core_probe["domain"] and core_probe["domain"]["version"]=="1.0.0", "TurnikDomain must be active in the real WebView"
assert core_probe["ui"] and core_probe["ui"]["version"]=="1.0.0" and core_probe["ui"]["installed"] is True, "TurnikUI must be active and installed in the real WebView"
assert set(core_probe["ui"]["areas"].keys())=={"today","plan","progress"}, "TurnikUI must own Today / Plan / Progress presenter areas"
assert any(x["name"]=="*" for x in core_probe["ui"]["areas"]["today"]) and any(x["name"]=="*" for x in core_probe["ui"]["areas"]["plan"]) and any(x["name"]=="*" for x in core_probe["ui"]["areas"]["progress"]), "post-render work must be registered inside TurnikUI instead of wrapping global render functions"
assert any(x["name"]=="morozov" for x in core_probe["domain"]["areas"]["today"]), "Morozov Today resolver must be registered"
assert core_probe["store"] and core_probe["store"]["version"]=="1.2.0-undo-restore", "TurnikWorkoutStore must be active in the real WebView"
assert core_probe["store"].get("writePath") is True, "WorkoutStore write path must be active in the real WebView"
assert core_probe["storeSummary"] and core_probe["storeSummary"]["total"]>=1 and core_probe["storeSummary"]["bySource"].get("course",0)>=1, "WorkoutStore must expose the seeded course workout through the unified read model"
assert core_probe["foundation"] and core_probe["foundation"]["domainModule"]=="1.0.0" and core_probe["foundation"]["uiModule"]=="1.0.0" and core_probe["foundation"]["storeModule"]=="1.2.0-undo-restore" and core_probe["foundation"]["courseModule"]=="1.0.41-control-transactions", "runtime diagnostics must expose compatible Core/Domain/UI/Store/Course versions"
assert core_probe["domainCache"]>500 and core_probe["storeCache"]>500 and core_probe["courseCache"]>1000, "Domain, Store and Course modules must survive in separate offline caches"
assert core_probe["today"]=="COURSE_DONE" and core_probe["plan"]=="COURSE_ACTIVE" and core_probe["progress"]=="COURSE_PROGRESS", "view state must be resolved before rendering"
assert core_probe["uiCache"]>500, "UI presenter must survive in the offline module cache"
assert core_probe["active"]=="5.16.52-deterministic-decorators", "5.16.52 must be the active OTA shell"
observer_probe=test_eval_json("(function(){return {product:!!window.__tcProductObserver,infoToday:!!document.querySelector('#today .tcInfoBtn')};})()","deterministic-decorators")
print("TC_DIAG deterministic-decorators",observer_probe,flush=True)
assert not observer_probe["product"], "5.16.52 must disconnect the legacy global product MutationObserver"
assert core_probe["store"] and core_probe["store"]["writePath"] is True, "transactional WorkoutStore write path must remain active"
assert core_probe["foundation"] and core_probe["foundation"].get("courseModule")=="1.0.41-control-transactions", "5.16.52 must load the transactional course-control module"
screenshot("02d-unified-workout-store")
tap_clickable_text("Сегодня",timeout=20)


# Main course is already saved by the seeded user state; extra workout must still be available.
wait_text("Основной комплекс выполнен",timeout=20)
wait_text("Начать дополнительную тренировку",timeout=12)
screenshot("03-main-done-extra-available")

adb("logcat","-c",check=False)
if FONT_SCALE>=1.8:
    try:
        before=test_eval("(function(){var e=document.getElementById('todayList');var b=document.getElementById('tcStartExtraAfterCourseBtn');return {scrollTop:e&&e.scrollTop||0,clientHeight:e&&e.clientHeight||0,scrollHeight:e&&e.scrollHeight||0,buttonTop:b&&b.getBoundingClientRect().top||0,buttonBottom:b&&b.getBoundingClientRect().bottom||0};})()","font200-today-scroll-before")
        print("TC_DIAG font200-scroll-before",before,flush=True)
    except Exception as e:
        print("TC_DIAG font200-scroll-before-error",e,flush=True)
    try:
        scroll_clickable_into_view("Начать дополнительную тренировку",timeout=30)
    except Exception as e:
        after_swipe=test_eval("(function(){var e=document.getElementById('todayList');var b=document.getElementById('tcStartExtraAfterCourseBtn');return {scrollTop:e&&e.scrollTop||0,clientHeight:e&&e.clientHeight||0,scrollHeight:e&&e.scrollHeight||0,buttonTop:b&&b.getBoundingClientRect().top||0,buttonBottom:b&&b.getBoundingClientRect().bottom||0};})()","font200-today-scroll-after-swipe")
        print("TC_DIAG font200-scroll-after-swipe",after_swipe,flush=True)
        raise
    screenshot("03b-main-done-extra-scrolled")
# Capture real pointer/touch ordering in the isolated test app. No test-only
# listener calls application actions.
test_exec("""if(!window.__tcGestureTraceInstalled){
  window.__tcGestureTraceInstalled=true;
  ['pointerdown','pointerup','touchend','click'].forEach(function(name){
    document.addEventListener(name,function(ev){
      var el=ev.target&&ev.target.closest&&ev.target.closest('#tcStartExtraAfterCourseBtn,#workout button');
      if(el)console.log('TC_GESTURE',JSON.stringify({type:name,id:el.id,text:(el.textContent||'').trim().slice(0,45),at:Date.now(),screen:(document.querySelector('.screen.on')||{}).id}));
    },true);
  });
  var original=window.setDone;
  if(typeof original==='function')window.setDone=function(skip){
    console.log('TC_GESTURE',JSON.stringify({type:'setDone',skip:!!skip,at:Date.now(),screen:(document.querySelector('.screen.on')||{}).id}));
    return original.apply(this,arguments);
  };
}""","gesture-start-trace")
tap_clickable_text("Начать дополнительную тренировку")
gesture_trace=adb("logcat","-d","-s","TurnikCoachJS:D","*:S",check=False)
for gesture_line in (gesture_trace.stdout or "").splitlines():
    if "TC_GESTURE" in gesture_line: print("TC_DIAG gesture",gesture_line,flush=True)
early=test_eval_json("(function(){return {hasW:!!W,mode:W&&W.mode||null,setIndex:W&&W.setIndex,firstActual:(W&&W.items&&W.items[0]&&W.items[0].actual[0])??null,screen:(document.querySelector('.screen.on')||{}).id||''};})()","start-must-not-record-first-set")
print("TC_DIAG start-first-set",early,flush=True)
assert early["hasW"] and early["mode"]=="extra" and early["setIndex"]==0 and early["firstActual"] is None and early["screen"]=="workout", "Starting extra workout must not advance or record a set without Done"
screenshot("04a-after-extra-start-tap")
adb("shell","uiautomator","dump","/sdcard/ux2-after-start-tap.xml",check=False)
adb("pull","/sdcard/ux2-after-start-tap.xml",OUT+"/04a-after-extra-start-tap.xml",check=False)
after_tap_log=adb("logcat","-d","-t","400",check=False)
with open(OUT+"/04a-after-extra-start-logcat.txt","w",encoding="utf-8") as fp:
    fp.write((after_tap_log.stdout or "")+"\n"+(after_tap_log.stderr or ""))

# Capture the actual Android surface after the WebView has had time to composite the new screen.
time.sleep(2)
settled=test_eval_json("(function(){return {hasW:!!W,mode:W&&W.mode||null,setIndex:W&&W.setIndex,firstActual:(W&&W.items&&W.items[0]&&W.items[0].actual[0])??null,screen:(document.querySelector('.screen.on')||{}).id||''};})()","settled-first-set")
print("TC_DIAG settled-first-set",settled,flush=True)
assert settled["hasW"] and settled["mode"]=="extra" and settled["setIndex"]==0 and settled["firstActual"] is None and settled["screen"]=="workout", "Extra workout must remain on its first set after starting"
screenshot("04b-extra-start-settled")
adb("shell","uiautomator","dump","/sdcard/ux2-after-start-settled.xml",check=False)
adb("pull","/sdcard/ux2-after-start-settled.xml",OUT+"/04b-extra-start-settled.xml",check=False)
settled_log=adb("logcat","-d","-t","700",check=False)
with open(OUT+"/04b-extra-start-settled-logcat.txt","w",encoding="utf-8") as fp:
    fp.write((settled_log.stdout or "")+"\n"+(settled_log.stderr or ""))

# The stronger before/after launch assertions above use the test bridge,
# which clears logcat before evaluation. Validate persistence directly rather
# than relying on a snapshot log line that was correctly rotated away.
snapshot_state=test_eval_json("(function(){var s=JSON.parse(localStorage.getItem('tc_active_workout_v2')||'null');var w=s&&s.workout;var i=w&&w.items&&w.items[w.exerciseIndex];return {schema:s&&s.schema,screen:s&&s.screen,mode:w&&w.mode,setIndex:w&&w.setIndex,name:i&&i.e&&i.e.name};})()","extra-start-persisted-snapshot")
print("TC_DIAG persisted-snapshot",snapshot_state,flush=True)
assert snapshot_state["schema"]==2 and snapshot_state["screen"]=="workout" and snapshot_state["mode"]=="extra" and snapshot_state["setIndex"]==0 and snapshot_state["name"]=="Подъём коленей в висе", "Initial extra workout must persist its untouched first set"

# Android-specific durability check: process death must restore the same active workout.
adb("logcat","-c",check=False)
adb("shell","am","force-stop",PKG)
time.sleep(1)
launch()
dismiss_system_anr()
upgrade_install=wait_log_tokens(["TC_NAV_UPGRADE",'"phase":"install"','"version":"5.16.52-deterministic-decorators"'],timeout=20)
restore_line=wait_log_tokens(["TC_WORKOUT_STATE",'"phase":"restored"','"name":"Подъём коленей в висе"','"mode":"extra"'],timeout=20)
upgrade_arm=wait_log_tokens(["TC_NAV_UPGRADE",'"phase":"arm-restore-guard"','"version":"5.16.52-deterministic-decorators"','"surface":"workout"'],timeout=20)
print("TC_DIAG nav-upgrade-install",upgrade_install,flush=True)
print("TC_DIAG restore",restore_line,flush=True)
print("TC_DIAG nav-upgrade-arm",upgrade_arm,flush=True)
time.sleep(1.2)
screenshot("05a-process-death-restore-preassert")
adb("shell","uiautomator","dump","/sdcard/ux2-restore-preassert.xml",check=False)
adb("pull","/sdcard/ux2-restore-preassert.xml",OUT+"/05a-process-death-restore-preassert.xml",check=False)
# Preserve the 1.2 s user-visible screenshot, then wait long enough to collect all
# runtime restore snapshots (0/250/750/1500/3000 ms) before the UI assertion.
time.sleep(2.1)
restore_diag=adb("logcat","-d","-s","TurnikCoachNative:D","TurnikCoachJS:D","*:S",check=False)
restore_diag_text=(restore_diag.stdout or "")+"\n"+(restore_diag.stderr or "")
with open(OUT+"/05a-process-death-restore-logcat.txt","w",encoding="utf-8") as fp:
    fp.write(restore_diag_text)
for line in restore_diag_text.splitlines():
    if "TC_RESTORE_SURFACE" in line:
        print("TC_DIAG restore-surface",line,flush=True)
    elif "TurnikCoachNative" in line:
        print("TC_DIAG restore-native",line,flush=True)

full_restore_log=adb("logcat","-d","-t","1800",check=False)
full_restore_text=(full_restore_log.stdout or "")+"\n"+(full_restore_log.stderr or "")
with open(OUT+"/05a-process-death-full-logcat.txt","w",encoding="utf-8") as fp:
    fp.write(full_restore_text)
for line in full_restore_text.splitlines():
    low=line.lower()
    if ("chromium" in low or "webview" in low or "renderprocess" in low or
        "renderer" in low or "fatal exception" in low or "anr" in low or
        "crash" in low or "signal 6" in low or "signal 11" in low):
        print("TC_DIAG webview-system",line,flush=True)

wait_text("Сделано",timeout=12,contains=False)
wait_text("Выйти",timeout=12,contains=False)
assert_touch_target("Сделано",48,contains=False)
assert_touch_target("Выйти",48,contains=False)
top_actions=test_eval_json("(function(){var w=document.querySelector('#workout.screen.on'),bar=w&&w.querySelector('.tcTrainingTopActions'),b=bar&&bar.querySelector('.tcWorkoutBackBtn'),e=bar&&bar.querySelector('.tcWorkoutExitBtn'),rb=b&&b.getBoundingClientRect(),re=e&&e.getBoundingClientRect(),rw=w&&w.getBoundingClientRect();return {bar:!!bar,buttons:bar&&[...bar.querySelectorAll('button')].map(x=>x.textContent.trim())||[],backDisabled:b&&b.disabled,exit:!!e,backLeft:!!rb&&!!rw&&rb.left-rw.left<32,exitRight:!!re&&!!rw&&rw.right-re.right<32,otherBack:w&&w.querySelectorAll('.tcCorrectionSetBtn').length||0,oldFinishVisible:[...w.querySelectorAll('.endBtn')].some(x=>getComputedStyle(x).display!=='none')};})()","workout-top-back-exit-actions")
assert top_actions["bar"] and top_actions["buttons"]==["← Назад","Выйти"] and top_actions["backDisabled"] and top_actions["exit"] and top_actions["backLeft"] and top_actions["exitRight"] and not top_actions["otherBack"] and not top_actions["oldFinishVisible"], "Workout header must place Back at top-left and Exit at top-right, with Back disabled until a previous set exists"
screenshot("05-process-death-restored")

# User-visible correction path: Done must be reversible without saving history.
first_before=test_eval_json("(function(){return {ex:W.exerciseIndex,set:W.setIndex,input:W.actual,trail:W.__tcCorrectionTrail&&W.__tcCorrectionTrail.length||0};})()","before-done-correction")
tap_clickable_text("Сделано",timeout=18)
time.sleep(0.7)
done_state=test_eval_json("(function(){return {ex:W.exerciseIndex,set:W.setIndex,recorded:W.items[0].actual[0],trail:W.__tcCorrectionTrail&&W.__tcCorrectionTrail.length||0,screen:(document.querySelector('.screen.on')||{}).id};})()","done-before-correction")
assert done_state["recorded"]==first_before["input"] and done_state["trail"]==1, "Done must record one reversible set"
rest_probe=test_eval_json("(function(){var r=document.querySelector('#rest.screen.on .rest'),p=r&&r.querySelector('.tcRestBack');return {rest:!!r,back:!!p,text:p&&p.textContent||'',rect:p&&{top:p.getBoundingClientRect().top,bottom:p.getBoundingClientRect().bottom,left:p.getBoundingClientRect().left,right:p.getBoundingClientRect().right},display:p&&getComputedStyle(p).display,buttons:[...document.querySelectorAll('#rest button')].map(b=>({text:b.textContent,display:getComputedStyle(b).display})),hotfix:window.__TC_HOTFIX_ACTIVE_VERSION};})()","rest-undo-layout")
print("TC_DIAG rest-correction-layout",rest_probe,flush=True)
rest_buttons=test_eval_json("(function(){var r=document.querySelector('#rest.screen.on .rest'),q=s=>r.querySelector(s),b=q('.tcRestBack'),f=q('.tcRestExitBtn'),i=q('.tcInfoBtn'),rect=x=>{var a=x&&x.getBoundingClientRect();return a&&{l:a.left,r:a.right,t:a.top,b:a.bottom,w:a.width,h:a.height}},hit=x=>{if(!x)return false;var a=x.getBoundingClientRect(),v=document.elementFromPoint((a.left+a.right)/2,(a.top+a.bottom)/2);return v===x||x.contains(v)},overlap=(a,b)=>a&&b&&a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t;var x=rect(b),y=rect(f),w=rect(i);return {back:x,finish:y,info:w,backHit:hit(b),finishHit:hit(f),infoHit:hit(i),intersects:overlap(x,y)||overlap(x,w)||overlap(y,w)};})()","rest-navigation-real-hit-test")
assert rest_buttons["back"] and rest_buttons["finish"] and rest_buttons["info"] and rest_buttons["backHit"] and rest_buttons["finishHit"] and rest_buttons["infoHit"] and not rest_buttons["intersects"], "Rest Back, Finish and Info must all be directly hittable with no overlap"

screenshot("05b-rest-layout")
tap_clickable_text("Назад",timeout=18)
back_state=test_eval_json("(function(){return {ex:W.exerciseIndex,set:W.setIndex,input:W.actual,recorded:W.items[0].actual[0]===undefined?null:W.items[0].actual[0],trail:W.__tcCorrectionTrail&&W.__tcCorrectionTrail.length||0,screen:(document.querySelector('.screen.on')||{}).id};})()","after-done-correction")
assert back_state["ex"]==first_before["ex"] and back_state["set"]==first_before["set"] and back_state["input"]==first_before["input"] and back_state["recorded"] is None and back_state["trail"]==0 and back_state["screen"]=="workout", "Done correction must restore editable set and remove its recorded result"
screenshot("05b-done-corrected")

# An accidental Skip must also be reversible.
tap_text("Пропустить",contains=True)
time.sleep(0.7)
skip_state=test_eval_json("(function(){return {skipped:W.items[0].actual[0]===null,trail:W.__tcCorrectionTrail&&W.__tcCorrectionTrail.length||0,screen:(document.querySelector('.screen.on')||{}).id};})()","skip-before-correction")
assert skip_state["skipped"] and skip_state["trail"]==1, "Skipped set must be reversible"
tap_clickable_text("Назад",timeout=18)
unskip_state=test_eval_json("(function(){return {set:W.setIndex,recorded:W.items[0].actual[0]===undefined?null:W.items[0].actual[0],trail:W.__tcCorrectionTrail&&W.__tcCorrectionTrail.length||0,screen:(document.querySelector('.screen.on')||{}).id,snapshot:JSON.parse(localStorage.getItem('tc_active_workout_v2')||'null')};})()","after-skip-correction")
assert unskip_state["set"]==0 and unskip_state["recorded"] is None and unskip_state["trail"]==0 and unskip_state["screen"]=="workout", "Skip correction must restore the same editable set"
assert unskip_state["snapshot"] and unskip_state["snapshot"]["workout"]["setIndex"]==0, "Correction must persist the restored approach"
screenshot("05c-skip-corrected")

# Exit is the top-right action and requires exactly one destructive confirmation.
test_exec("var d=document.getElementById('tcTestDriver');if(d)d.remove();","remove-test-overlay")
tap_clickable_text("Выйти",timeout=18)
wait_text("Завершить без сохранения?",timeout=18,contains=False)
confirmation=test_eval_json("(function(){return {open:!!document.querySelector('#sheet.open'),hasW:!!W,confirm:!!document.getElementById('tcConfirmDiscardWorkoutBtn'),finishMenu:!!document.getElementById('tcFinishDiscardBtn')};})()","top-exit-confirmation")
assert confirmation["open"] and confirmation["hasW"] and confirmation["confirm"] and not confirmation["finishMenu"], "One tap on top-right Exit must open the single discard confirmation without an intermediate Finish menu"
screenshot("06-exit-single-confirmation")
tap_clickable_text("Продолжить тренировку",timeout=18)
cancel=test_eval_json("(function(){return {hasW:!!W,workoutOn:!!document.querySelector('#workout.screen.on'),sheetOpen:!!document.querySelector('#sheet.open')};})()","exit-cancel")
assert cancel["hasW"] and cancel["workoutOn"] and not cancel["sheetOpen"], "Cancel must resume the existing workout"
tap_clickable_text("Выйти",timeout=18)
tap_clickable_text("Завершить без сохранения",timeout=18)
time.sleep(1.5)
after_exit=test_eval_json("(function(){var t=document.getElementById('today'),w=document.getElementById('workout');return {hasW:!!W,todayOn:t.classList.contains('on'),todayHidden:t.hidden,todayDisplay:getComputedStyle(t).display,todayHeight:t.getBoundingClientRect().height,workoutOn:w.classList.contains('on'),workoutHidden:w.hidden,sheetOpen:!!document.querySelector('#sheet.open'),snapshot:localStorage.getItem('tc_active_workout_v2'),route:history.state&&history.state.tcScreen,extraSeq:JSON.parse(localStorage.getItem('tc_morozov_course_v1')||'{}').extraSeq};})()","exit-discard")
print("TC_DIAG exit-discard",after_exit,flush=True)
assert not after_exit["hasW"] and after_exit["todayOn"] and not after_exit["todayHidden"] and after_exit["todayDisplay"]=="flex" and after_exit["todayHeight"]>0, "Discard must visibly return to Today"
assert not after_exit["workoutOn"] and after_exit["workoutHidden"] and not after_exit["sheetOpen"], "Workout and confirmation must be hidden after discard"
assert after_exit["snapshot"] is None and after_exit["route"]=="today" and after_exit["extraSeq"]==0, "Discard must not persist an unfinished workout or advance extra sequence"
screenshot("07-exit-returns-to-today")
# The cached previous hotfix may have a deferred prompt timer that fires
# 1.5s after W is cleared. It must not resurrect an obsolete update overlay.
time.sleep(2.6)
prompt_after_exit=test_eval_json("(function(){var p=document.getElementById('tcUpdatePrompt');return {present:!!p,text:p&&p.innerText.slice(0,100)||'',active:window.__TC_HOTFIX_ACTIVE_VERSION,legacyDismissed:window.__TC_UPDATE_DISMISSED_VERSION};})()","exit-no-stale-update")
print("TC_DIAG exit-no-stale-update",prompt_after_exit,flush=True)
assert not prompt_after_exit["present"], "A cached older hotfix must not reopen its update prompt after discard"
wait_text("Начать дополнительную тренировку",timeout=18)
if FONT_SCALE>=1.8:
    scroll_clickable_into_view("Начать дополнительную тренировку",timeout=30)
    hit=test_eval_json("(function(){var b=document.getElementById('tcStartExtraAfterCourseBtn');var r=b&&b.getBoundingClientRect();var x=r&&(r.left+r.right)/2,y=r&&(r.top+r.bottom)/2;var el=r&&document.elementFromPoint(x,y);return {rect:r&&{top:r.top,bottom:r.bottom,left:r.left,right:r.right},hit:el&&el.outerHTML.slice(0,250),expected:b&&b.outerHTML.slice(0,200),scrollTop:document.getElementById('todayList').scrollTop,screen:(document.querySelector('.screen.on')||{}).id};})()","restart-hit-test")
    print("TC_DIAG restart-hit-test",hit,flush=True)
    screenshot("07b-restart-scroll-position")
tap_clickable_text("Начать дополнительную тренировку",timeout=20)
screenshot("07c-after-restart-tap")
tap_state=test_eval_json("(function(){return {hasW:!!W,mode:W&&W.mode||null,screen:(document.querySelector('.screen.on')||{}).id||'',todayDisplay:getComputedStyle(document.getElementById('today')).display,workoutDisplay:getComputedStyle(document.getElementById('workout')).display};})()","restart-immediate-state")
print("TC_DIAG restart-immediate-state",tap_state,flush=True)
assert tap_state["hasW"] and tap_state["mode"]=="extra" and tap_state["screen"]=="workout" and tap_state["workoutDisplay"]=="flex", "Restart button must create and visibly navigate to the extra workout"
wait_text("Сделано",timeout=18,contains=False)
restarted=test_eval_json("(function(){return {hasW:!!W,mode:W&&W.mode||null,workoutOn:!!document.querySelector('#workout.screen.on')};})()","exit-restart")
assert restarted["hasW"] and restarted["mode"]=="extra" and restarted["workoutOn"], "Discarded extra workout must remain immediately restartable"
screenshot("08-restart-after-discard")
# Complete the restarted extra workout through the real finish path. This must commit
# course extraSeq + generic history as one WorkoutStore batch.
test_exec("""(function(){
if(!W||!Array.isArray(W.items))throw new Error('no active workout');
W.items.forEach(function(x){x.actual=Array.isArray(x.plan)?x.plan.slice():[];});
W.exerciseIndex=Math.max(0,W.items.length-1);
W.setIndex=Math.max(0,(W.items[W.exerciseIndex].plan||[]).length-1);
W.actual=(W.items[W.exerciseIndex].plan||[])[W.setIndex]||0;
window.finishWorkout('Нормально');
})();""","complete-extra-through-real-finish")
wait_text("Дополнительная тренировка завершена",timeout=18)
write_probe=test_eval_json("(function(){var c=JSON.parse(localStorage.getItem('tc_morozov_course_v1')||'{}'),g=JSON.parse(localStorage.getItem('tc_v4')||'{}'),st=window.TurnikWorkoutStore&&TurnikWorkoutStore.debug?TurnikWorkoutStore.debug():null,gs=window.TurnikCore&&TurnikCore.sourceSnapshot?TurnikCore.sourceSnapshot('generic'):null,raw=(g.history||[]).find(x=>x&&x.courseMode==='extra'&&x.type==='workout'),mem=(gs&&gs.history||[]).find(x=>x&&x.courseMode==='extra'&&x.type==='workout');return {extraSeq:c.extraSeq||0,persisted:!!raw,memory:!!mem,genericCount:(g.history||[]).length,store:st};})()","workout-store-write")
print("TC_DIAG workout-store-write",write_probe,flush=True)
assert write_probe["extraSeq"]==1 and write_probe["memory"] and write_probe["persisted"], "extra workout must commit both source mutations and persist generic history"
assert write_probe["store"] and write_probe["store"].get("writePath") is True and "generic" in write_probe["store"].get("sources",[]), "real completion must run with transactional WorkoutStore"
screenshot("09-extra-completed-through-store")
tap_clickable_text("Отменить сохранение",timeout=18)
time.sleep(1)
undo_write=test_eval_json("(function(){var c=JSON.parse(localStorage.getItem('tc_morozov_course_v1')||'{}'),g=JSON.parse(localStorage.getItem('tc_v4')||'{}');return {extraSeq:c.extraSeq||0,extra:(g.history||[]).some(x=>x&&x.courseMode==='extra'&&x.type==='workout')};})()","workout-store-write-undo")
assert undo_write["extraSeq"]==0 and not undo_write["extra"], "completion undo must restore both sources after transactional save"
print("UX2_UNIFIED_WRITE_PATH_OK")
print("UX2_EXIT_WITHOUT_SAVE_OK")
print("UX2_ACCESSIBILITY_SCALE_BASELINE_OK")
