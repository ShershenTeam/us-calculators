# Бриф сторінки: Gravel Calculator

> Заповнено Claude автоматично за `docs/09-page-brief-checklist.md` (без Ubersuggest). Дані конкурентів — з `research/` та прямого розбору сторінок 30.09.2026. Сторінка будується за цим брифом (spec: `specs/001-site-skeleton-gravel/`).

| Поле | Значення |
|---|---|
| Тип | калькулятор |
| Категорія | Home & Construction (`construction`) |
| URL | `/gravel-calculator/` |
| Місяць за планом | 0 (запуск), рядок 140 аркуша Launch |
| Відповідальний | Claude Code (розробка), рев'ю — власник |
| Рецензент (для YMYL) | не потрібен (не YMYL) |
| Дата аналізу | 30.09.2026 |

## 0. Чи варто

- Є в `Page_Plan_12_months.xlsx` (Launch #140; трафік найкращого конкурента 43 655/міс; мінімум донорів 107).
- Немає канібалізації з: `/cubic-yards-calculator/` (універсальний об'єм, без щільності й тонн), `/mulch-calculator/` (мішки мульчі, інша щільність), `/concrete-calculator/` (мішки бетону). Наміри різні. Запити «pea gravel calculator», «gravel driveway calculator», «gravel calculator tons» — на цю сторінку (режими/типи всередині).
- Пілот стадії C з `docs/10-build-guide.md`: «легкий, слабкий топ, SD 21».

## 1. Запит і намір

| Запит | Обсяг | SD | CPC | Куди |
|---|---|---|---|---|
| **головний:** gravel calculator | 60 500 | 21 | $2.58 | ця сторінка |
| pea gravel calculator | ~8 000 (оцінка з підказок) | — | — | ця сторінка (тип гравію) |
| gravel driveway calculator | ~5 000 (оцінка) | — | — | ця сторінка (пресет «Driveway, 4 in») |
| how much gravel do i need | ~6 000 (оцінка) | — | — | ця сторінка (H1/перше речення, FAQ) |
| gravel calculator tons / cubic yards to tons gravel | ~4 000 (оцінка) | — | — | ця сторінка (результат у тоннах + таблиця) |
| how many square feet does a ton of gravel cover | PAA | — | — | ця сторінка (таблиця покриття) |
| crushed stone calculator, #57 stone calculator | — | — | — | ця сторінка (тип гравію) |
| gravel cost / price per ton | — | — | — | ця сторінка (поле ціни); окрема сторінка «gravel prices by state» — беклог |
| topsoil calculator, sand calculator | — | — | — | окремі сторінки (беклог, той самий движок) |

- **Сезонність:** пік квітень–червень і серпень–вересень (сезон ландшафтних робіт у США). Опублікувати до лютого 2027 — для запуску вкладаємось.
- **Намір одним реченням:** домовласник або дрібний підрядник у дворі/на об'єкті з телефона хоче знати, скільки замовити гравію — в кубічних ярдах **і** тоннах (постачальники продають і так, і так), для однієї або кількох ділянок, з поправкою на ущільнення й запас, і приблизну вартість.
- **Питання людей (PAA, форуми):**
  1. How much does a yard of gravel weigh? (≈ 2 400–2 900 lb, залежить від типу)
  2. How many square feet does a ton of gravel cover? (≈ 100 ft² при 2 in, 60 ft² при 4 in)
  3. How deep should gravel be for a driveway / walkway / patio base? (4–6 in / 2–3 in / 4 in)
  4. How many yards are in a ton of gravel? (≈ 0,7 yd³)
  5. Do you order gravel by the yard or by the ton?
  6. How much is a truckload of gravel? / how many bags of pea gravel in a yard? (54 мішки по 0,5 ft³)
  7. Should I add extra for compaction? (так, 5–15 % + запас)
  8. How much gravel do I need for a 10×10 area? / for a 12×12 patio?
- **Що показує Google:** AI Overview ☐ (немає стабільно) · featured snippet ☑ (формула «L × W × D ÷ 27») · вбудований калькулятор Google ☐ · відео ☐ · PDF ☐ · застосунки ☐ · Reddit/форуми ☑ (tractorbynet, r/landscaping у хвостах).
- **Висновок для формату сторінки:** калькулятор на першому екрані з готовим прикладом; перше речення — пряма відповідь із формулою; таблиця «тонни на ярд за типом» і таблиця покриття — саме їх цитує сніпет. Форуми в топі означають, що інструменти погано закривають «кілька ділянок» і «скільки саме замовити».

## 2. Конкуренти

**Конкуренти з такою сторінкою** (`research/data/competitor_pages.csv` + `serp_google_us.md`):

| # | Сайт і сторінка | Трафік/міс (оцінка) | Донори сторінки | DA |
|---|---|---|---|---|
| 1 | calculator.net `/gravel-calculator.html` | 43 655 | 107 | 74 |
| 2 | omnicalculator.com `/construction/gravel` | 8 193 | 205 | 68 |
| 3 | inchcalculator.com `/gravel-calculator/` | 7 502 | 166 | 57 |
| 4 | calculatorsoup.com `/calculators/construction/gravel-calculator.php` | — | — | 60 |
| 5 | gigacalculator.com | 60 | 136 | — |
| 6–10 | gravelshop (21), gravelcalculator.site (23), ficksupply (21), hellogravel (15), arizonasandandgravel (9) | — | — | 9–23 |

**Скільки посилань приблизно треба для топ-5:** 6 із 10 сайтів топу мають DA < 30; постачальники з DA 9–23 стоять у топ-10 майже без посилань. Оцінка: 15–30 донорів для топ-5, 50+ для топ-3 (при сильнішій сторінці).

**Матриця топ-3:**

| Критерій | calculator.net | omnicalculator | inchcalculator | Ми |
|---|---|---|---|---|
| Поля / одиниці | прямокутник, коло, або площа; глибина; 4 пресети щільності + власна; ціна за об'єм/масу; розмір мішка | довжина/ширина або площа; глибина; ~8 типів гравію; ціна | L×W, або площа, або об'єм; глибина; 7 матеріалів; ціна за тонну/ярд | **кілька ділянок** (прямокутник, коло, трикутник, площа), imperial/metric перемикач, 10 типів гравію з видимою щільністю, власна щільність, запас %, ціна за yd³ або тонну, розмір мішка |
| Значення за замовчуванням | порожньо | 105 lb/ft³, розміри порожні | порожньо | **готовий приклад 10 × 10 ft × 3 in, crushed stone** |
| Рахує без кнопки | ні (кнопка Calculate) | так | ні (кнопка) | **так, під час введення** |
| Пояснює результат | ні | частково (текст) | покроково в тексті | **«How it's calculated» з підставленими числами** |
| Таблиці / графіки | 4 таблиці (щільності) | 0 | 2 таблиці (тонни/ярд, ярди/тонну) | таблиця типів (lb/ft³, т/yd³), **таблиця покриття 1 yd³ і 1 т за глибиною**, таблиця типових проєктів |
| Друк / експорт / збереження / посилання | ні | share | ні | **Copy · Share (стан у URL) · Print · CSV** |
| Мобільна зручність (1–5) | 2 (десктопна форма, дрібні поля) | 3 (важкий JS, реклама) | 3 | 5 (mobile-first, липкий результат) |
| Швидкість, реклама | швидко, банери | повільно, багато реклами | середньо | статичний HTML, слот після результату |
| Обсяг тексту, H2 | 1 740 слів, без H2 | 2 669 слів, 8 H2 | ~1 200 слів, 7 H2 | 900–1 300 слів, 7 H2 |
| Формула, приклади, FAQ | формула є, FAQ немає | формула, приклад двору, 4 FAQ | формула покроково, 3 FAQ | формула + приклади + **8 FAQ** |
| Автор, джерела, дата, schema | нічого | автори, рецензент, FAQPage, без дати | автор, рецензент, без дати | автор, **джерела (NIST, DOT), дата оновлення**, WebApplication + FAQPage + BreadcrumbList |
| Title / description | «Gravel Calculator» | «Gravel Calculator \| How much gravel do you need?» | «Gravel Calculator - Estimate Yards and Tons» | «Gravel Calculator – Yards, Tons & Bags for Multiple Areas» |

**Скарги користувачів (форуми tractorbynet, блоги постачальників, aggregatemarkets):**
- «Ordered by the yard, supplier sells by the ton» — плутанина ярди/тонни.
- «Didn't account for compaction, came up short» — брак запасу на ущільнення.
- «Two deliveries because I under-ordered» / «pile left over» — потрібен чіткий «order this much».
- «Driveway isn't a rectangle» — L-подібні ділянки, доріжка + майданчик.
- «Bags vs bulk — when is bulk cheaper?» — потрібне порівняння мішків і насипу.

**Must-have:** довжина/ширина/глибина, площа напряму, тип гравію зі щільністю, результат у yd³ і тоннах, ціна.
**Найкраще в когось одного:** щільність за типами (calculatorsoup, 14 матеріалів), таблиця yd³↔т (inchcalculator), поправка на ущільнення/запас (calculatorsoup), share (omnicalculator).
**Прогалини:** кілька ділянок у всіх трьох; готовий приклад; розрахунок без кнопки; мішки vs насип; таблиця покриття 1 т за глибиною; друк/CSV; джерела щільності.

## 3. Формула

- **Першоджерела:**
  - NIST SP 811 / NIST Handbook 44, Appendix C — точні коефіцієнти: 1 ft = 0,3048 m; 1 yd = 0,9144 m; 1 yd³ = 27 ft³ = 0,764554857984 m³; 1 lb = 0,45359237 kg; 1 short ton = 2 000 lb.
  - Специфікації DOT/держзакупівель для #57 (ASTM C29 / AASHTO T19): dry loose 81 lb/ft³, dry rodded 92 lb/ft³ (Louisiana OSP spec 8616800-02). Практика постачальників для замовлення: 1,4 т/yd³ (≈ 104 lb/ft³) — beztрибуємо як типове «як везуть» значення.
  - Таблиці постачальників/калькуляторів (calculatorsoup, inchcalculator) як звірка: gravel 1,4–1,7 т/yd³; pea gravel 1,25–1,5; river rock ~1,4; crusher run/#411 ~1,5; DGA ~1,7; riprap 1,35–2,0.
- **Формула:**
  - Площа: прямокутник `L × W`; коло `π × (D/2)²`; трикутник `½ × b × h`; або пряма площа.
  - Об'єм ft³ = `Area(ft²) × Depth(in) ÷ 12`; yd³ = `ft³ ÷ 27`; m³ = `yd³ × 0,764554857984`.
  - Із запасом: `V_order = V × (1 + waste%)`.
  - Вага lb = `V_order(ft³) × density(lb/ft³)`; US tons = `lb ÷ 2000`.
  - Мішки = `ceil(V_order(ft³) ÷ bagSize(ft³))`, типово 0,5 ft³.
  - Вартість = `yd³ × pricePerYd³` або `tons × pricePerTon` (яку ціну ввели).
- **Звірка з конкурентами** (10 × 10 ft, 3 in, щільність 105 lb/ft³ = 1,4175 т/yd³, без запасу):

| Вхідні дані | calculator.net | omnicalculator | inchcalculator | Ми | Розбіжність і чому |
|---|---|---|---|---|---|
| 10×10 ft, 3 in | 0,93 yd³ (25 ft³); вага залежить від пресету | 0,926 yd³; 1,31 т при 105 lb/ft³ | 0,93 yd³; 1,3–1,6 т (діапазон 1,4–1,7 т/yd³) | 0,926 yd³ = 25 ft³; 2 625 lb = 1,31 т | Об'єм збігається у всіх. Тонни різні лише через щільність: ми показуємо її явно й даємо змінити |
| 20×10 ft, 4 in | 2,47 yd³ | 2,469 yd³ | 2,47 yd³, 3,5–4,2 т | 2,469 yd³; 3,50 т при 105 lb/ft³ | збіг |
| коло D = 8 ft, 2 in | 0,31 yd³ | — (немає кола) | — (немає кола) | 0,3103 yd³ | збіг з calculator.net |

**Поля:**

| Поле | Одиниця | Діапазон | За замовчуванням | Валідація |
|---|---|---|---|---|
| Shape | rectangle / circle / triangle / area | — | rectangle | — |
| Length, Width (або Diameter; Base, Height; Area) | ft (metric: m); площа ft² (m²) | 0–100 000 | 10, 10 | число ≥ 0; порожнє = 0 з підказкою |
| Depth | in (metric: cm) | 0–120 in | 3 | число ≥ 0; > 24 in — попередження «unusually deep» |
| Gravel type | список | — | Crushed stone (#57), 105 lb/ft³ | — |
| Custom density | lb/ft³ (kg/m³) | 50–200 | 105 | попередження поза діапазоном |
| Waste / compaction | % | 0–50 | 10 | ціле |
| Price (optional) | $ per yd³ або per ton | 0–10 000 | порожньо | число ≥ 0 |
| Bag size | ft³ | 0,4 / 0,5 / 1 / custom | 0,5 | > 0 |

- **Видимі припущення:** «Density: 105 lb/ft³ (≈ 1.42 tons/yd³) — change it if your supplier quotes another», «+10 % for compaction and uneven ground». Обидва редагуються.
- **Округлення / точність:** об'єм — 2 знаки (yd³) і 1 знак (ft³); тонни — 2 знаки; мішки — округлення вгору до цілого; вартість — до цента. Внутрішні розрахунки без округлення.
- **Граничні випадки:** 0 у будь-якому вимірі → площа 0, без помилки; від'ємне → помилка під полем, ділянка виключена з суми; дуже великі числа → форматування з роздільниками; неможливі значення в URL → значення за замовчуванням; перемикання metric конвертує введені значення.

**Еталонні приклади (≥ 5, → `logic.test.ts`):**

| # | Вхід | Очікуваний результат | Джерело |
|---|---|---|---|
| 1 | 10 × 10 ft, 3 in | 25 ft³ = 0,925926 yd³ | арифметика; збіг з трьома конкурентами |
| 2 | 1 yd³ → m³ | 0,764554857984 m³ | NIST SP 811 (1 yd = 0,9144 m точно) |
| 3 | 1 ft³ × 92 lb/ft³ (#57 dry rodded) | 92 lb = 0,046 short ton; 1 yd³ = 2 484 lb = 1,242 т | DOT spec ASTM C29 / AASHTO T19 |
| 4 | 20 × 10 ft, 4 in, 105 lb/ft³, 0 % | 66,667 ft³ = 2,469 yd³; 7 000 lb = 3,5 т | звірка з inchcalculator/omnicalculator |
| 5 | коло D = 8 ft, 2 in | 8,378 ft³ = 0,3103 yd³ | збіг з calculator.net |
| 6 | 10 × 10 ft, 3 in, +10 % | 27,5 ft³ = 1,0185 yd³; 55 мішків по 0,5 ft³ | правило запасу |
| 7 | трикутник 12 × 9 ft, 3 in | 54 ft² → 13,5 ft³ = 0,5 yd³ | геометрія |
| 8 | 1 000 lb / 2 000 | 0,5 short ton | NIST Handbook 44 App. C |
| 9 | ціна $45/yd³ при 2,469 yd³ | $111,11 | арифметика |
| 10 | 0 глубина / від'ємна ширина | 0; помилка валідації | граничні |

- **Дані, що застарівають, і коли оновлювати:** таблиця щільностей — переглядати щороку (січень) за спец-листами постачальників; типові ціни в тексті ($) — оновлювати щороку з датою.

## 4. Функції та UX

- **Must-have:** L×W×D і площа напряму; тип гравію; yd³ і тонни; ціна.
- **Наші переваги (≥ 2):** кілька ділянок із підсумком; готовий приклад і розрахунок без кнопки; мішки vs насип із підказкою «bulk is usually cheaper above ~1 yd³»; таблиця покриття на 1 т за глибиною; запас % видимий і редагований; стан у URL + Print/CSV.
- **Приклад за замовчуванням:** 10 × 10 ft, 3 in, Crushed stone 105 lb/ft³, +10 % → «You need ≈ 1.02 yd³ (order 1.5 yd³ or 1.45 tons)».
- **Мобільна версія (особливості):** форма з кількома ділянками довга → липкий підсумок унизу; `inputmode="decimal"`; сегменти ft|m, in|cm; іконки форм; кнопка «Add another area».
- **Дії з результатом:** копіювати · поділитися · друк · CSV.
- **«Що далі»:** Cubic Yards Calculator → Mulch Calculator → Concrete Calculator (для основи під бетон) / Square Footage Calculator (для складних форм).

## 5. Контент і SEO

- **Title (≤ 60):** `Gravel Calculator – Yards, Tons & Bags for Any Area` (52)
- **Description (120–155):** `Find how much gravel you need in cubic yards, tons and bags. Add several areas, pick the gravel type, include compaction and see the cost instantly.` (150)
- **H1:** `Gravel Calculator`
- **Перше речення (пряма відповідь):** `Multiply length × width × depth (in feet), divide by 27 to get cubic yards, then multiply by your gravel's density — about 1.4 tons per cubic yard for crushed stone — to get tons. This calculator does it for one or several areas and adds a compaction allowance.`

**План H2/H3:**
1. How to use this gravel calculator (4 кроки)
2. Gravel formula: from square feet to cubic yards and tons (формула + приклад 10×10×3)
3. How much gravel do I need? Examples for common projects (таблиця: driveway 20×10×4, walkway 30×3×3, patio base 12×12×4, French drain 50×1×12, play area 20×20×6)
4. How deep should gravel be? (глибина за проєктом, в дюймах)
5. Gravel weight by type: tons per cubic yard (таблиця типів + джерела)
6. Yards or tons? Bags or bulk? (як замовляти; коли насип дешевший; вантажівка ~10–14 yd³)
7. FAQ

- **Обсяг тексту (медіана топ-3 ± 30%):** медіана ≈ 1 740 → ціль 1 000–1 400 слів без води (складний калькулятор, дозволено до 1 800).
- **Унікальний елемент контенту:** таблиця «1 ton covers … ft² at 1/2/3/4/6 in» для 4 типів гравію; таблиця типових проєктів із готовими yd³ і тоннами.

**FAQ (4–8):**
1. How much does a cubic yard of gravel weigh?
2. How many square feet does a ton of gravel cover?
3. How many yards are in a ton of gravel?
4. How deep should a gravel driveway be?
5. Should I order gravel by the yard or by the ton?
6. How many bags of gravel equal one cubic yard?
7. How much extra gravel should I order for compaction?
8. How much gravel do I need for a 10×10 area?

**Джерела:**
- NIST Special Publication 811 — Appendix B: conversion factors (ft, yd, lb, short ton).
- ASTM C29 / AASHTO T19 unit-weight test; #57 stone spec (81 lb/ft³ loose, 92 lb/ft³ rodded).
- Supplier density tables (crushed stone, pea gravel, river rock, crusher run, DGA, riprap) — як індустрійна практика, з датою перевірки 30.09.2026.

**Перелінковка:**
- `category`: construction
- `related`: cubic-yards, mulch, concrete, square-footage, topsoil (draft), sand (draft)
- `next`: cubic-yards, mulch, concrete
- `aliases`: gravel estimator, crushed stone calculator, pea gravel calculator, gravel driveway calculator, gravel tonnage calculator, rock calculator
- Які наші сторінки мають послатись на нову: `/construction/` хаб, `/cubic-yards-calculator/`, `/mulch-calculator/`, `/square-footage-calculator/`.
- **Розмітка schema:** WebApplication (UtilitiesApplication, free) + BreadcrumbList + FAQPage.

## 6. Посилання ззовні

- **Кандидати для аутрічу:** блоги ландшафтних компаній і постачальників гравію (регіональні «gravel near me» сайти з DA 9–23 у топі), форуми DIY (tractorbynet, GardenWeb), сторінки «resources» університетських extension-програм з ландшафту, HR/DIY-розсилки.
- **Що тут варте посилання:** таблиця покриття 1 т за глибиною для друку; вбудовуваний віджет «Powered by <бренд>» для сайтів постачальників; калькулятор кількох ділянок.

## 7. Рішення

**3 переваги над топ-3:**
1. **Кілька ділянок в одному розрахунку** (прямокутник + коло + трикутник + пряма площа) з підсумком — немає в жодного з топ-3 (calculator.net має форми, але одну за раз; omnicalculator і inchcalculator — лише прямокутник/площа).
2. **Готовий приклад і розрахунок під час введення, з поясненням з підставленими числами** — у calculator.net і inchcalculator кнопка «Calculate», у жодного немає «how it's calculated» з числами.
3. **Замовлення «як у постачальника»:** видима щільність з джерелом, редагований запас %, порівняння мішки/насип і таблиця покриття 1 т за глибиною; результат одразу в yd³, тоннах і мішках + Print/CSV/Share — у топ-3 є лише частини цього (inchcalculator — таблиці, calculatorsoup — запас, omnicalculator — share).

- **Зусилля:** 10–14 год (логіка + тести 3, UI 4–5, текст 3, перевірки 2).
- **Очікуваний трафік:** позиція 3–5 ≈ 5–8 % від 60 500 → 3 000–5 000 відвідувань/міс; плюс хвости (pea gravel, driveway) ~1 500.
- **Рішення:** **будуємо зараз** (пілот стадії C).
