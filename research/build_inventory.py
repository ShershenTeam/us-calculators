"""Будує перелік сторінок сайту на 12 місяців з даних конкурентів і наших досліджень.

Вхід (research/data/, research/*.tsv):
    competitor_pages.csv  — сторінки 10 конкурентів з трафіком (harvest.py)
    suggestions.csv       — варіанти запитів (paycheck по штатах)
    keywords_*.tsv        — наші перевірені запити
Вихід:
    data/page_inventory.csv — один рядок = одна наша майбутня сторінка

Логіка:
 1. Кожна сторінка конкурента → «ключ наміру» (conv:kg>lb, val:kg>lb:80, date:days-from-today:90, calc:margin …).
    Однакові наміри з різних сайтів об'єднуються: беремо макс. трафік і мін. кількість донорів.
 2. Тип (calculator / converter / value / date / countdown / generator / state / tool) і категорія.
 3. Бал = попит (трафік конкурента) × легкість (донори, тип) × цінність (CPC-рівень категорії).
 4. Розклад по місяцях з урахуванням «воріт» (YMYL пізніше, штати після податкового движка)
    і місячної пропускної здатності.
"""
import csv, math, os, re
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")

# ---------- нормалізація одиниць ----------
UNIT = [
    (r"fluid[- ]?ounces?|fl[- ]?oz", "floz"), (r"ounces?|oz", "oz"), (r"pounds?|lbs?", "lb"),
    (r"kilograms?|kilos?|kgs?", "kg"), (r"milligrams?|mg", "mg"), (r"micrograms?|mcg|ug", "mcg"),
    (r"grams?|gr", "g"), (r"stones?", "st"), (r"tons?|tonnes?", "ton"),
    (r"milliliters?|millilitres?|mls?", "ml"), (r"liters?|litres?", "l"), (r"gallons?|gal", "gal"),
    (r"quarts?|qt", "qt"), (r"pints?", "pint"), (r"cups?", "cup"), (r"tablespoons?|tbsp|tbs", "tbsp"),
    (r"teaspoons?|tsp", "tsp"), (r"cubic[- ]?centimeters?|cc", "cc"),
    (r"square[- ]?feet|square[- ]?foot|sq[- ]?ft|ft2", "sqft"), (r"square[- ]?meters?|square[- ]?metres?|sq[- ]?m|m2", "sqm"),
    (r"square[- ]?inch(es)?|sq[- ]?in", "sqin"), (r"square[- ]?yards?", "sqyd"), (r"square[- ]?miles?", "sqmi"),
    (r"acres?", "acre"), (r"hectares?", "ha"),
    (r"cubic[- ]?feet|cubic[- ]?foot|cu[- ]?ft", "cuft"), (r"cubic[- ]?yards?|cu[- ]?yd", "cuyd"),
    (r"cubic[- ]?meters?", "cum"), (r"cubic[- ]?inch(es)?", "cuin"),
    (r"millimeters?|millimetres?|mm", "mm"), (r"centimeters?|centimetres?|cms?", "cm"),
    (r"kilometers?|kilometres?|kms?", "km"), (r"meters?|metres?", "m"), (r"inch(es)?", "in"),
    (r"feet|foot|ft", "ft"), (r"yards?|yds?", "yd"), (r"miles?", "mi"), (r"nautical[- ]?miles?", "nmi"),
    (r"celsius|centigrade", "degc"), (r"fahrenheit", "degf"), (r"kelvin", "degk"),
    (r"hours?|hrs?", "hr"), (r"minutes?|mins?", "min"), (r"seconds?|secs?", "sec"),
    (r"milliseconds?|ms", "msec"), (r"days?", "day"), (r"weeks?", "week"), (r"months?", "month"), (r"years?", "year"),
    (r"mph|miles[- ]?per[- ]?hour", "mph"), (r"km/?h|kph|kilometers[- ]?per[- ]?hour", "kmh"), (r"knots?", "knot"),
    (r"newton[- ]?meters?|nm", "nm"), (r"foot[- ]?pounds?|ft[- ]?lbs?", "ftlb"), (r"inch[- ]?pounds?|in[- ]?lbs?", "inlb"),
    (r"psi", "psi"), (r"bar", "bar"), (r"atm|atmospheres?", "atm"), (r"mmhg", "mmhg"), (r"kpa", "kpa"),
    (r"watts?", "w"), (r"kilowatts?|kw", "kw"), (r"horsepower|hp", "hp"), (r"amps?|amperes?", "amp"), (r"volts?", "volt"),
    (r"btu", "btu"), (r"joules?", "j"), (r"calories?|kcal", "kcal"),
    (r"bytes?", "byte"), (r"kilobytes?|kb", "kb"), (r"megabytes?|mb", "mb"), (r"gigabytes?|gb", "gb"), (r"terabytes?|tb", "tb"),
    (r"mbps", "mbps"), (r"gbps", "gbps"), (r"pixels?|px", "px"), (r"points?", "point"),
    (r"radians?|rad", "rad"), (r"degrees?|deg", "deg"), (r"grains?", "grain"), (r"micrometers?|microns?|um", "um"),
    (r"kilojoules?|kj", "kj"), (r"g", "g"), (r"m", "m"), (r"l", "l"), (r"j", "j"),
    (r"feet[- ]?(and[- ]?)?inch(es)?|ft[- ]?in", "ftin"), (r"meters?[- ]?(and[- ]?)?cm", "mcm"),
]
UNIT_SUFFIX = re.compile(r"-(us|uk|imperial|metric|dry|liquid|fluid)(?=-|$)")
UNIT_RE = [(re.compile(rf"^(?:{p})$"), u) for p, u in UNIT]


