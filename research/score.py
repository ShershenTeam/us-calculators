"""Рейтинг можливостей: реальний обсяг/SD (keywords_en_us.tsv) + сила топ-10 Google (serp_google_us.md).

Для кожного запиту — DA органічних результатів топ-10 (None = застосунок/відео/соцмережа,
у розрахунку медіани вважається DA 60). Прапорці:
  ymyl  — здоров'я/гроші «your money or your life»: Google вимагає E-E-A-T, новому сайту важче
  live  — потрібні живі дані (курси, ціни, тарифи)
  hard  — складна логіка (податки штатів, символьна алгебра)
  skip  — не робимо (неоднозначний намір, офіційний сайт займає видачу, гемблінг)
Формула (0–100): 35% попит + 40% легкість + 15% CPC + 10% простота розробки − штрафи.
"""
import csv, math, os, statistics

HERE = os.path.dirname(os.path.abspath(__file__))
N = None
SERP = {
    "percent off calculator": ([74, 68, 23, N, 45, N, 74, 5, 26, 11], ""),
    "date calculator": ([91, 74, 91, N, 94, 29, 43, 5, 41, 19], ""),
    "mortgage calculator": ([56, 82, 68, 74, 90, 26, 85, 86, 88, 52], "ymyl"),
    "time card calculator": ([43, 19, 74, 29, 62, 19, 37, 36, 27, 19], ""),
    "cd calculator": ([82, 74, 37, 58, 62, 59, 47, 82, 86, 88], "ymyl"),
    "concrete calculator": ([74, 52, N, 61, 41, 48, 45, 33, 15, 12], ""),
    "square footage calculator": ([60, 74, 29, 6, 15, 37, N, 68, N], ""),
    "gravel calculator": ([74, 68, 21, 57, 23, 21, 60, 15, 9, 20], ""),
    "overtime calculator": ([68, 58, 22, 85, 37, 50, 4, 49, 85, 4], ""),
    "hours calculator": ([74, 60, 43, 36, 19, 60, 91, 37, 22, 62], ""),
    "gpa calculator": ([33, 74, 80, 84, 89, 81, 92, 84], ""),
    "paycheck calculator": ([87, 70, 87, 55, 87, 64, N, 68, 41, 55], "ymyl hard"),
    "salary calculator": ([87, 74, 70, 55, 87, 70, 59, 87, 88], "ymyl hard"),
    "percentage calculator": ([45, 74, 82, 60, N, 26, 68, 19, N], ""),
    "age calculator": ([74, 94, N, 60, N, 66, 40, 68, 91, N], ""),
    "tip calculator": ([74, 68, 88, N, 74, 60, 40, 37], ""),
    "tdee calculator": ([50, 74, 94, 5, 38, 23, 39, 28, 22, 64], "ymyl"),
    "ovulation calculator": ([78, 94, 74, 80, 79, 56, 63, 70], "ymyl"),
    "401k calculator": ([74, 88, 33, 38, 88, 29, 82, 60, 59], "ymyl"),
    "compound interest calculator": ([76, 88, 82, 58, 37, 49, 38, 77, 58, 49], "ymyl"),
    "car loan calculator": ([74, 84, 82, 86, 63, 85, 92, 38, 28, 32], "ymyl"),
    "loan calculator": ([82, 74, 32, 64, 86, 51, 68, 40, 84, 41], "ymyl"),
    "amortization calculator": ([74, 46, 82, 38, 51, 72, N, 37, 36, 31], "ymyl"),
    "home equity loan calculator": ([26, 74, 57, 74, N, 38, N, 62, 70], "ymyl"),
    "roth ira calculator": ([31, 31, 35, 53], "ymyl"),
    "fraction calculator": ([74, N, 43, 61, 50, 51, N, N, 60], ""),
    "mulch calculator": ([29, 74, 90, 25, 44, N, 27, 60, 28], ""),
    "one rep max calculator": ([47, 69, 74, 56, 39, 62, N, 14, 49, 18], ""),
    "time duration calculator": ([10, 3, 1, 1, 6, 1, 1, 3, 3], ""),
    "days between dates calculator": ([91, 29, 74, 68, 58, 94, 19, 44, N, 85], ""),
    "calorie calculator": ([74, 92, 69, 65, 91, 94, 31, N, 94, 95], "ymyl"),
    "calorie deficit calculator": ([74, 31, 92, 94, 95, 64, 91, 12], "ymyl"),
    "macro calculator": ([74, 48, 22, 91, 94, 8, 38, 72, 19], "ymyl"),
    "sleep calculator": ([40, 75, 74, 16, 75, 91, 45, 37, 65, 56], ""),
    "due date calculator": ([81, 80, 91, 43, 74, 54, 41, 79, 58], "ymyl"),
    "hourly to salary calculator": ([57, 58, 91, 37, 87, 68, 74, 26, 26], ""),
    "gold calculator": ([26, 40, 27, 11, 61, 37, 12, 28, 36], "live"),
    "odds calculator": ([53, 33, 92, 61, 83, N, 92, 29], "skip"),
    "inches to feet": ([52, 68, N, 83, 56, 57, N, 70, 76], ""),
    "retirement calculator": ([88, 71, 74, 81, 81, 83, 74, 88, 89], "ymyl"),
    "inflation calculator": ([90, 65, 79, 74, 65, 62, 60, 21, 51, 68], "live"),
    "investment calculator": ([74, 74, 76, 88, 37, 70, 88, 51, 32], "ymyl"),
    "bmi calculator": ([95, 74, 94, 91, 93, 88, 46, 41], "ymyl"),
    "scientific calculator": ([24, 4, N, 37, 85, 77, 74, 46, N], ""),
    "quadratic formula calculator": ([60, 74, N, 51, 57, 61, 50, N], ""),
    "z score calculator": ([74, 15, 53, 60, 85, 40, N, 3], ""),
    "log calculator": ([11, N, N, N, 14, 20, N, N], ""),
    "529 calculator": ([31, 38, 44, 4, 1, 4, 49, 16], "ymyl"),
    "gas calculator": ([74, 68, 86, 80, 42, 89, 64, 63, 21, 25], ""),
    "algebra calculator": ([51, 61, 74, 36, N, N, 45, 37], "hard"),
    "birthday calculator": ([74, 40, N, 93, 94, 66, 44, 60, 91], ""),
    "love calculator": ([52, 74, 32, 11, 67, 79, N, 18, N], ""),
    "bmr calculator": ([74, 47, 86, 91, 65, 91, 89, 54, 85], "ymyl"),
    "usps postage calculator": ([90, 90, 90, 60, 25, 90, 40], "skip live"),
    "volume calculator": ([74, 68, 80, 60, 19, 42, 45, 40], ""),
}
BUILD = {  # 1 = дуже просто, 3 = складно
    "mortgage calculator": 2, "cd calculator": 1, "time card calculator": 2, "paycheck calculator": 3,
    "salary calculator": 3, "scientific calculator": 2, "algebra calculator": 3, "gold calculator": 2,
    "inflation calculator": 2, "retirement calculator": 3, "home equity loan calculator": 2,
    "amortization calculator": 2, "car loan calculator": 2, "loan calculator": 2, "401k calculator": 2,
    "roth ira calculator": 2, "529 calculator": 2, "investment calculator": 2, "compound interest calculator": 1,
    "concrete calculator": 2, "gpa calculator": 2, "tdee calculator": 1, "macro calculator": 2,
}


