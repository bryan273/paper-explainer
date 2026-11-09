"""Builds src/i18n/<lang>.json from scripts/i18n-need.json through the project's own LLM gateway (agent-llm, app "companion").
Keeps what is already translated; only missing texts are sent. Checks that {placeholders} and product names survive.
Usage: python scripts/i18n-translate.py [lang ...]"""
import json, os, re, sys, time, urllib.request, concurrent.futures as cf

ROOT = os.path.join(os.path.dirname(__file__), "..")
URL = "https://wzdkroxbfrlqijbeiwpk.supabase.co/functions/v1/agent-llm"
NAMES = {"zh": "Simplified Chinese", "vi": "Vietnamese", "id": "Indonesian", "ja": "Japanese", "ko": "Korean", "es": "Spanish", "fr": "French", "de": "German"}
STYLE = {
    "zh": "Natural Simplified Chinese as used by Chinese apps (not word-for-word); use 你.",
    "vi": "Natural Vietnamese with correct diacritics, as a Vietnamese app would write it; address the user as 'bạn'.",
    "id": "Natural Indonesian as a modern Indonesian app writes it; address the user as 'Anda'.",
    "ja": "Natural Japanese for a modern web app, polite です/ます style, concise UI wording.",
    "ko": "Natural Korean for a modern web app, polite 해요체 style, concise UI wording.",
    "es": "Natural neutral Spanish (Latin America and Spain), address the user as 'tú'.",
    "fr": "Natural French, address the user as 'vous', typographic French spacing is not required.",
    "de": "Natural German, address the user as 'du', concise, no Anglicisms where a common German word exists.",
}
KEEP = ["Paperlit", "Plus", "Pro", "Premium", "arXiv", "QRIS", "VietQR", "WeChat Pay", "Alipay", "Anki", "GoPay", "PDF"]
SYSTEM = ("You translate the user interface of Paperlit, a learning product that turns papers, articles and notes into videos, guided reading and quizzes. "
          "Translate each value of the JSON object into {LANG}. {STYLE} Write like a native product writer: short, clear, friendly, never stiff or literal. "
          "Keep every {placeholder} in curly braces exactly as it is. Keep these names unchanged: " + ", ".join(KEEP) + ". "
          "Keep numbers, units, URLs, file extensions and quotes from papers (text inside quotation marks that quotes a paper stays in English). "
          "Do not add or drop information. Reply with one JSON object with the same keys and the translated values only.")

def call(lang, batch):
    body = {"app": "companion", "json_mode": True, "max_tokens": 4000, "visitor": "i18n-build",
            "messages": [{"role": "system", "content": SYSTEM.replace("{LANG}", NAMES[lang]).replace("{STYLE}", STYLE[lang])},
                         {"role": "user", "content": json.dumps({str(i): s for i, s in enumerate(batch)}, ensure_ascii=False)}]}
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    out = json.loads(urllib.request.urlopen(req, timeout=180).read())
    text = out.get("content") or out.get("message", {}).get("content") or out.get("choices", [{}])[0].get("message", {}).get("content", "")
    text = re.sub(r"^```(json)?|```$", "", text.strip()).strip()
    got = json.loads(text)
    return [got.get(str(i)) for i in range(len(batch))]

ph = lambda s: sorted(re.findall(r"\{\w+\}", s))
def ok(src, dst):
    if not isinstance(dst, str) or not dst.strip(): return False
    if ph(src) != ph(dst): return False
    return all(k in dst for k in KEEP if k in src and k not in ("Plus", "Pro"))

def batches(items, limit=4500):
    cur, n = [], 0
    for s in items:
        if cur and n + len(s) > limit: yield cur; cur, n = [], 0
        cur.append(s); n += len(s)
    if cur: yield cur

def run(lang, need):
    path = os.path.join(ROOT, "src", "i18n", f"{lang}.json")
    have = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {}
    todo = [s for s in need if s not in have]
    print(lang, "to translate:", len(todo), flush=True)
    bad = []
    def one(b):
        err = None
        for attempt in range(12):
            try:
                res = call(lang, b); return list(zip(b, res))
            except urllib.error.HTTPError as e:
                err = e; time.sleep(120 if e.code == 429 else 5)   # the gateway allows a fixed number of calls an hour
            except Exception as e:
                err = e; time.sleep(5)
        print(lang, "batch failed:", str(err)[:120], flush=True); return []
    with cf.ThreadPoolExecutor(2) as ex:
        for pairs in ex.map(one, list(batches(todo))):
            for s, d in pairs:
                if ok(s, d): have[s] = d
                else: bad.append(s)
    # a second, one-by-one pass for the ones that came back wrong
    for s in bad:
        try:
            d = call(lang, [s])[0]
            if ok(s, d): have[s] = d
        except Exception: pass
    # what someone wrote in the file while this ran (a hand translation) wins over what this run made
    now = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {}
    have.update(now)
    keep = {s: have[s] for s in sorted(have) if s in set(need)}
    json.dump(keep, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=0, sort_keys=True)
    print(lang, "done:", len(keep), "of", len(need), flush=True)

if __name__ == "__main__":
    need = json.load(open(os.path.join(ROOT, "scripts", "i18n-need.json"), encoding="utf-8"))
    for lang in (sys.argv[1:] or list(NAMES)):
        run(lang, need[lang])