def norm_unit(tok):
    tok = tok.strip("-").replace("_", "-")
    for rx, u in UNIT_RE:
        if rx.match(tok):
            return u
    return None


STOP = {"calculator", "calculators", "converter", "conversion", "conversions", "convert", "calc", "online", "free",
        "tool", "the", "a", "an", "and", "with", "for", "of", "htm", "html", "php", "table", "chart", "formula"}
SYN = {"percent": "percentage", "auto-loan": "car-loan", "car-payment": "car-loan", "timecard": "time-card",
       "bmi-calculator": "bmi", "salary-to-hourly": "hourly-to-salary", "hourly-wage": "hourly-to-salary",
       "circle-area": "area-of-a-circle", "cylinder": "cylinder-volume", "random-number": "random-number-generator",
       "dice": "dice-roller", "roman-numeral": "roman-numerals", "numberstowords": "numbers-to-words",
       "feetandinches": "feet-and-inches", "fractions": "fraction", "mixednumbers": "mixed-numbers",
       "dateadd": "date", "timeduration": "time-duration", "scientificnotation": "scientific-notation",
       "hours-between-times": "hours", "time-sheet": "time-card", "timesheet": "time-card",
       "compoundinterestcalculator": "compound-interest", "roundingnumbers": "rounding", "rounding-numbers": "rounding",
       "cuberoots": "cube-root", "cube-roots": "cube-root", "fractionssimplify": "simplify-fractions",
       "common-multiple": "lcm", "least-common-multiple": "lcm", "greatest-common-factor": "gcf"}
# Особливі випадки: однакова назва сторінки, різний зміст
SPECIAL = {("timeanddate.com", "duration"): "calc:days-between-dates"}

# Людські слаги для одиниць (як їх шукають у Google)
UNIT_SLUG = {"lb": "lbs", "kg": "kg", "oz": "oz", "floz": "fl-oz", "g": "grams", "mg": "mg", "mcg": "mcg",
             "st": "stone", "ton": "tons", "ml": "ml", "l": "liters", "gal": "gallons", "qt": "quarts", "pint": "pints",
             "cup": "cups", "tbsp": "tbsp", "tsp": "tsp", "cc": "cc", "sqft": "square-feet", "sqm": "square-meters",
             "sqin": "square-inches", "sqyd": "square-yards", "sqmi": "square-miles", "acre": "acres", "ha": "hectares",
             "cuft": "cubic-feet", "cuyd": "cubic-yards", "cum": "cubic-meters", "cuin": "cubic-inches", "mm": "mm",
             "cm": "cm", "km": "km", "m": "meters", "in": "inches", "ft": "feet", "yd": "yards", "mi": "miles",
             "nmi": "nautical-miles", "degc": "celsius", "degf": "fahrenheit", "degk": "kelvin", "hr": "hours",
             "min": "minutes", "sec": "seconds", "msec": "milliseconds", "day": "days", "week": "weeks",
             "month": "months", "year": "years", "mph": "mph", "kmh": "kmh", "knot": "knots", "nm": "nm",
             "ftlb": "ft-lbs", "inlb": "in-lbs", "psi": "psi", "bar": "bar", "atm": "atm", "mmhg": "mmhg", "kpa": "kpa",
             "w": "watts", "kw": "kw", "hp": "hp", "amp": "amps", "volt": "volts", "btu": "btu", "j": "joules",
             "kcal": "calories", "byte": "bytes", "kb": "kb", "mb": "mb", "gb": "gb", "tb": "tb", "mbps": "mbps",
             "gbps": "gbps", "px": "pixels", "point": "points", "ftin": "feet-and-inches", "um": "micrometers", "rad": "radians", "deg": "degrees", "grain": "grains", "kj": "kilojoules", "mcm": "meters-and-cm"}

