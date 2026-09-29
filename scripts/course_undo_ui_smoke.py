import os
import re
import base64
import json
import subprocess
import time
import xml.etree.ElementTree as ET

PKG=os.environ.get("TC_TEST_PKG","ru.turnikcoach.app.calendarpreview")
OUT=os.environ.get("GITHUB_WORKSPACE",".")+"/undo-ui-test-output"
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

def tap_clickable_text(text,timeout=12):
    target=text.lower()
    end=time.time()+timeout
    while time.time()<end:
        dismiss_system_anr()
        for n in dump().iter("node"):
            value=(n.attrib.get("text") or "")
            if value.lower()!=target or n.attrib.get("clickable")!="true" or not n.attrib.get("bounds"):
                continue
            pos=center(n.attrib["bounds"])
            print("TC_DIAG tap_clickable_text",text,"bounds",n.attrib.get("bounds"),"center",pos,flush=True)
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

# Exact update path: packaged 5.14 + cached 5.16.32 are active first; staged 5.16.33 must be offered explicitly.
time.sleep(3)
screenshot("00-before-update-assert")
adb("shell","uiautomator","dump","/sdcard/uxb3-before-update.xml",check=False)
adb("pull","/sdcard/uxb3-before-update.xml",OUT+"/00-before-update.xml",check=False)
try:
    wait_text("Доступно обновление TurnikCoach 5.16.33",timeout=20)
except Exception:
    log=adb("logcat","-d","-t","500",check=False)
    with open(OUT+"/00-logcat.txt","w",encoding="utf-8") as fp:
        fp.write((log.stdout or "")+"\n"+(log.stderr or ""))
    raise
wait_text("Обновить",contains=False)
screenshot("01-update-offered")

tap_clickable_text("Обновить")
wait_text("TurnikCoach обновлён до 5.16.33",timeout=25)
assert_accessibility_target("План",48)
assert_accessibility_target("Прогресс",48)
screenshot("02-update-installed")

# Main course is already saved by the seeded user state; extra workout must still be available.
wait_text("Основной комплекс выполнен",timeout=20)
wait_text("Начать дополнительную тренировку",timeout=12)
screenshot("03-main-done-extra-available")

adb("logcat","-c",check=False)
tap_clickable_text("Начать дополнительную тренировку")
screenshot("04a-after-extra-start-tap")
adb("shell","uiautomator","dump","/sdcard/ux2-after-start-tap.xml",check=False)
adb("pull","/sdcard/ux2-after-start-tap.xml",OUT+"/04a-after-extra-start-tap.xml",check=False)
after_tap_log=adb("logcat","-d","-t","400",check=False)
with open(OUT+"/04a-after-extra-start-logcat.txt","w",encoding="utf-8") as fp:
    fp.write((after_tap_log.stdout or "")+"\n"+(after_tap_log.stderr or ""))

# Capture the actual Android surface after the WebView has had time to composite the new screen.
time.sleep(2)
screenshot("04b-extra-start-settled")
adb("shell","uiautomator","dump","/sdcard/ux2-after-start-settled.xml",check=False)
adb("pull","/sdcard/ux2-after-start-settled.xml",OUT+"/04b-extra-start-settled.xml",check=False)
settled_log=adb("logcat","-d","-t","700",check=False)
with open(OUT+"/04b-extra-start-settled-logcat.txt","w",encoding="utf-8") as fp:
    fp.write((settled_log.stdout or "")+"\n"+(settled_log.stderr or ""))

# Headless Android WebView can expose a stale accessibility/surface frame after a dynamic screen switch.
# Verify the actual application state using runtime markers emitted by the same WebView execution path.
snapshot_line=wait_log_tokens(["TC_WORKOUT_STATE",'"phase":"snapshot-saved"','"screen":"workout"','"mode":"extra"','"name":"Подъём коленей в висе"'],timeout=10)
print("TC_DIAG snapshot",snapshot_line,flush=True)

# Android-specific durability check: process death must restore the same active workout.
adb("logcat","-c",check=False)
adb("shell","am","force-stop",PKG)
time.sleep(1)
launch()
dismiss_system_anr()
restore_line=wait_log_tokens(["TC_WORKOUT_STATE",'"phase":"restored"','"name":"Подъём коленей в висе"','"mode":"extra"'],timeout=20)
print("TC_DIAG restore",restore_line,flush=True)
time.sleep(1.2)
screenshot("05a-process-death-restore-preassert")
adb("shell","uiautomator","dump","/sdcard/ux2-restore-preassert.xml",check=False)
adb("pull","/sdcard/ux2-restore-preassert.xml",OUT+"/05a-process-death-restore-preassert.xml",check=False)
post_restore=test_eval_json("""({
  active:[...document.querySelectorAll('.screen.on')].map(function(el){return el.id}),
  todayDisplay:getComputedStyle(document.getElementById('today')).display,
  workoutDisplay:getComputedStyle(document.getElementById('workout')).display,
  todayHidden:document.getElementById('today').hidden,
  workoutHidden:document.getElementById('workout').hidden,
  hasW:(typeof W!=='undefined'&&!!W),
  mode:(typeof W!=='undefined'&&W)?String(W.mode||''):'',
  done:!![...document.querySelectorAll('#workout button')].find(function(b){return (b.textContent||'').trim()==='Сделано'}),
  exit:!!document.querySelector('#workout .tcWorkoutExitBtn')
})""","post-restore-dom")
print("TC_DIAG post-restore-dom",post_restore,flush=True)
wait_text("Сделано",timeout=12,contains=False)
wait_text("Выйти",timeout=12,contains=False)
assert_touch_target("Сделано",48,contains=False)
assert_touch_target("Выйти",48,contains=False)
screenshot("05-process-death-restored")

print("UX2_ACCESSIBILITY_SCALE_BASELINE_OK")
