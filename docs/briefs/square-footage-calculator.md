# Бриф сторінки: Square Footage Calculator

| Поле | Значення |
|---|---|
| Тип | калькулятор |
| Категорія | construction (Home & Construction) |
| URL | `/square-footage-calculator/` |
| Місяць за планом | 0 (запуск), score 5.834 — найвищий серед будівельних калькуляторів |
| Відповідальний | Editorial team |
| Рецензент (для YMYL) | не потрібен (не YMYL) |
| Дата аналізу | 2.10.2026 |

## 0. Чи варто

- Сторінка є в `Page_Plan_12_months.xlsx`, аркуш Launch; `page_inventory.csv`, month 0, score **5.834**, трафік конкурента 643 378/міс.
- **Канібалізації немає.** У реєстрі: `gravel` (обсяг матеріалу в ярдах/тоннах), `cubic-yards` (об'єм, не площа), `concrete`, `mulch`, `topsoil` (конкретні матеріали). Жодна не цілиться в намір «порахувати площу в кв. футах». `cubic-yards-calculator` рахує **об'єм** — межу проводимо так: площа → ця сторінка, площа × глибина → cubic yards.
- Тип: звичайний калькулятор (не сторінка значення), ліміт 1 000/міс не застосовується.

## 1. Запит і намір

| Запит | Обсяг | SD | CPC | Куди |
|---|---|---|---|---|
| **square footage calculator** | 201 000 | 33 | $0.54 | ця сторінка |
| how to calculate square footage | — | — | — | ця сторінка (H2 + пряма відповідь) |
| sq ft calculator | — | — | — | ця сторінка (alias) |
| square foot calculator | — | — | — | ця сторінка (alias) |
| room square footage calculator | — | — | — | ця сторінка (alias) |
| how to measure square footage of a house | — | — | — | ця сторінка (H2 про ANSI Z765) |
| square footage of a room | — | — | — | ця сторінка |
| irregular shaped room square footage | — | — | — | ця сторінка (режим кількох ділянок) |
| area calculator | 291 485 трафіку в calculator.net | — | — | **окрема сторінка** (геометрія фігур, не будівництво) |
| square feet to acres / sq ft to sq m | 1 210 817 / 344 281 трафіку | — | — | **окремі конвертери** (кластер conversions) |
| how many boxes of flooring do i need | — | — | — | ця сторінка (функція «коробки») |
| square footage calculator with price | — | — | — | ця сторінка (поле ціни) |
| house square footage calculator | — | — | — | ця сторінка |
| square footage calculator for flooring | — | — | — | ця сторінка (запас на відходи) |
| square footage calculator for painting | — | — | — | **беклог** → `/paint-calculator/` (є в плані, score 99) |
| acreage calculator | — | — | — | беклог (земельні ділянки) |

- **Сезонність:** піків майже немає; легке зростання навесні (ремонти, підлога, ландшафт). Публікувати можна одразу.
- **Намір одним реченням:** людина з рулеткою в руці (власник житла або підрядник) стоїть у кімнаті чи на ділянці, хоче швидко отримати площу в квадратних футах, часто одразу з запасом і кількістю матеріалу, і робить це з телефона.
- **Питання людей (PAA, довідники банків і виробників):**
  1. How do I calculate the square footage of a room?
  2. How do I calculate square footage for an irregular or L-shaped room?
  3. How do you calculate the square footage of a whole house?
  4. What is included in the square footage of a house? (гаражі, підвали, сходи)
  5. How many square feet is a 10×10 room? (та інші конкретні розміри)
  6. How much extra flooring should I order for waste?
  7. How many boxes of flooring do I need?
  8. How do I convert square feet to square meters / acres / square yards?
- **Що показує Google:** AI Overview ☑ · featured snippet ☑ (формула length × width) · вбудований калькулятор Google ☐ · відео ☑ · PDF ☐ · застосунки ☐ · форуми ☐
- **Висновок для формату сторінки:** перший екран — калькулятор з одразу видимим прикладом; перше речення має містити готову формулу (для AI Overview і snippet); далі таблиця типових розмірів кімнат; окремий блок про те, що рахується в площу будинку.

## 2. Конкуренти

**Конкуренти з такою сторінкою** (`research/data/competitor_pages.csv`):

| # | Сайт і сторінка | Трафік/міс (оцінка) | Донори сторінки |
|---|---|---|---|
| 1 | calculatorsoup.com `/calculators/construction/square-footage-calculator.php` | 643 378 | 646 |
| 2 | calculator.net `/square-footage-calculator.html` | 415 595 | 278 |
| 3 | omnicalculator.com `/construction/square-footage` | 4 361 | 291 |
| 4 | thecalculatorsite.com `/misc/square-footage-calculator.php` | 12 465 | 353 |
| 5 | calculator.net `/area-calculator.html` (суміжний намір) | 291 485 | 584 |

**Скільки посилань приблизно треба для топ-5:** ~250–350 донорів на сторінку в усіх із топ-4. Це високий бар'єр: швидкого топ-3 не буде. Реалістична ціль — спершу довгі хвости («irregular room», «how many boxes of flooring», «what counts in house square footage»), потім головний запит.

**Матриця топ-3:**

| Критерій | calculatorsoup | calculator.net | omnicalculator | Ми |
|---|---|---|---|---|
| Поля / одиниці | довжина, ширина, кількість, відходи %, ціна; ft+in, in, ft, yd, mi, mm, cm, m, km | по полю на кожну з 9 фігур + кількість + ціна; ft, yd, in, mi, m, km, cm | ширина, довжина, кількість, площа, ціна за одиницю | **список кімнат з назвами**, кожна зі своєю фігурою; ft+in / m; відходи, ціна, покриття коробки |
| Значення за замовчуванням | немає явних | немає | немає | **так: кімната 12 × 14 ft, одразу видно 168 ft²** |
| Рахує без кнопки | ні — кнопка Calculate | ні — кнопка Calculate | так | **так** |
| Пояснює результат | формули в тексті нижче | ні | формула в тексті | **так, «How it's calculated» з підставленими числами по кожній кімнаті** |
| Таблиці / графіки | таблиці переводу одиниць, SVG-схеми фігур | довідкові рядки (1 acre = 43 560 ft²) | таблиці переводу | **схема кімнат + таблиця типових розмірів + підсумкова відомість по кімнатах** |
| Друк / експорт / збереження / посилання | вбудовуваний віджет, кнопка «поділитися» | немає | «Share result» | **Copy · Share (стан у URL) · Print · CSV-відомість по кімнатах** |
| Мобільна зручність (1–5) | 3 — довга сторінка, кнопка Calculate, багато реклами | 2 — таблична верстка, дрібні поля | 4 | **5 — калькулятор на першому екрані, липкий підсумок, правильна клавіатура** |
| Швидкість, реклама | реклама над калькулятором і всередині | реклама над калькулятором | помірно | **без реклами над калькулятором (правило docs/06 §6)** |
| Обсяг тексту, H2 | ~1 200 слів, 10 H2 | ~500 слів, 11 H2 (по фігурі) | ~1 500 слів, 10 H2 | **~1 100 слів, 7 H2 — без води, кожен H2 = питання людей** |
| Формула, приклади, FAQ | формули по фігурах, 4 FAQ | формул немає, FAQ немає | формула, 2 FAQ | **формули по фігурах, 5 еталонних прикладів у тестах, 6 FAQ** |
| Автор, джерела, дата, schema | автор Edward Furey, дата 24.12.2025, без джерел | **нічого**: ні автора, ні джерел, ні дати | автори + рецензенти, джерело ANSI Z765-2020 | **автор, джерела (NIST SP 811, ANSI Z765-2021, Fannie Mae), дата оновлення, WebApplication + FAQPage + BreadcrumbList** |
| Title / description | «Square Footage Calculator» | «Square Footage Calculator» | «Square Footage Calculator» | title з перевагою: кілька кімнат + запас на відходи |

**Скарги користувачів і прогалини в намірі (довідники Chase, Lowe's, виробники підлоги):**
- Кімнату неправильної форми доводиться ділити вручну й додавати на папірці — жоден із топ-3 не підсумовує **різні** кімнати (calculator.net і omnicalculator множать **однакові** через поле Quantity; calculatorsoup прямо пише «split it into two or more sections and calculate each»).
- Люди не знають, скільки докуповувати на відходи й скільки це коробок; у топ-3 запас є тільки в calculatorsoup, коробок немає ні в кого.
- Плутанина, що входить у площу будинку (гараж, недобудований підвал, сходи, скоси стелі). Omnicalculator згадує ANSI Z765-2020 у джерелах, але правил не пояснює; решта мовчить.

**Must-have:** прямокутник, коло, трикутник, трапеція, пряме введення площі; одиниці ft/in і метричні; вивід у ft², yd², m², acres; ціна за одиницю; формули в тексті.
**Найкраще в когось одного:** запас на відходи (calculatorsoup); схеми фігур (calculatorsoup); живий розрахунок (omnicalculator).
**Прогалини:** кілька **різних** кімнат з назвами й підсумком; віднімання вирізів (острів, сходовий отвір, камін); коробки матеріалу; пояснення ANSI Z765-2021; друк і CSV-відомості; стан у посиланні.

## 3. Формула

- **Першоджерела:**
  - **NIST Special Publication 811, Appendix B** — точні коефіцієнти: 1 ft = 0,3048 m (точно) → 1 ft² = 0,09290304 m² (точно); 1 yd = 0,9144 m → 1 yd² = 9 ft² (точно); 1 in = 2,54 cm (точно).
  - **NIST Handbook 44, Appendix C** — 1 acre = 43 560 ft² (точно, за означенням через US survey foot приймається 43 560 міжнародних ft² у побутових розрахунках).
  - **ANSI Z765-2021 «Square Footage — Method for Calculating»** (Home Innovation Research Labs) — що рахується житловою площею.
  - **Fannie Mae Selling Guide, B4-1.3-05 / Fact Sheet «Standardized Property Measuring Guidelines»** — з 4.2022 оцінювачі зобов'язані міряти за ANSI Z765-2021: стеля ≥ 7 ft; при скосі ≥ 50 % площі кімнати мусить мати ≥ 7 ft і жодна частина < 5 ft; площа вище й нижче рівня землі рахується окремо.
  - **Запас на відходи** (перевірено 2.10.2026): Mullican Flooring, *How to Calculate the Correct Footage When Purchasing Hardwood Flooring* (документ на pdf.lowes.com) — «typically add an additional 5 %», «5–7 %», по діагоналі «10–15 %», плюс 1–2 коробки про запас для ремонту; Daltile FAQ — для плитки «approximately 10 % more». ⚠️ NWFA Installation Guidelines (2025) відсотка запасу **не містять** — на них не посилаємось.

- **Формули площі:**
  - прямокутник: `A = довжина × ширина`
  - L-подібна кімната: `A = A₁ + A₂` (два прямокутники)
  - коло: `A = π × (діаметр / 2)²`
  - трикутник (основа й висота): `A = основа × висота / 2`
  - трапеція: `A = (a + b) / 2 × h`
  - пряма площа: `A = введене значення`
  - кімната з множником: `A × кількість`
  - виріз (острів, сходовий отвір): той самий набір фігур зі знаком «−»
  - підсумок: `Σ A` → `з запасом = Σ A × (1 + відходи%)` → `коробок = ceil(з запасом / покриття коробки)`

- **Звірка з конкурентами** (однакові вхідні дані 12 ft × 14 ft; коло Ø 10 ft; трикутник 10 × 8):

| Вхідні дані | calculatorsoup | calculator.net | omnicalculator | Ми | Розбіжність і чому |
|---|---|---|---|---|---|
| 12 × 14 ft | 168 ft² | 168 ft² | 168 ft² | 168 ft² | немає |
| коло Ø 10 ft | 78,54 ft² | 78,54 ft² | — (окрема сторінка) | 78,54 ft² | немає |
| трикутник 10 × 8 | 40 ft² | 40 ft² | — | 40 ft² | немає |
| 168 ft² → m² | 15,607 m² | 15,61 m² | 15,61 m² | 15,61 m² | немає (точний коефіцієнт NIST) |
| 168 ft² → acres | 0,00386 | 0,00386 | — | 0,00386 | немає |
| 168 ft² + 10 % | 184,8 ft² | немає функції | немає функції | 184,8 ft² | у двох конкурентів функції немає |
| 184,8 ft² ÷ 22,69 ft²/коробка | немає | немає | немає | **9 коробок** (округлення вгору) | функції немає ні в кого |

**Поля:**

| Поле | Одиниця | Діапазон | За замовчуванням | Валідація |
|---|---|---|---|---|
| Назва кімнати | текст | ≤ 40 знаків | «Room 1» | порожня → підставляється «Room N» |
| Форма | — | rectangle / l-shape / circle / triangle / trapezoid / area | rectangle | — |
| Довжина, ширина, основа, висота, діаметр, a, b | ft (прийматиме `12'6"`) або m | 0…10 000 | 14 / 12 | < 0 → «Enter 0 or more» |
| Площа (режим «area») | ft² або m² | 0…10 000 000 | 150 | те саме |
| Кількість однакових кімнат | ціле | 1…99 | 1 | < 1 → 1 |
| Відняти (виріз) | перемикач | так / ні | ні | — |
| Запас на відходи | % | 0…50 | 10 | > 50 → 50 |
| Покриття коробки | ft² або m² | 0…1 000 | порожньо | 0 → коробки не рахуються |
| Ціна | $ за ft² / yd² / m² | ≥ 0 | порожньо | порожньо → вартість не показується |

- **Видимі припущення:** «+10 % на підрізку» (змінюється, з підказкою 5 % прямий / 15 % діагональ); «коробки округлюються вгору»; «площа рахується по внутрішніх розмірах кімнати».
- **Округлення / точність:** площа — 2 знаки до 1 000 ft², далі 0 знаків; acres — 4 знаки; коробки — **вгору** до цілого; вартість — 2 знаки. Внутрішні обчислення — без проміжного округлення.
- **Граничні випадки:** 0 і порожні поля → 0 ft², без помилки; від'ємні → помилка текстом; вирізів більше, ніж площі → підсумок не опускається нижче 0 і показується попередження; одна кімната не видаляється (мінімум одна); перемикання одиниць конвертує введені значення, а не обнуляє їх; дуже великі числа (ділянка в акрах) — без втрати точності.

**Еталонні приклади (≥ 5, → `logic.test.ts`):**

| # | Вхід | Очікуваний результат | Джерело |
|---|---|---|---|
| 1 | 12 ft × 14 ft | 168 ft² | геометрія, збіг у трьох конкурентів |
| 2 | 1 ft² → m² | 0,09290304 m² рівно | **NIST SP 811 App. B** (1 ft = 0,3048 m точно) |
| 3 | 1 yd² → ft² | 9 ft² рівно | **NIST SP 811 App. B** |
| 4 | 1 acre → ft² | 43 560 ft² рівно | **NIST Handbook 44 App. C** |
| 5 | коло Ø 10 ft | 78,5398163 ft² | `π r²`, збіг з calculatorsoup і calculator.net |
| 6 | трапеція a = 10, b = 14, h = 8 ft | 96 ft² | `(a+b)/2 × h` |
| 7 | L-подібна 20×12 + 8×6 | 288 ft² | сума двох прямокутників |
| 8 | 168 ft² + 10 % ÷ 22,69 ft²/коробка | 9 коробок | округлення вгору |
| 9 | 200 ft² мінус виріз 3×5 ft | 185 ft² | віднімання вирізу |
| 10 | 12'6" × 10 ft | 125 ft² | розбір `12'6"` (`parse-input.ts`) |

- **Дані, що застарівають, і коли оновлювати:** ANSI Z765 переглядається приблизно раз на 5 років (чинна редакція 2021); вимогу Fannie Mae перевіряти раз на рік. Коефіцієнти NIST не змінюються.

## 4. Функції та UX

- **Must-have:** 5 фігур + пряме введення площі, imperial/metric, вивід у ft²/yd²/m²/acres, ціна, формули в тексті.
- **Наші переваги (≥ 2):**
  1. **Список різних кімнат з назвами** і спільним підсумком — закриває «irregular / L-shaped / whole house», де топ-3 змушують рахувати вручну.
  2. **Вирізи зі знаком «−»** (кухонний острів, сходовий отвір, камін).
  3. **Запас на відходи з пресетами** (straight 5 %, diagonal 15 %, tile 10 %) і **кількість коробок** за покриттям коробки.
  4. **Відомість по кімнатах: друк і CSV** — підрядник приносить у магазин.
- **Приклад за замовчуванням:** «Living room» 14 × 12 ft → 168 ft², 184,8 ft² із запасом 10 %.
- **Мобільна версія:** калькулятор на першому екрані; кімнати — картки-акордеони; липкий підсумок унизу; `inputmode="decimal"`; введення `12'6"`.
- **Дії з результатом:** копіювати · поділитися посиланням зі станом · друк · CSV.
- **«Що далі»:** `cubic-yards` (площа × глибина = об'єм), `concrete`, `gravel`.

## 5. Контент і SEO

- **Title (≤ 60):** `Square Footage Calculator — Multiple Rooms & Waste` (54)
- **Description (120–155):** `Add every room, odd shape or cut-out and get total square feet, square meters and acres — plus the extra you need for waste and the boxes to buy.` (152)
- **H1:** Square Footage Calculator
- **Перше речення (пряма відповідь):** `Square footage is length times width: a room 14 feet by 12 feet is 168 square feet. Add each room below — including L-shapes, circles and cut-outs — and the calculator keeps a running total in square feet, square yards, square meters and acres.`

**План H2/H3:**
1. How to calculate square footage (формула + покроково + таблиця фігур)
2. Rooms that are not rectangles (L-подібні, еркери, вирізи)
3. Square footage of a whole house — what counts (ANSI Z765-2021, 7 ft / 50 % / 5 ft, вище й нижче рівня землі, Fannie Mae з 2022)
4. How much extra to buy for waste (5 / 10 / 15 % і звідки це)
5. How many boxes of flooring you need
6. Common room sizes in square feet (**унікальна таблиця**)
7. Converting square feet to square yards, meters and acres (точні коефіцієнти NIST)

- **Обсяг тексту:** медіана топ-3 ≈ 1 200 слів → ціль **1 000–1 400** слів.
- **Унікальний елемент контенту:** таблиця типових розмірів кімнат (8×10 … 20×24) з площею у ft² і m² — для запитів «how many square feet is a 10x10 room»; плюс блок правил ANSI, якого немає в топ-3.

**FAQ (6):**
1. How do I calculate the square footage of an L-shaped room?
2. Does the square footage of a house include the garage or an unfinished basement?
3. How much extra flooring should I order?
4. How many square feet is a 10×10 room?
5. How do I convert square feet to square meters?
6. Should I measure from the inside or the outside of the walls?

**Джерела:**
- NIST Special Publication 811, Appendix B — conversion factors (foot, yard, inch).
- NIST Handbook 44, Appendix C — acre, square foot.
- ANSI Z765-2021, *Square Footage — Method for Calculating*, Home Innovation Research Labs.
- Fannie Mae Selling Guide B4-1.3-05 / Fact Sheet *Standardized Property Measuring Guidelines*.
- Mullican Flooring — *How to Calculate the Correct Footage When Purchasing Hardwood Flooring* (5–7 %, діагональ 10–15 %).
- Daltile Knowledge Center FAQ — плитка: купувати ~10 % більше.

**Перелінковка:**
- `category`: construction
- `related`: cubic-yards, gravel, concrete, mulch, topsoil
- `next`: cubic-yards, concrete, gravel
- `aliases`: sq ft calculator, square foot calculator, room square footage calculator, house square footage calculator, area in square feet, how to calculate square footage, flooring square footage calculator
- Які наші сторінки мають послатись на нову: `/gravel-calculator/` (у тексті про вимірювання ділянки), хаб `/construction/`, згодом `/concrete-calculator/` і `/cubic-yards-calculator/`.

- **Розмітка schema:** WebApplication + BreadcrumbList + FAQPage.

## 6. Посилання ззовні

- **Кандидати для аутрічу:** ресурсні сторінки бібліотек і шкіл («math resources»), блоги підрядників і ріелторів, сторінки «how to measure your home» в агенцій нерухомості, магазини підлоги з розділом порад, блоги про оренду складів (neighbor.com і подібні вже пишуть на цю тему).
- **Що тут варте посилання:** таблиця типових розмірів кімнат, пояснення правил ANSI Z765-2021 простою мовою, CSV-відомість по кімнатах, згодом — вбудовуваний віджет.
- **Для кого віджет:** магазини підлоги й фарби, ріелтори, підрядники.

## 7. Рішення

**3 переваги над топ-3:**
1. Жоден із топ-3 не підсумовує **різні** кімнати: calculatorsoup прямо радить рахувати частини окремо, calculator.net і omnicalculator мають лише множник однакових. У нас — іменований список кімнат із вирізами й спільним підсумком.
2. Жоден не рахує **коробки матеріалу** за покриттям коробки, а запас на відходи є лише в calculatorsoup (без пресетів під спосіб укладання).
3. Жоден не пояснює **ANSI Z765-2021** — що саме рахується площею будинку (стеля 7 ft, правило 50 % / 5 ft, окремо нижче рівня землі), хоча з квітня 2022 це обов'язкове для оцінювачів Fannie Mae. Плюс у calculator.net немає ні автора, ні джерел, ні дати оновлення.

- **Зусилля:** ~6 год (логіка + тести + UI + контент).
- **Очікуваний трафік:** бар'єр за посиланнями високий (250–350 донорів у топ-4). Реалістично: довгі хвости з 2–3 місяця, головний запит — після набору посилань. При позиції 3–5 за головним запитом — орієнтовно 8–15 тис. візитів/міс.
- **Рішення:** **будуємо зараз.**
