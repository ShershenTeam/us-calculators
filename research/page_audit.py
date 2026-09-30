"""Швидкий аудит сторінок-лідерів: обсяг тексту, структура H2, FAQ, schema.org, автор, таблиці."""
import json, re, sys, urllib.request
from html import unescape

PAGES = {
    "calcshelf (time duration, #1, DA10)": "https://calcshelf.com/time/time-duration-calculator",
    "calculator.net (time card)": "https://www.calculator.net/time-card-calculator.html",
    "redcort (time card, #1)": "https://www.redcort.com/free-timecard-calculator",
    "omnicalculator (gravel)": "https://www.omnicalculator.com/construction/gravel",
    "calculator.net (gravel, #1)": "https://www.calculator.net/gravel-calculator.html",
    "tdeecalculator.net (#1)": "https://tdeecalculator.net/",
    "fatcalc (calorie deficit, #2 DA31)": "https://www.fatcalc.com/rwl",
    "percentagecalculator.net (#1)": "https://percentagecalculator.net/",
    "goldcalc (#1 DA26)": "https://www.goldcalc.com/",
    "landscapecalculator (mulch #1)": "https://www.landscapecalculator.com/calculators/mulch",
}
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-US"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def audit(html):
    body = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", html)
    text = unescape(re.sub(r"(?s)<[^>]+>", " ", body))
    words = len(re.findall(r"[A-Za-z]{2,}", text))
    h2 = [unescape(re.sub(r"<[^>]+>", "", h)).strip() for h in re.findall(r"(?is)<h2[^>]*>(.*?)</h2>", html)]
    types = set(re.findall(r'"@type"\s*:\s*"([A-Za-z]+)"', html))
    return {
        "words": words,
        "h2": [h for h in h2 if h][:12],
        "schema": sorted(types),
        "faq": bool(re.search(r"(?i)FAQPage|frequently asked|>FAQ<", html)),
        "author": bool(re.search(r'(?i)"author"|reviewed by|written by|by <a', html)),
        "tables": len(re.findall(r"(?i)<table", html)),
        "inputs": len(re.findall(r"(?i)<input", html)),
        "imgs": len(re.findall(r"(?i)<img", html)),
    }


out = {}
for name, url in PAGES.items():
    try:
        out[name] = {"url": url, **audit(fetch(url))}
    except Exception as e:
        out[name] = {"url": url, "error": str(e)}
json.dump(out, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for k, v in out.items():
    if "error" in v:
        print(f"{k}: ERROR {v['error']}")
    else:
        print(f"{k}: {v['words']} слів · H2={len(v['h2'])} · FAQ={v['faq']} · автор={v['author']} · schema={','.join(v['schema'])} · таблиць={v['tables']} · інпутів={v['inputs']}")
        print("   H2:", " | ".join(v["h2"][:8]))
