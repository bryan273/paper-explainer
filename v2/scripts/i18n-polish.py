"""Last pass over src/i18n/<lang>.json: one word for one thing in each language, and a few hand-written lines that matter most."""
import json, os, re
ROOT = os.path.join(os.path.dirname(__file__), "..")
TERMS = {   # the same English word must not come out two ways
    "ja": [("ビデオ", "動画")],
    "ko": [("비디오", "동영상")],
    "es": [("vídeo", "video"), ("Vídeo", "Video")],
    "fr": [],
    "de": [],
}
OVERRIDES = {   # hand-written: the headline and the few lines people read first
    "ja": {"Learn anything, your way.": "何でも、自分に合ったやり方で学べる。", "Make a free video": "無料で動画を作る", "Watch an example": "サンプルを見る"},
    "ko": {"Learn anything, your way.": "무엇이든, 나에게 맞는 방식으로 배우세요.", "Make a free video": "무료로 동영상 만들기", "Watch an example": "예시 보기"},
    "es": {"Learn anything, your way.": "Aprende lo que quieras, a tu manera.", "Make a free video": "Crea un video gratis", "Watch an example": "Ver un ejemplo"},
    "fr": {"Learn anything, your way.": "Apprenez tout, à votre façon.", "Make a free video": "Créer une vidéo gratuite", "Watch an example": "Voir un exemple"},
    "de": {"Learn anything, your way.": "Lerne alles, auf deine Art.", "Make a free video": "Kostenloses Video erstellen", "Watch an example": "Beispiel ansehen"},
}
for lang in TERMS:
    p = os.path.join(ROOT, "src", "i18n", f"{lang}.json")
    if not os.path.exists(p): continue
    d = json.load(open(p, encoding="utf-8")); n = 0
    for k, v in list(d.items()):
        w = v
        for a, b in TERMS[lang]: w = w.replace(a, b)
        if w != v: d[k] = w; n += 1
    for k, v in OVERRIDES.get(lang, {}).items():
        if k in d and d[k] != v: d[k] = v; n += 1
    json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=0, sort_keys=True)
    print(lang, "changed", n)