# Категорія за розділом сайту конкурента (перша/друга частина шляху)
DIR_CAT = {"math": "math", "statistics": "math", "algebra": "math", "geometry-plane": "math", "geometry-solids": "math",
           "discretemathematics": "math", "arithmetic": "math", "physics": "science", "chemistry": "science",
           "biology": "science", "ecology": "science", "electric": "science", "finance": "finance",
           "financial": "finance", "health": "health", "sports": "health", "construction": "construction",
           "time": "time-date", "date": "time-date", "cooking": "everyday", "food": "everyday",
           "everyday-life": "everyday", "other": "everyday", "misc": "everyday", "randomizers": "generators",
           "converters": "conversions", "conversion": "conversions", "conversions": "conversions", "convert": "conversions"}

EXCLUDE_PATH = re.compile(r"^/(worldclock|sun|moon|weather|articles?|web|code|tools|blog|news|about|contact|privacy|terms)(/|$)|/calendar/|/time/zones?/|/time/change", re.I)
NON_US = re.compile(r"\b(uk|vat|stamp duty|hmrc|gst|india|indian|lakh|crore|emi|australia|canada|canadian|ireland|irish|nhs|ppf|epf|sip|rupee|pakistan|philippines|nigeria|south africa|zakat|kenya)\b", re.I)


def last_seg(path):
    p = path.split("?")[0].rstrip("/")
    seg = p.split("/")[-1] if p else ""
    return re.sub(r"\.(html?|php|aspx?)$", "", seg.lower())


def intent(domain, path, title):
    """Повертає (key, type, label) або None."""
    base = path.split("?")[0]
    q = dict(re.findall(r"[?&]([a-z0-9_]+)=([^&]+)", path.lower()))
    seg = last_seg(path)
    t = title.lower()
    # іспанські сторінки конкурентів — окремий тип (підтверджений попит іспанською в США)
    if base.startswith(("/pt/", "/de/", "/fr/", "/it/", "/pl/", "/ja/", "/ru/", "/nl/")) or re.search(r"para-|quilometro|conversor", seg):
        return None                                       # інші мови — не наш ринок
    if base.startswith("/es/") or re.match(r"(convertidor|calculadora)", seg):
        k = re.sub(r"^(convertidor|calculadora|conversor)(-de)?-", "", seg)
        for a_, b_ in (("lbs", "libras"), ("lb", "libras"), ("kg", "kilos"), ("kilogramos", "kilos"), ("oz", "onzas"),
                       ("ml", "mililitros"), ("km", "kilometros"), ("y", "a")):
            k = re.sub(rf"(^|-){a_}(?=-|$)", rf"\g<1>{b_}", k)
        return f"es:{k}", "es", title.split("|")[0].strip()
    if re.fullmatch(r"\d+|[a-z]{1,2}|map|index|usa|night|earth-curvature|ton-register-to-cubic-yard|powerball|mega-millions-payout|lottery-(tax|annuity)|calculator", seg):
        return None                                       # сміття / неоднозначні / лотереї
    seg = UNIT_SUFFIX.sub("", re.sub(r"-(calculator|converter|conversion)$", "", seg))

    # --- дати: N days/weeks/months/hours/minutes from today / ago ---
    m = re.search(r"(\d+)-(day|week|month|year|hour|minute)s?-(from-today|from-now|ago|before-today)", seg)
    if m:
        n, unit, rel = m.groups()
        rel = "from-today" if rel in ("from-today", "from-now") else "ago"
        return f"date:{unit}s-{rel}:{int(n)}", "date", f"{n} {unit}s {rel.replace('-', ' ')}"
    if re.search(r"countdown|days-until|until-", seg) or "/countdown" in base:
        k = re.sub(r"(countdown-timer|countdown|how-many-days-until|days-until)-?", "", seg).strip("-") or seg
        return f"countdown:{k}", "countdown", f"countdown: {k.replace('-', ' ')}"
    if base.startswith("/holidays/us/"):
        return f"holiday:{seg}", "countdown", f"{seg.replace('-', ' ')} date"

    # --- зріст: 5ft-7in, 160cm ---
    m = re.match(r"(\d)ft-(\d{1,2})in(-to-(inches|cm|meters))?$", seg)
    if m:
        ft, inch, _, to = m.groups()
        return f"val:height:{ft}ft{inch}in>{to or 'cm'}", "value", f"{ft}'{inch}\" to {to or 'cm'}"
    m = re.match(r"(\d{3})cm$", seg)
    if m and "height" in base:
        return f"val:height:{m.group(1)}cm>ftin", "value", f"{m.group(1)} cm to feet and inches"

    # --- значення конвертера: ?x=80, 29-cm-to-inches ---
    m = re.match(r"(\d+(?:\.\d+)?)-([a-z-]+?)-to-([a-z-]+)$", seg)
    if m:
        n, a, b = m.groups()
        ua, ub = norm_unit(a), norm_unit(b)
        if ua and ub:
            return f"val:{ua}>{ub}:{n}", "value", f"{n} {ua} to {ub}"
    conv = re.match(r"(?:how-many-)?([a-z-]+?)-(?:to|in|into|per|in-a|in-an)-([a-z-]+?)(?:-converter|-conversion|-calculator)?$", seg)
    if conv:
        ua, ub = norm_unit(conv.group(1)), norm_unit(conv.group(2))
        if ua and ub and ua != ub:
            if "x" in q and re.match(r"^\d+(\.\d+)?$", q["x"]):
                return f"val:{ua}>{ub}:{q['x']}", "value", f"{q['x']} {ua} to {ub}"
            howmany = seg.startswith("how-many") or " in a " in t or " in an " in t
            if howmany:
                return f"qa:{ub}-in-{ua}" if " in a" in t and False else f"qa:{ua}-in-{ub}", "qa", title.split("(")[0].strip()
            return f"conv:{ua}>{ub}", "converter", f"{ua} to {ub}"
    # unitconverters/rapidtables: /length/inch-to-feet.htm ok above; «ml-tsp-converter», «oz-ml-converter»
    # «oz-ml», «gallons-ounces», «inch-pounds-foot-pounds»: дві одиниці без «to»
    parts = seg.split("-")
    for i in range(1, len(parts)):
        ua, ub = norm_unit("-".join(parts[:i])), norm_unit("-".join(parts[i:]))
        if ua and ub and ua != ub:
            return f"conv:{ua}>{ub}", "converter", f"{ua} to {ub}"
    if re.search(r"weeks-in-(a-)?year|how-many-weeks", seg):
        return "qa:weeks-in-year", "qa", "how many weeks in a year"
    if "todays-date" in seg or "what-is-today" in seg:
        return "qa:todays-date", "qa", "what is today's date"

    # --- генератори ---
    if re.search(r"random|dice|coin|wheel|picker|generator|shuffle|lottery", seg):
        k = SYN.get(seg.replace("-generator", "").replace("-roller", ""), seg)
        return f"gen:{k}", "generator", seg.replace("-", " ")

    # --- калькулятори / інструменти ---
    if (domain, seg) in SPECIAL:
        k = SPECIAL[(domain, seg)]
        return k, "calculator", k.split(":")[1].replace("-", " ")
    toks = [x for x in re.split(r"[-_]+", seg) if x and x not in STOP]
    if not toks:
        return None
    k = "-".join(toks)
    k = SYN.get(k, k)
    return f"calc:{k}", "calculator", k.replace("-", " ")


