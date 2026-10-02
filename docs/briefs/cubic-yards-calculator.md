# Бриф сторінки: Cubic Yards Calculator

| Поле | Значення |
|---|---|
| Тип | калькулятор |
| Категорія | construction (Home & Construction) |
| URL | `/cubic-yards-calculator/` |
| Місяць за планом | 0 (запуск), score 5.796 |
| Відповідальний | Editorial team |
| Рецензент (для YMYL) | не потрібен |
| Дата аналізу | 2.10.2026 |

## 0. Чи варто

- Є в плані запуску (`page_inventory.csv`, month 0, score **5.796**, трафік лідера 144 642/міс).
- **Межі з іншими сторінками (антиканібалізація):**
  - `square-footage` — **площа** (без глибини). Тут — площа × глибина = об'єм.
  - `gravel` (і згодом `mulch`, `topsoil`, `concrete`) — **конкретний матеріал**: щільність, тонни, мішки певного продукту. Тут — **будь-який сипкий матеріал**, без ваги. Для ваги посилаємось на матеріальні сторінки.
  - Окремі майбутні конвертери (`/cubic-feet-to-cubic-yards/` m2, `/square-feet-to-cubic-yards/` m8, `/cubic-yards-to-tons/` беклог) — інший намір: перевести одне число. Тут — розрахунок від розмірів.
  - `/cubic-feet-calculator/` (m2) — той самий розрахунок з результатом у ft³; при створенні зробити окремий намір (дрібні об'єми: коробки, холодильники, переїзд), щоб не дублювати.

## 1. Запит і намір

| Запит | Обсяг | SD | CPC | Куди |
|---|---|---|---|---|
| **cubic yards calculator / cubic yard calculator** | 40 500 | 24 | $0.52 | ця сторінка |
| yardage calculator, cu yd calculator | — | — | — | ця сторінка (aliases) |
| how many cubic yards do I need | — | — | — | ця сторінка |
| cubic yards of dirt / fill dirt calculator | — | — | — | ця сторінка |
| square feet to cubic yards | 98 588 трафіку в лідера | — | — | **окремий конвертер** (m8); тут — коротка секція + таблиця покриття |
| cubic feet to cubic yards | 156 322 | — | — | **окремий конвертер** (m2) |
| cubic yards to tons | 32 416 | — | — | **окрема сторінка** (беклог); тут посилання на gravel |
| post hole concrete / sonotube | — | — | — | `concrete` (беклог кластера) |

- **Сезонність:** весна — пік ландшафтних робіт (мульча, ґрунт). Публікувати зараз — встигаємо до квітня.
- **Намір одним реченням:** домовласник або ландшафтний підрядник знає розміри грядки, ділянки чи ями й хоче знати, скільки кубічних ярдів замовити (або скільки мішків купити), з телефона.
- **Питання людей:** How many cubic yards do I need for…? How many square feet does a cubic yard cover? How many bags of mulch/soil in a cubic yard? How do I convert cubic feet to cubic yards? How much does a cubic yard weigh? How much extra should I order?
- **Що показує Google:** AI Overview ☑ (формула L × W × D ÷ 27) · featured snippet ☑ · вбудований калькулятор ☐ · відео ☑ · форуми ☐
- **Висновок для формату:** перше речення — формула з прикладом; калькулятор із кількома ділянками; таблиця «скільки покриває 1 ярд»; таблиця «мішків у ярді».

## 2. Конкуренти

| # | Сторінка | Трафік/міс | Донори |
|---|---|---|---|
| 1 | calculatorsoup.com `/calculators/construction/cubic-yards-calculator.php` | 144 642 | 353 |
| 2 | omnicalculator.com `/construction/cubic-yard` | — | — |
| 3 | thecalculatorsite.com `/misc/cubic-yards-calculator.php` | — (сусідня `/misc/cubic-feet-calculator.php` 111 125, 278) | — |

**Посилань для топ-5:** ~50–350 донорів (min 49 в інвентарі). Нижче, ніж у square footage; реально вийти в топ-10 за кілька місяців.

**Матриця топ-3** (розібрано 2.10.2026):

| Критерій | calculatorsoup | omnicalculator | thecalculatorsite | Ми |
|---|---|---|---|---|
| Поля / форми | 8 форм (known area, square, rect, circle, triangle, rect border, circle border, annulus), кількість, ціна | 9 тіл (box, cube, cylinder, hollow, cone, pyramid…) | L × W або known area, глибина, тип матеріалу, ціна | 6 форм, **кожна ділянка з власною глибиною й назвою**, кількість (ями), ціна |
| Кілька різних ділянок | ні (лише Quantity) | ні | ні | **так, із підсумком** |
| Рахує без кнопки | ні | так | ні | **так** |
| Запас | лише довідкова таблиця 5–20 % | ні | ні | **поле % у розрахунку** |
| Мішки | статична таблиця | ні | ні | **кількість мішків для вашого об'єму** (0,5–3 ft³ або 25–70 L) |
| Округлення до замовлення | ні | ні | ні | **до ½ ярда** |
| Пояснює результат | формули в тексті | формули в тексті | формула в тексті | **кроки з підставленими числами** |
| Share / print / CSV | віджет | — | — | **Copy · Share (стан у URL) · Print · CSV** |
| Автор, джерела, дата | автор, дата 7.10.2025, без джерел | автор + рецензент | без автора, джерел і дати | автор, **NIST**, дата |
| Title | Cubic Yards Calculator | Cubic Yard Calculator | Cubic Yards Calculator and Price Estimator | з перевагою |

**Must-have:** прямокутник/коло/трикутник/known area; глибина in/ft і метрика; ft³, yd³, m³; ціна; таблиця покриття.
**Найкраще в когось одного:** багато форм (calculatorsoup), живий розрахунок (omni), таблиця покриття (thecalculatorsite).
**Прогалини:** різні ділянки з різною глибиною; запас у розрахунку; мішки для свого об'єму; округлення до ½ ярда; ями/стовпчики з кількістю; стан у посиланні, CSV.

## 3. Формула

- **Першоджерело:** NIST SP 811, Appendix B — 1 yd = 0,9144 m точно → 1 yd³ = 27 ft³ = 0,764554857984 m³; 1 ft³ = 0,028316846592 m³ = 28,316846592 L.
- **Формула:** `yd³ = площа (ft²) × глибина (ft) ÷ 27`; глибина в дюймах ÷ 12; запас `× (1 + %)`; мішки `⌈ft³ ÷ розмір мішка⌉`; замовлення — вгору до 0,5 yd³.
- **Площа фігур** — спільний модуль `src/lib/area.ts` (той самий, що в square footage, протестований).

**Звірка з конкурентами** (10 × 10 ft, 3 in):

| Вхід | calculatorsoup | omnicalculator | thecalculatorsite | Ми |
|---|---|---|---|---|
| 10 × 10 ft × 3 in | 0,93 yd³ | 0,93 yd³ | 0,93 yd³ | 0,926 yd³ |
| 54 ft³ | 2 yd³ (приклад на сторінці) | — | — | 2 yd³ |

**Поля:** назва (≤ 40); форма; розміри (ft з `12'6"` / m); глибина (in/ft або cm/m, 0…); кількість 1–999; запас 0–50 % (10 за замовчуванням); мішок 0,5/0,75/1/1,5/2/3 ft³ або 25/40/50/70 L; ціна за yd³/ft³/m³/мішок.

- **Видимі припущення:** «+10 % на розсипання й осідання», «замовлення округлено вгору до ½ ярда», «мішки — вгору до цілого».
- **Граничні випадки:** 0 → 0; від'ємні → текст помилки; глибина в ft > 2 ft для плоскої ділянки → попередження «можливо, ви мали на увазі дюйми» (ями-кола не попереджаються).

**Еталонні приклади (→ `logic.test.ts`, 20 тестів):**

| # | Вхід | Результат | Джерело |
|---|---|---|---|
| 1 | 27 ft³ | 1 yd³ | **NIST SP 811** |
| 2 | 1 yd³ | 0,764554857984 m³ | **NIST SP 811** |
| 3 | 1 ft³ | 28,316846592 L | **NIST SP 811** |
| 4 | 54 ft³ | 2 yd³ | приклад calculatorsoup |
| 5 | 10 × 10 ft × 3 in | 25 ft³ = 0,926 yd³ | збіг у трьох конкурентів |
| 6 | 12 × 10 ft × 4 in, +10 % | 1,63 yd³ → 2 yd³, 22 мішки по 2 ft³ | розрахунок |
| 7 | 8 ям Ø 10″ × 36″ | 13,09 ft³ = 0,485 yd³ | `π r² h` |
| 8 | 1 yd³ при 3 in / 2 in | 108 / 162 ft² | `27 × 12 ÷ глибина` |
| 9 | 4 × 3 m × 10 cm | 1,2 m³ → 24 мішки по 50 L | метрика |
| 10 | 4 in | 10,16 cm = ⅓ ft | NIST (1 in = 2,54 cm) |

## 4. Функції та UX

- **Must-have:** усі з розділу 2.
- **Переваги:** різні ділянки з власною глибиною; запас у розрахунку; мішки для свого об'єму; ½-ярдове замовлення; ями з кількістю; Copy/Share/Print/CSV.
- **За замовчуванням:** «Garden bed» 12 × 10 ft × 4 in → 1,63 yd³ з 10 %, замовити 2 yd³ або 22 мішки по 2 ft³.
- **Мобільна:** поля розмірів і глибини на першому екрані, форма — під ними; липкий результат.
- **«Що далі»:** gravel, mulch, topsoil.

## 5. Контент і SEO

- **Title:** `Cubic Yards Calculator — Any Shape, Depth & Bags` (48)
- **Description:** `Work out how many cubic yards to order for beds, fill or holes. Add areas with their own depth and get cubic feet, meters, bags and a ½-yard order.` (≤ 155)
- **H1:** Cubic Yards Calculator
- **Перше речення:** `Cubic yards = length × width × depth in feet ÷ 27. A 12 × 10 ft bed 4 inches deep holds 1.48 cubic yards; add 10 % and you order about 1.6, or 2 yards from a bulk supplier.`

**H2:** How to calculate cubic yards · Square feet to cubic yards (таблиця покриття) · How many bags in a cubic yard (таблиця) · How much extra to order · Holes, posts and columns · Bulk or bags · What a cubic yard weighs (посилання на матеріальні сторінки, без власних цифр щільності).

- **Обсяг:** 900–1 200 слів.
- **Унікальне:** таблиця «скільки мішків у ярді» для 6 розмірів + таблиця покриття в ft² і m²; розрахунок ям/стовпчиків у тому ж інструменті.

**FAQ (6):** How many square feet does a cubic yard cover? · How many bags of mulch or soil make a cubic yard? · How do I convert cubic feet to cubic yards? · How many cubic yards in a dump truck / pickup? (обережно: лише як оцінку з посиланням на вагу) · How much does a cubic yard weigh? · How deep should mulch/topsoil be?

**Джерела:** NIST SP 811 App. B.

**Перелінковка:** `related`: square-footage, gravel, mulch, topsoil, concrete · `next`: gravel, mulch, topsoil · посилатись на нову: square footage (уже в тексті), gravel (уже в тексті), хаб.

## 6. Посилання ззовні

- Ландшафтні постачальники й садові центри (сторінки «how much do I need»), блоги про городництво й raised beds, підрядники з благоустрою.
- **Варте посилання:** таблиці мішків і покриття, розрахунок ям, CSV.

## 7. Рішення

**3 переваги над топ-3:**
1. Жоден із топ-3 не підсумовує **кілька ділянок із різною глибиною** (грядка 3 in + доріжка 2 in + яма під стовп); calculatorsoup має лише множник однакових.
2. Жоден не застосовує **запас у розрахунку** й не рахує **мішки для вашого об'єму** (calculatorsoup дає статичні таблиці, інші — нічого), і жоден не округлює до **½ ярда**, як продають постачальники.
3. Жоден не дає **посилання зі збереженими даними, друку й CSV**; у thecalculatorsite немає ні автора, ні джерел, ні дати.

- **Зусилля:** ~4 год (геометрія вже спільна з square footage).
- **Рішення:** **будуємо зараз.**
