"""Перевірка видачі Google (США) для калькуляторів із US_calculator_keyword_analysis_full.xlsx.

Джерело — Serper.dev (справжня видача Google, gl=us, hl=en).
Бере аркуш Top Opportunities, відкидає нерелевантні для США / сміттєві ідеї,
для кожної зберігає топ-10 органіки, People also ask і схожі запити.
Ключ читається з ../.env (SERPER_API_KEY=...) або зі змінної оточення.

Запуск:  python research/serp_check.py            — англійська видача
         python research/serp_check.py --es       — іспанська видача в США
"""
import json, os, sys, time, urllib.request
from urllib.parse import urlparse

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
XLSX = os.path.join(ROOT, "US_calculator_keyword_analysis_full.xlsx")

SKIP = {
    "7Th Pay Commission calculator", "7Th Cpc Pay Matrix calculator", "Image calculator",
    "Logo calculator", "Exponent Button calculator", "0 To Absolute Infinity calculator",
    "Messages calculator", "Used Statistics calculator", "Net Height calculator",
    ".Net Tdee calculator", "Net Tdee calculator", "Soup Hours calculator",
    "Net Investment calculator", "Usd To Inr calculator", "Uscis calculator",
    "6 Minute Walk Test calculator", "Interest calculator", "Yen To Usd calculator",
    "60 Days From Today calculator", "401K Chart By Age calculator", "Large Numbers calculator",
    "Calendar calculator", "Birth calculator",
}
QUERY = {
    "Discount/percentage-off calculator": "percent off calculator",
    "Mortgage payment calculator": "mortgage calculator",
    "Time card/work hours calculator": "time card calculator",
    "Date difference calculator": "days between dates calculator",
    "Car loan/payment calculator": "car loan calculator",
    "Weight unit converter": "kg to lbs converter",
    "JPY to USD converter": "yen to usd converter",
    "EUR to USD converter": "euro to dollar converter",
    "Yards Of Concrete calculator": "cubic yards of concrete calculator",
    "Cd Interest calculator": "cd calculator",
    "Usps calculator": "usps postage calculator",
}
# Іспанські відповідники для перевірки попиту/конкуренції іспаномовної аудиторії США
QUERY_ES = {
    "Discount/percentage-off calculator": "calculadora de descuentos",
    "Date calculator": "calculadora de fechas",
    "Mortgage payment calculator": "calculadora de hipoteca",
    "Time card/work hours calculator": "calculadora de horas trabajadas",
    "Cd Interest calculator": "calculadora de certificado de depósito",
    "Loan Interest calculator": "calculadora de intereses de préstamo",
    "Concrete calculator": "calculadora de concreto",
    "Square Feet calculator": "calculadora de pies cuadrados",
    "Calorie calculator": "calculadora de calorías",
    "Car loan/payment calculator": "calculadora de préstamo de auto",
    "Compound Interest calculator": "calculadora de interés compuesto",
    "Salary calculator": "calculadora de salario",
    "Overtime calculator": "calculadora de horas extras",
    "Paycheck calculator": "calculadora de cheque de pago",
    "Ovulation calculator": "calculadora de ovulación",
    "Percentage calculator": "calculadora de porcentaje",
    "Age calculator": "calculadora de edad",
    "Bmi calculator": "calculadora de imc",
    "Tip calculator": "calculadora de propinas",
    "Gpa calculator": "calculadora de gpa",
}