# ---------- категорії ----------
CAT_RULES = [
    ("finance", r"loan|mortgage|interest|invest|retire|ira\b|401k|403b|529|annuity|apr|cd\b|savings|debt|credit|lease|refinanc|amortiz|heloc|equity|down payment|present value|future value|irr|npv|bond|dividend|stock|inflation|net worth|budget|rent|house afford|fha|va mortgage|student loan|payoff|compound|simple interest|depreciat|capital gain|estate tax|income tax|tax\b|roth|pension|social security|payback"),
    ("work-pay", r"paycheck|salary|hourly|wage|overtime|time card|timecard|time sheet|timesheet|work hours|pay raise|raise|commission|take home|payroll|pto|annual income|bonus|tip pool|time and a half"),
    ("business", r"margin|markup|profit|roi\b|return on investment|break even|sales tax|discount|revenue|cagr|ebitda|cost per|conversion rate|churn|ltv|invoice|vat|gross|net income|commission"),
    ("health", r"bmi|calorie|bmr|tdee|macro|protein|carb|body fat|lean body|ideal weight|pregnan|ovulation|due date|conception|period|fertile|heart rate|blood|bac\b|alcohol|sleep|pace|steps|walking|running|waist|body type|weight watcher|keto|fasting|water intake|dosage|mg to ml|ml to mg|bra size|calories burned|body surface|a1c|gfr|one rep max|1rm"),
    ("construction", r"concrete|gravel|mulch|square footage|square feet|cubic yard|tile|roof|stair|paint|drywall|board foot|lumber|deck|fence|sod|topsoil|soil|sand|brick|block|asphalt|flooring|carpet|wallpaper|insulation|rebar|btu|hvac|ac size|pool|siding|shingle|joist|rafter|pitch|slope of roof|feet and inches|landscap"),
    ("time-date", r"time|date|day|week|month|year|hour|minute|age|birthday|countdown|holiday|christmas|thanksgiving|halloween|easter|new year|valentine|calendar|clock|military time|duration|elapsed|leap"),
    ("math", r"fraction|percent|average|mean|median|mode|standard deviation|variance|root|exponent|log|lcm|gcf|gcd|factor|prime|ratio|proportion|slope|triangle|circle|area|volume|perimeter|circumference|cylinder|sphere|cone|cube|pyramid|prism|rectangle|square|hypotenuse|pythagor|angle|arc|sector|radius|diameter|probability|statistic|z score|confidence|sample size|matrix|quadratic|algebra|equation|decimal|rounding|round|long division|scientific notation|binary|hex|octal|roman|numbers to words|sum|integer|polynomial|derivative|integral|vector|distance|midpoint|permutation|combination|sequence|big number|significant figure|rational|irrational|ceiling|floor|modulo|percentile|interquartile|outlier|regression|correlation|p value|t test|chi square"),
    ("science", r"velocity|acceleration|force|energy|kinetic|potential|momentum|density|mass|weight on|gravity|pressure|molar|molarity|mole|grams to moles|half life|ohm|voltage|resistor|current|power|watt|wire|wavelength|frequency|speed of|horsepower|torque|percent yield|ph\b|dilution|stoichiometr|gas law|ideal gas|specific heat|heat index|wind chill|dew point|humidity"),
    ("everyday", r"tip|love|zodiac|gpa|grade|test score|gas|fuel|mpg|mileage|tire|shoe size|ring size|dog|cat|pet|gold|silver|currency|cooking|recipe|turkey|coffee|shopping|unit price|electricity|bandwidth|download|screen|aspect ratio|golf|bowling|minecraft|gaming"),
]


