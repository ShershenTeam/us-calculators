"""Витягує результати Ubersuggest (MCP) з журналу сесії Claude Code у CSV.

Використання:
    python research/harvest.py <шлях до session.jsonl> [ще .jsonl ...]

Пише в research/data/:
    competitor_pages.csv   domain_top_pages  (domain, path, url, title, traffic, refdomains)
    keywords.csv           keyword_overview  (keyword, lang, volume, cpc, sd)
    serps.csv              serp_analysis     (keyword, lang, position, domain, da, clicks, url)
    suggestions.csv        match_keywords    (seed, keyword, volume, cpc, sd)
"""
import csv, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "data")
UBER = "b0488370"


def text_of(content):
    if isinstance(content, str):
        return content
    return "".join(c.get("text", "") for c in content if isinstance(c, dict))


def iter_calls(paths):
    uses = {}
    for p in paths:
        for line in open(p, encoding="utf-8"):
            try:
                e = json.loads(line)
            except Exception:
                continue
            msg = e.get("message") or {}
            content = msg.get("content")
            if not isinstance(content, list):
                continue
            for b in content:
                if b.get("type") == "tool_use" and UBER in b.get("name", ""):
                    uses[b["id"]] = (b["name"].split("__")[-1], b.get("input", {}))
                elif b.get("type") == "tool_result" and b.get("tool_use_id") in uses:
                    name, inp = uses[b["tool_use_id"]]
                    raw = text_of(b.get("content", ""))
                    try:
                        data = json.loads(raw)
                    except Exception:
                        continue
                    yield name, inp, data


def iter_saved(paths):
    """Великі відповіді MCP зберігаються окремими файлами в <session>/tool-results/."""
    for p in paths:
        folder = os.path.join(os.path.splitext(p)[0], "tool-results")
        if not os.path.isdir(folder):
            continue
        for fn in sorted(os.listdir(folder)):
            if UBER not in fn:
                continue
            name = fn.split("-")[-2]  # mcp-<server>-<tool>-<ts>.txt
            try:
                data = json.load(open(os.path.join(folder, fn), encoding="utf-8"))
            except Exception:
                continue
            yield name, {}, data


def main(paths):
    os.makedirs(OUT, exist_ok=True)
    pages, kws, serps, sugg = {}, {}, {}, {}
    for name, inp, d in list(iter_calls(paths)) + list(iter_saved(paths)):
        if name == "domain_top_pages":
            for p in d.get("topPages", []):
                pages[(p["domain"], p["path"])] = [p["domain"], p["path"], p["url"], p.get("title", ""),
                                                   p.get("traffic", 0), p.get("refdomains", 0)]
        elif name == "keyword_overview" and "keyword" in d:
            lang = (inp.get("language") or "en")
            kws[(d["keyword"], lang)] = [d["keyword"], lang, d.get("search_volume", 0), d.get("cpc", 0),
                                         d.get("seo_difficulty", "")]
        elif name == "serp_analysis":
            kw, lang = d.get("keyword", inp.get("keyword")), inp.get("language", "en")
            for s in d.get("serpEntries", []):
                if s.get("type") != "organic":
                    continue
                serps[(kw, lang, s["position"])] = [kw, lang, s["position"], s["domain"],
                                                    s.get("domainAuthority", ""), s.get("clicks", ""), s["url"]]
        elif name == "match_keywords":
            seed = ",".join(inp.get("keywords", []))
            for s in d.get("suggestions", []):
                sugg[(seed, s["keyword"])] = [seed, s["keyword"], s.get("volume", 0), s.get("cpc", 0), s.get("sd", "")]

    def dump(fn, head, rows):
        with open(os.path.join(OUT, fn), "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(head)
            w.writerows(rows)
        print(f"{fn}: {len(rows)} рядків")

    dump("competitor_pages.csv", ["domain", "path", "url", "title", "traffic", "refdomains"],
         sorted(pages.values(), key=lambda r: -r[4]))
    dump("keywords.csv", ["keyword", "lang", "volume", "cpc", "sd"], sorted(kws.values(), key=lambda r: -r[2]))
    dump("serps.csv", ["keyword", "lang", "position", "domain", "da", "clicks", "url"], sorted(serps.values()))
    dump("suggestions.csv", ["seed", "keyword", "volume", "cpc", "sd"], sorted(sugg.values(), key=lambda r: -r[2]))


if __name__ == "__main__":
    main(sys.argv[1:])