# Великі універсальні калькуляторні портали
PORTALS = {
    "calculator.net", "omnicalculator.com", "calculatorsoup.com", "gigacalculator.com",
    "rapidtables.com", "inchcalculator.com", "timeanddate.com", "calculator-online.net",
    "calculator.me", "symbolab.com", "mathway.com", "desmos.com", "mathpapa.com",
    "percentagecalculator.net", "thecalculatorsite.com", "dqydj.com", "goodcalculators.com",
    "calculators.org", "mortgagecalculator.org", "calculatehours.com", "timecardcalculator.net",
    "calculatored.com", "calculatorultra.com", "miniwebtool.com", "calcuonline.com",
    "calculadoraonline.com.br", "calculadoraconversor.com", "calculadora.net",
}
# Великі бренди з високим авторитетом (фінанси, здоров'я, держсайти, рітейл, UGC)
BRANDS = {
    "bankrate.com", "nerdwallet.com", "investopedia.com", "smartasset.com", "forbes.com",
    "zillow.com", "chase.com", "wellsfargo.com", "bankofamerica.com", "usbank.com",
    "fidelity.com", "schwab.com", "vanguard.com", "adp.com", "paycheckcity.com", "gusto.com",
    "experian.com", "ramseysolutions.com", "aarp.org", "cnbc.com", "homedepot.com",
    "lowes.com", "quikrete.com", "mayoclinic.org", "clevelandclinic.org", "nih.gov",
    "cdc.gov", "webmd.com", "healthline.com", "sleepfoundation.org", "whattoexpect.com",
    "babycenter.com", "irs.gov", "ssa.gov", "bls.gov", "usps.com", "investor.gov",
    "edmunds.com", "kbb.com", "capitalone.com", "discover.com", "xe.com", "wise.com",
    "google.com", "youtube.com", "reddit.com", "wikipedia.org", "khanacademy.org",
    "collegeboard.org", "fool.com", "americanexpress.com", "marcus.com", "ally.com",
    "cars.com", "carmax.com", "rocketmortgage.com", "freddiemac.com", "dol.gov",
    "calorieking.com", "myfitnesspal.com", "americanpregnancy.org", "mayoclinichealthsystem.org",
}
APPS = {"play.google.com", "apps.apple.com", "apps.microsoft.com"}


def load_key():
    key = os.environ.get("SERPER_API_KEY", "")
    env = os.path.join(ROOT, ".env")
    if not key and os.path.exists(env):
        for line in open(env, encoding="utf-8"):
            if line.strip().startswith("SERPER_API_KEY="):
                key = line.split("=", 1)[1].strip().strip('"')
    if not key:
        sys.exit("SERPER_API_KEY не знайдено: додай його в .env (див. .env.example)")
    return key


def google(key, q, hl):
    body = json.dumps({"q": q, "gl": "us", "hl": hl, "num": 10}).encode()
    req = urllib.request.Request(
        "https://google.serper.dev/search", data=body,
        headers={"Content-Type": "application/json", "X-API-KEY": key},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def domain(url):
    d = urlparse(url).netloc.lower()
    return d[4:] if d.startswith("www.") else d


def main():
    spanish = "--es" in sys.argv
    out = os.path.join(HERE, "serp_google_es.json" if spanish else "serp_google_en.json")
    key = load_key()
    ws = openpyxl.load_workbook(XLSX, data_only=True)["Top Opportunities"]
    rows = list(ws.iter_rows(values_only=True))
    head, data = rows[0], rows[1:]
    results = json.load(open(out, encoding="utf-8")) if os.path.exists(out) else {}
    for r in data:
        rec = dict(zip(head, r))
        name = rec["Calculator Opportunity"]
        if name in SKIP or name in results:
            continue
        if spanish:
            if name not in QUERY_ES:
                continue
            q = QUERY_ES[name]
        else:
            q = QUERY.get(name, name.lower())
        try:
            res = google(key, q, "es" if spanish else "en")
        except Exception as e:
            print("ERR", name, e)
            if "403" in str(e) or "401" in str(e):
                break
            continue
        organic = res.get("organic", [])
        doms = []
        for o in organic:
            d = domain(o["link"])
            if d not in doms:
                doms.append(d)
        results[name] = {
            "rank": rec["Priority Rank"], "query": q, "category": rec["Category"],
            "decision": rec["Decision"], "seo_difficulty": rec["Best SEO Difficulty"],
            "volume": rec["Combined Search Volume*"], "cpc": rec["Max CPC (USD)"],
            "complexity": rec["Development Complexity"],
            "organic": [{"pos": o.get("position"), "title": o.get("title"), "link": o["link"]} for o in organic],
            "domains": doms,
            "portals": [d for d in doms if d in PORTALS],
            "brands": [d for d in doms if d in BRANDS],
            "apps": [d for d in doms if d in APPS],
            "answer_box": bool(res.get("answerBox")),
            "people_also_ask": [p.get("question") for p in res.get("peopleAlsoAsk", [])],
            "related": [x.get("query") for x in res.get("relatedSearches", [])],
        }
        x = results[name]
        print(f'{rec["Priority Rank"]:>3} {q:<42} portals={len(x["portals"])} brands={len(x["brands"])} | {", ".join(doms[:6])}')
        json.dump(results, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        time.sleep(0.3)
    print(f"\nГотово: {len(results)} запитів збережено в {os.path.basename(out)}")


if __name__ == "__main__":
    main()