def category(key, typ, label, dirs=()):
    if typ in ("converter", "value", "qa") and key.startswith(("conv:", "val:", "qa:")):
        if re.search(r"\b(day|week|month|year|hr|min|sec|msec)\b", key.replace(">", " ").replace(":", " ").replace("-", " ")) \
                and not re.search(r"degc|degf|kg|lb|oz|ml|cm|\bin\b|ft", key):
            return "time-date"
        return "conversions"
    if typ in ("date", "countdown"):
        return "time-date"
    if typ == "generator":
        return "generators"
    text = f" {label} "
    rules = dict(CAT_RULES)
    for first in ("work-pay", "business"):            # спершу наші спеціальні категорії
        if re.search(rules[first], text):
            return first
    for d in dirs:                                     # потім розділ сайту конкурента
        if d in DIR_CAT and DIR_CAT[d] not in ("conversions",):
            return DIR_CAT[d]
    for cat, rx in CAT_RULES:
        if re.search(rx, text):
            return cat
    return "everyday"


YMYL = {"finance", "health"}
VALUE_TIER = {"work-pay": 1.25, "business": 1.2, "finance": 1.2, "construction": 1.08, "time-date": 1.0,
              "math": 0.97, "science": 0.9, "health": 1.0, "everyday": 0.97, "conversions": 0.95, "generators": 0.97,
              "es": 0.9}
TYPE_EASE = {"converter": 1.08, "value": 1.06, "date": 1.06, "qa": 1.08, "countdown": 1.0, "calculator": 1.0,
             "generator": 0.95, "state": 1.1, "es": 1.05, "tool": 0.95}

# Наш стартовий набір (docs/05-roadmap.md) — обов'язково на запуску
CORE = {
    "calc:time-card": "time card calculator", "calc:time-duration": "time duration calculator",
    "calc:hours": "hours calculator", "calc:work-hours": "work hours calculator", "calc:overtime": "overtime calculator",
    "calc:hourly-to-salary": "hourly to salary calculator", "calc:military-time": "military time converter",
    "calc:time": "time calculator", "calc:date": "date calculator", "calc:days-between-dates": "days between dates calculator",
    "calc:gravel": "gravel calculator", "calc:mulch": "mulch calculator", "calc:concrete": "concrete calculator",
    "calc:cubic-yards": "cubic yard calculator", "calc:square-footage": "square footage calculator",
    "calc:board-foot": "board foot calculator", "calc:paint": "paint calculator",
    "calc:percentage": "percentage calculator", "calc:percent-off": "percent off calculator",
    "calc:fraction": "fraction calculator", "calc:scientific": "scientific calculator",
}
CORE_ALIASES = {"calc:military-time-converter": "calc:military-time", "calc:cubic-yard": "calc:cubic-yards",
                "calc:time-card": "calc:time-card", "calc:board-feet": "calc:board-foot",
                "calc:date-to-date": "calc:days-between-dates", "calc:days-between": "calc:days-between-dates",
                "calc:duration": "calc:time-duration", "calc:time-sheet": "calc:time-card", "calc:basic": "calc:scientific"}

STATES = ["alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut", "delaware", "florida",
          "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine",
          "maryland", "massachusetts", "michigan", "minnesota", "mississippi", "missouri", "montana", "nebraska",
          "nevada", "new hampshire", "new jersey", "new mexico", "new york", "north carolina", "north dakota", "ohio",
          "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina", "south dakota", "tennessee", "texas",
          "utah", "vermont", "virginia", "washington", "west virginia", "wisconsin", "wyoming"]