def load():
    rows = {}
    with open(os.path.join(HERE, "keywords_en_us.tsv"), encoding="utf-8") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            rows[r["keyword"]] = r
    return rows


def main():
    kw = load()
    out = []
    for k, (das, flags) in SERP.items():
        if k not in kw:
            continue
        vol, cpc, sd = int(kw[k]["volume"]), float(kw[k]["cpc"]), int(kw[k]["sd"])
        vals = [d if d is not None else 60 for d in das]
        med = statistics.median(vals)
        weak = sum(1 for d in das if d is not None and d < 30)
        top3_min = min(v for v in vals[:3])
        demand = min(100, math.log10(max(vol, 10)) / 6.3 * 100)          # 2M ≈ 100
        ease = (0.35 * (100 - sd) + 0.35 * (100 - med) + 0.15 * min(weak, 6) / 6 * 100
                + 0.15 * (100 - top3_min))
        value = min(100, cpc / 6 * 100)
        build = {1: 100, 2: 60, 3: 20}[BUILD.get(k, 1)]
        score = 0.35 * demand + 0.40 * ease + 0.15 * value + 0.10 * build
        if "ymyl" in flags: score -= 6
        if "hard" in flags: score -= 6
        if "live" in flags: score -= 3
        if "skip" in flags: score = 0
        out.append((round(score, 1), k, vol, sd, int(med), weak, top3_min, cpc, flags))
    out.sort(reverse=True)
    lines = ["| # | Запит | Обсяг | SD | Медіана DA топ-10 | Слабких (DA<30) | Мін. DA в топ-3 | CPC | Прапорці | Бал |",
             "|---|---|---|---|---|---|---|---|---|---|"]
    for i, (s, k, vol, sd, med, weak, t3, cpc, fl) in enumerate(out, 1):
        lines.append(f"| {i} | {k} | {vol:,} | {sd} | {med} | {weak} | {t3} | ${cpc:.2f} | {fl or '—'} | **{s}** |".replace(",", " "))
    md = "\n".join(lines)
    open(os.path.join(HERE, "opportunity_ranking.md"), "w", encoding="utf-8").write(
        "# Рейтинг можливостей (Google США, вересень 2026)\n\n"
        "Згенеровано `research/score.py` з `keywords_en_us.tsv` + `serp_google_us.md`.\n\n" + md + "\n")
    print(md)


if __name__ == "__main__":
    main()
