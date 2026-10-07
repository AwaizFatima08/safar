# Builds captioned Play Store screenshots (1080x1920) from the raw app captures.
import subprocess, pathlib
HERE = pathlib.Path(__file__).resolve().parent
SHOTS = HERE.parents[1] / "screenshots"
OUT = HERE.parent
ITEMS = [
 ("05-topic-detail", "17 O Level & IGCSE essay topics", "۱۷ مضامین، مکمل مشق"),
 ("03-flashcard-review", "Learn 170+ exam words with flashcards", "الفاظ یاد کریں"),
 ("02-vocabulary-practice", "Master the 30 idioms tested in Paper 2", "محاورے"),
 ("01-home-essays", "Vocabulary, reading, writing & grammar", "ہر موضوع، ہر مہارت"),
]
TPL = """<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Noto+Nastaliq+Urdu:wght@700&display=block" rel="stylesheet">
<style>
html,body{{margin:0;width:1080px;height:1920px;overflow:hidden}}
body{{background:radial-gradient(circle at 50% 0%,#2A5047 0%,#1E3A34 60%);color:#F8EFDA;text-align:center}}
.cap{{padding:100px 80px 0}}
.en{{font-family:'Fraunces',Georgia,serif;font-size:74px;font-weight:700;line-height:1.1}}
.ur{{font-family:'Noto Nastaliq Urdu',serif;font-size:46px;line-height:2.1;margin-top:18px;color:#E9A43A;direction:rtl}}
.phone{{position:absolute;left:50%;transform:translateX(-50%);top:{top}px;width:620px;border-radius:54px;background:#0f1f1b;padding:16px;box-shadow:0 40px 90px rgba(0,0,0,.45)}}
.phone img{{display:block;width:100%;border-radius:40px}}
</style></head><body><div class="cap"><div class="en">{en}</div><div class="ur">{ur}</div></div>
<div class="phone"><img src="{img}"></div></body></html>"""
for i,(name,en,ur) in enumerate(ITEMS,1):
    html = HERE / f"{i:02d}_{name}.html"
    html.write_text(TPL.format(en=en, ur=ur, img=(SHOTS/f"{name}.png").as_uri(), top=560), encoding="utf-8")
    png = OUT / f"{i:02d}_{name}.png"
    subprocess.run(["google-chrome","--headless=new","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1",
        "--allow-file-access-from-files","--virtual-time-budget=8000","--window-size=1080,1920",f"--screenshot={png}",html.as_uri()],check=True,capture_output=True)
    html.unlink()
    print(png.name)