def load_competitors():
    agg = {}
    for r in csv.DictReader(open(os.path.join(DATA, "competitor_pages.csv"), encoding="utf-8")):
        traffic = int(float(r["traffic"] or 0))
        if traffic < 1500 or EXCLUDE_PATH.search(r["path"]) or NON_US.search(r["title"] + " " + r["path"]):
            continue
        it = intent(r["domain"], r["path"], r["title"])
        if not it:
            continue
        key, typ, label = it
        key = CORE_ALIASES.get(key, key)
        a = agg.setdefault(key, {"key": key, "type": typ, "label": label, "traffic": 0, "min_rd": 10**9,
                                 "domains": set(), "example": "", "title": "", "dirs": []})
        rd = int(float(r["refdomains"] or 0))
        a["domains"].add(r["domain"])
        a["dirs"] += [d for d in r["path"].split("?")[0].strip("/").split("/")[:-1] if d not in a["dirs"]]
        a["min_rd"] = min(a["min_rd"], rd)
        if traffic > a["traffic"]:
            a.update(traffic=traffic, example=r["url"], title=r["title"])
    return agg


def add_states(agg):
    best = defaultdict(lambda: (0, 0, 0))
    for r in csv.DictReader(open(os.path.join(DATA, "suggestions.csv"), encoding="utf-8")):
        kw = r["keyword"]
        if "paycheck" not in kw or re.search(r"adp|smartasset|paycheckcity|gusto|quickbooks|onpay|surepayroll|uk|canada", kw):
            continue
        for st in STATES:
            if re.search(rf"\b{st}\b", kw) and not (st == "virginia" and "west virginia" in kw) \
                    and not (st == "washington" and "washington dc" in kw):
                kind = "hourly" if "hourly" in kw else "salary"
                v = int(float(r["volume"]))
                if v > best[(st, kind)][0]:
                    best[(st, kind)] = (v, float(r["cpc"] or 0), r["sd"])
    for (st, kind), (v, cpc, sd) in best.items():
        if v < 1000:
            continue
        slug = st.replace(" ", "-")
        key = f"state:paycheck-{kind}:{slug}"
        label = f"{st.title()} {'hourly ' if kind == 'hourly' else ''}paycheck calculator"
        agg[key] = {"key": key, "type": "state", "label": label, "traffic": v, "min_rd": 0,
                    "domains": {"(ubersuggest)"}, "example": "", "title": label, "volume": v, "cpc": cpc, "sd": sd}


def add_research(agg):
    """Наші перевірені запити, яких немає серед сторінок конкурентів (іспанська, розширення)."""
    for r in csv.DictReader(open(os.path.join(HERE, "keywords_es_us.tsv"), encoding="utf-8"), delimiter="\t"):
        v = int(r["volume_us"])
        if v < 1000 or r["keyword_es"] == "calculadora":
            continue
        key = "es:" + re.sub(r"^calculadora-de-", "", r["keyword_es"].replace(" ", "-"))
        if key in agg:                    # уже є від конкурента — лише додаємо обсяг
            agg[key]["volume"] = v
            continue
        agg[key] = {"key": key, "type": "es", "label": r["keyword_es"], "traffic": v, "min_rd": 0,
                    "domains": {"(ubersuggest es)"}, "example": "", "title": r["keyword_es"], "volume": v,
                    "cpc": float(r["cpc"]), "sd": r["sd"]}


def us(u):
    return UNIT_SLUG.get(u, u)


def slug_for(a):
    k, t = a["key"], a["type"]
    body = k.split(":", 1)[1]
    if t == "converter":
        u1, u2 = body.split(">")
        return f"/{us(u1)}-to-{us(u2)}/"
    if t == "value":
        if body.startswith("height:"):
            src, dst = body.split(":")[1].split(">")
            m = re.match(r"(\d)ft(\d+)in", src)
            if m:
                return f"/{m.group(1)}-feet-{m.group(2)}-inches-to-{us(dst) if dst != 'cm' else 'cm'}/"
            return f"/{src.replace('cm', '')}-cm-to-feet-and-inches/"
        pair, n = body.rsplit(":", 1)
        u1, u2 = pair.split(">")
        return f"/{n}-{us(u1)}-to-{us(u2)}/"
    if t == "qa":
        m = re.match(r"([a-z]+)-in-([a-z]+)$", body)
        if m:
            return f"/how-many-{us(m.group(1))}-in-a-{us(m.group(2)).rstrip('s')}/"
        return "/" + body.replace("todays-date", "what-is-todays-date").replace("weeks-in-year", "how-many-weeks-in-a-year") + "/"
    if t == "countdown" and k.startswith("holiday:"):
        return f"/when-is-{body}/"
    if t == "date":
        rel, n = body.split(":")
        return f"/{n}-{rel}/"
    if t == "state":
        kind, st = body.split(":")
        return f"/{st}-{'hourly-' if 'hourly' in kind else ''}paycheck-calculator/"
    if t == "es":
        return f"/es/{body}/" if "-a-" in body or body.startswith("dolar") else f"/es/calculadora-de-{body}/"
    if t in ("qa", "countdown", "generator"):
        return f"/{body}/"
    return f"/{body}-calculator/"


