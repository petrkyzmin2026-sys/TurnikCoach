import os
import re
import subprocess
import time
import xml.etree.ElementTree as ET

PKG=os.environ.get("TC_TEST_PKG","ru.turnikcoach.app.calendarpreview")
OUT=os.environ.get("GITHUB_WORKSPACE",".")+"/undo-ui-test-output"
os.makedirs(OUT,exist_ok=True)

def adb(*args,check=True):
    return subprocess.run(["adb",*args],check=check,text=True,capture_output=True)

def dump():
    last=None
    for _ in range(6):
        r=adb("shell","uiautomator","dump","/sdcard/window.xml",check=False)
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
        pos,value=find_text(text,contains)
        if pos:return pos,value
        time.sleep(.5)
    raise AssertionError("Text not found: "+text)

def tap_text(text,contains=True):
    pos,_=wait_text(text,contains=contains)
    adb("shell","input","tap",str(pos[0]),str(pos[1]))
    time.sleep(.8)

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

def dismiss_system_anr():
    # Android emulator can transiently show a launcher/Quickstep ANR over the tested app.
    # It is unrelated to the WebView and blocks UIAutomator from seeing underlying app text.
    for _ in range(4):
        _,value=find_text("isn't responding")
        if value:
            pos,_=find_text("Wait",contains=False)
            if pos:
                adb("shell","input","tap",str(pos[0]),str(pos[1]))
                time.sleep(2)
                continue
            adb("shell","input","keyevent","4")
            time.sleep(1)
        break

def launch():
    adb("shell","monkey","-p",PKG,"-c","android.intent.category.LAUNCHER","1")
    time.sleep(5)

launch()
dismiss_system_anr()

# Exact update path: packaged 5.14 + cached 5.16.29 are active first; staged 5.16.30 must be offered explicitly.
time.sleep(3)
screenshot("00-before-update-assert")
adb("shell","uiautomator","dump","/sdcard/uxb3-before-update.xml",check=False)
adb("pull","/sdcard/uxb3-before-update.xml",OUT+"/00-before-update.xml",check=False)
try:
    wait_text("Доступно обновление TurnikCoach 5.16.30",timeout=20)
except Exception:
    log=adb("logcat","-d","-t","500",check=False)
    with open(OUT+"/00-logcat.txt","w",encoding="utf-8") as fp:
        fp.write((log.stdout or "")+"\n"+(log.stderr or ""))
    raise
wait_text("Обновить",contains=False)
screenshot("01-update-offered")

tap_text("Обновить",contains=False)
wait_text("TurnikCoach обновлён до 5.16.30",timeout=25)
assert_accessibility_target("План",48)
assert_accessibility_target("Прогресс",48)
screenshot("02-update-installed")

# Main course is already saved by the seeded user state; extra workout must still be available.
wait_text("Основной комплекс выполнен",timeout=20)
wait_text("Начать дополнительную тренировку",timeout=12)
screenshot("03-main-done-extra-available")

tap_text("Начать дополнительную тренировку",contains=False)
wait_text("Подъём коленей в висе",timeout=15)
screenshot("04-extra-workout-active")
adb("shell","uiautomator","dump","/sdcard/uxb3-active.xml",check=False)
adb("pull","/sdcard/uxb3-active.xml",OUT+"/04-extra-workout-active.xml",check=False)
wait_text("Выйти",timeout=10,contains=False)
assert_touch_target("Выйти",48,contains=False)
wait_text("ⓘ",timeout=10,contains=False)
assert_touch_target("ⓘ",48,contains=False)

# UX2 durability: kill the Android process and verify the same active workout returns.
adb("shell","am","force-stop",PKG)
time.sleep(1)
launch()
dismiss_system_anr()
wait_text("Подъём коленей в висе",timeout=20)
wait_text("Выйти",timeout=12,contains=False)
screenshot("05-process-death-restored")

# Explicit visible exit must still work after process restoration.
tap_text("Выйти",contains=False)
wait_text("Выйти без сохранения?",timeout=10)
wait_text("Выйти без сохранения",contains=False)
screenshot("06-discard-confirm")

tap_text("Выйти без сохранения",contains=False)
wait_text("Текущая тренировка закрыта без сохранения.",timeout=10)
wait_text("Основной комплекс выполнен",timeout=10)
wait_text("Начать дополнительную тренировку",timeout=10)
screenshot("07-returned-after-discard")

# Undo remains reachable as a secondary recovery action.
wait_text("Ошибочно завершил — отменить запись",timeout=10)
tap_text("Ошибочно завершил — отменить запись",contains=False)
wait_text("Отменить сегодняшнюю тренировку?",timeout=10)
wait_text("Отменить запись",contains=False)
screenshot("08-undo-confirm")

tap_text("Отменить запись",contains=False)
wait_text("Комплекс №3",timeout=12)
wait_text("Начать адаптированную тренировку",timeout=12)
screenshot("09-course-restored")

# Forms/settings block: open course settings and save an unchanged valid form.
pos,_=find_text("Тренировка",contains=False)
if pos:
    adb("shell","input","tap",str(pos[0]),str(pos[1]))
    time.sleep(1)
else:
    tap_bottom_nav("workout")
wait_text("Настройки курса",timeout=12,contains=False)
tap_text("Настройки курса",contains=False)
wait_text("Основное",timeout=12,contains=False)
wait_text("Расписание",timeout=12,contains=False)
wait_text("Дополнительная работа",timeout=12,contains=False)
wait_text("Контроль прогресса",timeout=12,contains=False)
wait_text("Система и оборудование",timeout=12,contains=False)
tap_text("Расписание",contains=False)
wait_text("Начало тренировочного цикла",timeout=12)
tap_text("Система и оборудование",contains=False)
wait_text("Версия",timeout=12,contains=False)
wait_text("5.16.30",timeout=12)
# The long settings sheet exercises select, number and date controls before Save.
# Static regression enforces their 48px CSS contract; the Android smoke verifies the form remains operable.
screenshot("10-course-settings")

tap_visible_text("Сохранить",contains=False)
wait_text("Настройки курса сохранены.",timeout=12,contains=False)
screenshot("11-settings-saved")

# Calendar navigation must remain usable after increasing its touch targets.
tap_bottom_nav("today")
wait_text("Сегодня",timeout=10)
assert_touch_target("Сегодня",48,contains=False)
screenshot("12-touch-targets-today")

# Legacy exercise catalog controls must also expose usable touch targets.
tap_bottom_nav("workout")
wait_text("План",timeout=10,contains=False)
wait_text("Подтягивания классические",timeout=10,contains=False)
assert_accessibility_target("Выбрать упражнение",48)
assert_touch_target("★",48,contains=False)
screenshot("13-plan-touch-targets")

print("UX2_SETTINGS_SMOKE_OK")
