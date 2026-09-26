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

def screenshot(name):
    remote="/sdcard/"+name+".png"
    adb("shell","screencap","-p",remote)
    adb("pull",remote,OUT+"/"+name+".png")

def launch():
    adb("shell","monkey","-p",PKG,"-c","android.intent.category.LAUNCHER","1")
    time.sleep(5)

launch()

# Exact update path: old 5.16.22 asset is active first, remote 5.16.23 must be offered explicitly.
wait_text("Доступно обновление TurnikCoach 5.16.23",timeout=20)
wait_text("Обновить",contains=False)
screenshot("01-update-offered")

tap_text("Обновить",contains=False)
wait_text("TurnikCoach обновлён до 5.16.23",timeout=25)
screenshot("02-update-installed")

# Main course is already saved by the seeded user state; extra workout must still be available.
wait_text("Основной комплекс выполнен",timeout=20)
wait_text("Начать дополнительную тренировку",timeout=12)
screenshot("03-main-done-extra-available")

tap_text("Начать дополнительную тренировку",contains=False)
wait_text("Подъём коленей в висе",timeout=15)
wait_text("Выйти",timeout=10,contains=False)
screenshot("04-extra-workout-active")

# Explicit visible exit must work from the actual packaged v5.13 stageHeader.
tap_text("Выйти",contains=False)
wait_text("Выйти без сохранения?",timeout=10)
wait_text("Выйти без сохранения",contains=False)
screenshot("05-discard-confirm")

tap_text("Выйти без сохранения",contains=False)
wait_text("Текущая тренировка закрыта без сохранения.",timeout=10)
wait_text("Основной комплекс выполнен",timeout=10)
wait_text("Начать дополнительную тренировку",timeout=10)
screenshot("06-returned-after-discard")

# Undo remains reachable as a secondary recovery action.
wait_text("Ошибочно завершил — отменить запись",timeout=10)
tap_text("Ошибочно завершил — отменить запись",contains=False)
wait_text("Отменить сегодняшнюю тренировку?",timeout=10)
wait_text("Отменить запись",contains=False)
screenshot("07-undo-confirm")

tap_text("Отменить запись",contains=False)
wait_text("Комплекс №3",timeout=12)
wait_text("Начать адаптированную тренировку",timeout=12)
screenshot("08-course-restored")

print("UX_BLOCK3_SMOKE_OK")