def score(a, cat):
    demand = math.log10(max(a["traffic"], 10))          # 4 ≈ 10k, 6 ≈ 1M
    rd = a["min_rd"] if a["min_rd"] < 10**9 else 50
    link_ease = 1.08 if rd <= 10 else 1.04 if rd <= 50 else 1.0 if rd <= 200 else 0.93
    s = demand * TYPE_EASE.get(a["type"], 1) * link_ease * VALUE_TIER.get(cat, 1)
    if cat in YMYL:
        s *= 0.85
    return round(s, 3)


# Коли категорія/тип може стартувати (місяць; 0 = запуск)
GATE = {"finance": 4, "health": 3, "science": 5, "generators": 2, "business": 2, "state": 3, "es": 5}
# Пропускна здатність: скільки нових сторінок на місяць (без хабів і службових)
CAPACITY = {0: 130, 1: 60, 2: 65, 3: 70, 4: 75, 5: 75, 6: 75, 7: 75, 8: 75, 9: 75, 10: 75, 11: 75, 12: 75}
CALC_TYPES = ("calculator", "generator", "state")
CALC_CAP = 26        # калькулятори складніші: не більше 26 на місяць (на запуску — 21 стартовий)
# Категорії стартових калькуляторів задаємо явно (у конкурентів вони лежать у різних розділах)
CORE_CAT = {"calc:percent-off": "math", "calc:percentage": "math", "calc:fraction": "math", "calc:scientific": "math",
            "calc:time-card": "work-pay", "calc:overtime": "work-pay", "calc:hourly-to-salary": "work-pay",
            "calc:work-hours": "work-pay", "calc:hours": "time-date", "calc:time-duration": "time-date",
            "calc:military-time": "time-date", "calc:time": "time-date", "calc:date": "time-date",
            "calc:days-between-dates": "time-date", "calc:gravel": "construction", "calc:mulch": "construction",
            "calc:concrete": "construction", "calc:cubic-yards": "construction", "calc:square-footage": "construction",
            "calc:board-foot": "construction", "calc:paint": "construction", "calc:time-half": "work-pay",
            "calc:tip": "everyday", "calc:cpm": "business", "calc:price-elasticity-demand": "business",
            "calc:income-elasticity-demand": "business", "calc:cross-price-elasticity": "business",
            "calc:winning-percentage": "everyday", "calc:height-percentile": "health"}
# Запуск: склад за типами (крім 21 стартового калькулятора)
LAUNCH_MIX = {"converter": 52, "value": 32, "date": 16, "qa": 5, "countdown": 4}
# Гарантовані місця щомісяця, коли фаза відкрита: (фільтр, кількість)
RESERVE = [
    (lambda r: r["type"] == "state", {3: 18, 4: 10, 5: 10}),
    (lambda r: r["category"] == "math", {m: 7 for m in range(1, 13)}),
    (lambda r: r["category"] == "finance", {m: 5 for m in range(4, 13)}),
    (lambda r: r["category"] == "health", {m: 3 for m in range(3, 13)}),
    (lambda r: r["category"] == "construction" and r["type"] == "calculator", {m: 3 for m in range(1, 13)}),
    (lambda r: r["category"] == "business", {m: 2 for m in range(2, 13)}),
    (lambda r: r["type"] == "generator", {m: 2 for m in range(2, 13)}),
    (lambda r: r["category"] == "work-pay" and r["type"] == "calculator", {m: 2 for m in range(1, 13)}),
    (lambda r: r["category"] == "everyday", {m: 2 for m in range(1, 13)}),
    (lambda r: r["category"] == "time-date" and r["type"] == "calculator", {m: 1 for m in range(1, 13)}),
    (lambda r: r["category"] == "science", {m: 2 for m in range(5, 13)}),
    (lambda r: r["type"] == "es", {m: 3 for m in range(5, 13)}),
    (lambda r: r["type"] in ("date", "countdown", "qa"), {m: 6 for m in range(1, 13)}),
]
# Стеля для конвертерів і сторінок значень після запуску, щоб сайт не став «лише конвертером»
CONV_CAP = 32


