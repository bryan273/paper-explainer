"""Asks the project's LLM gateway to proofread every hand-written Vietnamese text against its English source.
Writes scripts/vi-fixes.json [{file, raw, old, new, why}] for a person to read before applying with --apply."""
import json, os, re, sys, urllib.request, concurrent.futures as cf
ROOT = os.path.join(os.path.dirname(__file__), "..")
URL = "https://wzdkroxbfrlqijbeiwpk.supabase.co/functions/v1/agent-llm"
SYSTEM = ("You are a native Vietnamese copy editor for a learning app. For each item you get the English source (en) and the current Vietnamese (vi). "
          "Fix only real problems: spelling, wrong or missing diacritics (dấu), wrong words, grammar, meaning that does not match the English, or wording a Vietnamese reader finds unnatural or machine-translated. "
          "Keep {placeholders}, numbers, product names (Paperlit, Plus, Pro, Premium, VietQR, QRIS, WeChat Pay, Alipay, arXiv) and the length roughly the same. Address the user as 'bạn'. "
          "Reply with a JSON object: keys are the item numbers that need a change, each value is {\"vi\": corrected text, \"why\": a few English words}. Items that are fine are left out. Reply {} if all are fine.")

def call(items):
    body = {"app": "companion", "json_mode": True, "max_tokens": 4000, "visitor": "i18n-build",
            "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": json.dumps({str(i): {"en": x["en"], "vi": x["vi"]} for i, x in enumerate(items)}, ensure_ascii=False)}]}
    r = urllib.request.urlopen(urllib.request.Request(URL, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}), timeout=180)
    t = json.loads(r.read())["message"]["content"]
    return json.loads(re.sub(r"^```(json)?|```$", "", t.strip()).strip())

def lit(s):
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"

if __name__ == "__main__":
    fixes_path = os.path.join(ROOT, "scripts", "vi-fixes.json")
    if "--apply" in sys.argv:
        fixes = json.load(open(fixes_path, encoding="utf-8")); n = 0
        for f in fixes:
            p = os.path.join(ROOT, "src", f["file"]); s = open(p, encoding="utf-8").read()
            if f["raw"] in s: s = s.replace(f["raw"], lit(f["new"]), 1); n += 1; open(p, "w", encoding="utf-8", newline="\n").write(s)
        print("applied", n, "of", len(fixes)); sys.exit()
    pairs = json.load(open(os.path.join(ROOT, "scripts", "vi-pairs.json"), encoding="utf-8"))
    uniq = {}
    for x in pairs: uniq.setdefault(x["raw"], x)
    items = list(uniq.values()); chunks = [items[i:i + 40] for i in range(0, len(items), 40)]
    fixes = []
    def one(c):
        for _ in range(3):
            try: return c, call(c)
            except Exception as e: err = e
        print("chunk failed", str(err)[:100]); return c, {}
    with cf.ThreadPoolExecutor(4) as ex:
        for c, got in ex.map(one, chunks):
            for k, v in got.items():
                try: x = c[int(k)]
                except Exception: continue
                new = v.get("vi") if isinstance(v, dict) else v
                if isinstance(new, str) and new.strip() and new != x["vi"] and sorted(re.findall(r"\{\w+\}", new)) == sorted(re.findall(r"\{\w+\}", x["vi"])):
                    fixes.append({"file": x["file"], "raw": x["raw"], "old": x["vi"], "new": new, "why": (v.get("why") if isinstance(v, dict) else "")})
    json.dump(fixes, open(fixes_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(items), "texts checked,", len(fixes), "suggested fixes")
