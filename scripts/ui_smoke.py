import os
import subprocess
import time
import xml.etree.ElementTree as ET

PKG = "ru.turnikcoach.app"
OUT = os.environ.get("GITHUB_WORKSPACE", ".") + "/ui-test-output"
os.makedirs(OUT, exist_ok=True)

def adb(*args, check=True):
    return subprocess.run(["adb", *args], check=check, text=True, capture_output=True)

def dump():
    adb("shell", "uiautomator", "dump", "/sdcard/window.xml")
    adb("pull", "/sdcard/window.xml", "/tmp/window.xml")
    return ET.parse("/tmp/window.xml").getroot()

def bounds_center(bounds):
    import re
    nums = [int(x) for x in re.findall(r"\d+", bounds)]
    return ((nums[0]+nums[2])//2, (nums[1]+nums[3])//2)

def find_text(text, contains=True):
    root = dump()
    target = text.lower()
    candidates = []
    for n in root.iter("node"):
        val = (n.attrib.get("text") or "").lower()
        if not val:
            continue
        exact = val == target
        matched = exact or (contains and target in val)
        if not matched:
            continue
        b = n.attrib.get("bounds", "")
        if not b:
            continue
        clickable = n.attrib.get("clickable") == "true"
        score = 0 if exact and clickable else 1 if exact else 2 if clickable else 3
        candidates.append((score, bounds_center(b), n.attrib.get("text", "")))
    if not candidates:
        return None, None
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1], candidates[0][2]

def tap_text(text, scroll=False, exact=False):
    for _ in range(9 if scroll else 1):
        pos, actual = find_text(text, contains=not exact)
        if pos:
            adb("shell", "input", "tap", str(pos[0]), str(pos[1]))
            time.sleep(0.7)
            return actual
        if scroll:
            adb("shell", "input", "swipe", "540", "1700", "540", "650", "350")
            time.sleep(0.5)
    raise AssertionError(f"Text not found: {text}")

def find_edit(index=0):
    root = dump()
    found=[]
    for n in root.iter("node"):
        if n.attrib.get("class") == "android.widget.EditText" and n.attrib.get("bounds"):
            found.append(bounds_center(n.attrib["bounds"]))
    if len(found) <= index:
        raise AssertionError(f"EditText #{index} not found; have {len(found)}")
    return found[index]

def enter_edit(text, index=0):
    x,y=find_edit(index)
    adb("shell","input","tap",str(x),str(y)); time.sleep(.2)
    adb("shell","input","keyevent","KEYCODE_MOVE_END")
    adb("shell","input","text",str(text)); time.sleep(.2)

def assert_text(text, scroll=False):
    for _ in range(9 if scroll else 1):
        pos,_=find_text(text)
        if pos: return
        if scroll:
            adb("shell","input","swipe","540","1700","540","650","350"); time.sleep(.4)
    raise AssertionError(f"Expected text not found: {text}")

def screenshot(name):
    path=f"/sdcard/{name}.png"
    adb("shell","screencap","-p",path)
    adb("pull",path,f"{OUT}/{name}.png")

def add_reps(value):
    tap_text("+ Подход", scroll=True, exact=True)
    enter_edit(value,0)
    tap_text("Записать", exact=True)

def start_app():
    adb("shell","am","start","-n",f"{PKG}/.MainActivity")
    time.sleep(2)

start_app()
assert_text("Начать тренировку")
screenshot("01-home-empty")

tap_text("Начать тренировку", exact=True)
assert_text("Что делаешь сегодня")
tap_text("Старт", scroll=True, exact=True)
assert_text("ТРЕНИРОВКА ИДЁТ")

for v in (10,8,7,6):
    add_reps(v)

assert_text("31 повт", scroll=True)
screenshot("02-active-31-reps")
tap_text("Завершить и сохранить", scroll=True, exact=True)
tap_text("Сохранить", exact=True)
assert_text("История", scroll=True)
assert_text("31 повторений", scroll=True)
screenshot("03-stats-saved")

adb("shell","am","force-stop",PKG)
start_app()
assert_text("Последняя тренировка", scroll=True)
assert_text("31 повторений", scroll=True)
screenshot("04-home-persisted")

# Library and custom-exercise flow. First prove that navigation reached the library,
# then find the creation button by stable text without depending on the leading + glyph.
tap_text("Упражнения", exact=True)
assert_text("БИБЛИОТЕКА")
screenshot("05-library")
tap_text("Своё упражнение", scroll=True, exact=False)
enter_edit("TestCustom",0)
tap_text("Создать", exact=True)
assert_text("TestCustom", scroll=True)
screenshot("06-custom-exercise")

print("UI_SMOKE_OK")