def schedule(rows):
    """Розкладає сторінки по місяцях 0–12. Порожній month = беклог (після 12 місяців)."""
    for r in rows:
        r["month"] = r.get("fixed_month", "")
    free = sorted([r for r in rows if r["month"] == ""], key=lambda r: (not r["core"], -r["score"]))
    used, used_calc = defaultdict(int), defaultdict(int)

    def gate_ok(r, m):
        return m >= GATE.get(r["type"], GATE.get(r["category"], 0))

    def take(r, m):
        r["month"] = m
        used[m] += 1
        if r["type"] in CALC_TYPES:
            used_calc[m] += 1

    used_conv = defaultdict(int)

    def calc_ok(r, m):
        if r["type"] in ("converter", "value") and m > 0 and used_conv[m] >= CONV_CAP:
            return False
        return r["type"] not in CALC_TYPES or used_calc[m] < (21 if m == 0 else CALC_CAP)

    _take = take

    def take(r, m):
        _take(r, m)
        if r["type"] in ("converter", "value"):
            used_conv[m] += 1

    # 0. запуск: стартові калькулятори + склад за типами
    for r in free:
        if r["core"]:
            take(r, 0)
    for typ, n in LAUNCH_MIX.items():
        for r in [x for x in free if x["month"] == "" and x["type"] == typ and gate_ok(x, 0)][:n]:
            take(r, 0)
    # 1..12: спершу гарантовані місця, потім найкращі за балом
    for m in range(1, 13):
        for flt, per_month in RESERVE:
            n = per_month.get(m, 0)
            for r in [x for x in free if x["month"] == "" and flt(x) and gate_ok(x, m)]:
                if n <= 0 or used[m] >= CAPACITY[m]:
                    break
                if calc_ok(r, m):
                    take(r, m)
                    n -= 1
        for r in free:
            if used[m] >= CAPACITY[m]:
                break
            if r["month"] == "" and gate_ok(r, m) and calc_ok(r, m):
                take(r, m)


def main():
    agg = load_competitors()
    add_states(agg)
    add_research(agg)
    rows = []
    for a in agg.values():
        cat = "es" if a["type"] == "es" else ("work-pay" if a["type"] == "state" else
                                              CORE_CAT.get(a["key"]) or category(a["key"], a["type"], a["label"], a.get("dirs", [])))
        rows.append({**a, "category": cat, "score": score(a, cat), "slug": slug_for(a),
                     "core": a["key"] in CORE})
    # службові сторінки й хаби (не з даних конкурентів, але теж сторінки сайту)
    SERVICE = ["/", "/about/", "/methodology/", "/editorial-policy/", "/authors/", "/contact/", "/privacy/", "/terms/"]
    HUBS = {"time-date": 0, "work-pay": 0, "construction": 0, "math": 0, "conversions": 0, "business": 2,
            "generators": 2, "health": 3, "finance": 4, "everyday": 1, "science": 5}
    for s in SERVICE:
        rows.append({"key": "page:" + s, "type": "service", "label": s, "traffic": 0, "min_rd": 0, "domains": set(),
                     "example": "", "category": "site", "score": 100, "slug": s, "core": True, "fixed_month": 0})
    for h, m in HUBS.items():
        rows.append({"key": "hub:" + h, "type": "hub", "label": f"{h} hub", "traffic": 0, "min_rd": 0, "domains": set(),
                     "example": "", "category": h, "score": 100, "slug": f"/{h}/", "core": m == 0, "fixed_month": m})
    rows.append({"key": "hub:es", "type": "hub", "label": "es home", "traffic": 0, "min_rd": 0, "domains": set(),
                 "example": "", "category": "es", "score": 100, "slug": "/es/", "core": False, "fixed_month": 5})
    # обов'язкові стартові, яких могло не знайтись у даних конкурентів
    have = {r["key"] for r in rows}
    for k, lbl in CORE.items():
        if k not in have:
            cat = category(k, "calculator", lbl)
            rows.append({"key": k, "type": "calculator", "label": lbl, "traffic": 0, "min_rd": 0, "domains": set(),
                         "example": "", "title": lbl, "category": cat, "score": 99, "slug": slug_for({"key": k, "type": "calculator"}),
                         "core": True})

    schedule(rows)
    rows.sort(key=lambda r: (r["month"] if r["month"] != "" else 99, -r["score"]))
    out = os.path.join(DATA, "page_inventory.csv")
    with open(out, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["month", "type", "category", "slug", "label", "competitor_traffic", "min_refdomains",
                    "competitors", "score", "example_url", "key"])
        for r in rows:
            w.writerow([r["month"], r["type"], r["category"], r["slug"], r["label"], r["traffic"],
                        "" if r["min_rd"] >= 10**9 else r["min_rd"], " ".join(sorted(r["domains"])),
                        r["score"], r["example"], r["key"]])
    planned = [r for r in rows if r["month"] != ""]
    print(f"інтентів усього: {len(rows)} · заплановано на 12 міс: {len(planned)} · беклог: {len(rows) - len(planned)}")
    by = defaultdict(lambda: defaultdict(int))
    for r in planned:
        by[r["month"]][r["type"]] += 1
    for m in sorted(by):
        print(m, dict(by[m]), sum(by[m].values()))


if __name__ == "__main__":
    main()
