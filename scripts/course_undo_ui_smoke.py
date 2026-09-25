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
    adb("shell","uiautomator","dump","/sdcard/window.xml")
    adb("pull","/sdcard/window.xml","/tmp/window.xml")
    return ET.parse("/tmp/window.xml").getroot()

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

adb("shell","monkey","-p",PKG,"-c","android.intent.category.LAUNCHER","1")
time.sleep(4)

wait_text("Сегодняшняя тренировка уже сохранена")
wait_text("Отменить запись и начать заново")
screenshot("01-saved-state")

tap_text("Отменить запись и начать заново",contains=False)
wait_text("Отменить сегодняшнюю тренировку?")
wait_text("Отменить запись",contains=False)
screenshot("02-in-app-confirm")

tap_text("Отменить запись",contains=False)
wait_text("Комплекс №3")
wait_text("Начать адаптированную тренировку")
screenshot("03-course-restored")

pos,_=find_text("Сегодняшняя тренировка уже сохранена")
if pos:
    raise AssertionError("Saved-state strip still present after undo")

print("COURSE_UNDO_UI_SMOKE_OK")
