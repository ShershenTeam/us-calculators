# 04 · Технології, GitHub і деплой

## 1. Стек (рекомендація)

| Шар | Вибір | Чому |
|---|---|---|
| Генератор сайту | **Astro** (static output) | Готовий HTML без JS за замовчуванням. JS вантажиться лише для «острівця» калькулятора → найкращі Core Web Vitals. Вбудовані i18n-роутинг, sitemap, MDX, типізовані колекції контенту. Тисячі сторінок збираються за хвилини |
| Калькулятори (UI) | **Preact** + TypeScript (острівці Astro) | 3 КБ замість ~45 КБ React. Компонент рендериться на сервері в HTML (Google бачить поля й підписи), а в браузері «оживає» |
| Логіка калькуляторів | **Чисті функції TypeScript** (`logic.ts`) | Не залежать від UI → легко тестувати, повторно використовувати (іспанська версія, API, вбудовування) |
| Тести | **Vitest** (логіка) + **Playwright** (smoke по всіх сторінках) | Помилка у формулі на YMYL-сторінці — це втрата довіри. Кожна формула має еталонні приклади |
| Стилі | **Tailwind CSS** + свої дизайн-токени | Швидко, однаково на всіх сторінках, без роздутого CSS |
| Пошук | **Pagefind** | Статичний індекс, працює без сервера й бази |
| Графіки | uPlot / Chart.js (лише там, де потрібні, і з лінивим завантаженням) | Не вантажимо важке на кожну сторінку |
| Контент | **MDX** з frontmatter, перевірка схемою (zod) | Текст пишеться як Markdown, у нього вставляються компоненти (`<Calc>`, `<Example>`, `<Formula>`) |

**Розглянуті альтернативи:**
- **Next.js (static export)** — важчий JS на кожній сторінці, React гідрує все. Для статичного каталогу надлишковий.
- **Hugo** — найшвидша збірка, але інтерактивні калькулятори на ньому незручні.
- **Eleventy** — добрий, але слабша типізація компонентів.
- **WordPress** — повільно, плагіни, безпека, не статика.

**Бюджет продуктивності (перевіряє CI):** JS на сторінці калькулятора ≤ 50 КБ gzip · LCP < 1,8 с на мобільному 4G · CLS < 0,05 · INP < 200 мс.

## 2. Як влаштований проєкт

```
calc-site/
├─ src/
│  ├─ calculators/                 ← один калькулятор = одна папка
│  │  └─ time-card/
│  │     ├─ meta.ts                реєстрація: слаги, категорія, related, next, aliases
│  │     ├─ logic.ts               чисті формули
│  │     ├─ logic.test.ts          тести на еталонних значеннях
│  │     └─ TimeCard.tsx           UI-острівець (Preact)
│  ├─ content/
│  │  ├─ calculators/en/time-card-calculator.mdx
│  │  ├─ calculators/es/…          (пізніше)
│  │  ├─ categories/en/work-pay.mdx
│  │  ├─ guides/en/…
│  │  └─ authors/…
│  ├─ components/                  спільний UI-кіт: NumberInput, TimeInput, UnitToggle,
│  │                               ResultCard, ResultTable, ShareButton, PrintButton,
│  │                               AdSlot, FAQ, Breadcrumbs, RelatedCards, Calc (посилання)
│  ├─ layouts/                     Base, CalculatorPage, CategoryHub
│  ├─ pages/                       маршрути (генеруються з реєстру)
│  ├─ i18n/en.json, es.json        тексти інтерфейсу
│  └─ registry.ts                  збирає всі meta.ts, перевіряє зв'язки
├─ scripts/
│  ├─ new-calculator.mjs           `npm run new time-card` → створює папку й MDX за шаблоном
│  └─ link-report.mjs              звіт перелінковки: сироти, мало вхідних, биті
├─ public/  robots.txt, ads.txt, favicon
├─ docs/  research/                ці документи й дані
├─ .github/  workflows/, ISSUE_TEMPLATE/, PULL_REQUEST_TEMPLATE.md
└─ Dockerfile, nginx.conf
```

**Контракт калькулятора** (`meta.ts`):

```ts
export default defineCalculator({
  id: 'time-card',
  slugs: { en: 'time-card-calculator', es: 'calculadora-de-horas-trabajadas' },
  category: 'work-pay',
  alsoIn: ['time-date'],
  related: ['hours', 'work-hours', 'overtime', 'military-time'],
  next: ['overtime', 'hourly-to-salary'],
  aliases: ['timesheet calculator', 'punch clock calculator', 'hours worked'],
  ymyl: false,
  status: 'published',        // draft | published
});
```

**Frontmatter контенту** (перевіряється схемою, збірка падає при помилці):
`title` (≤ 60 символів) · `description` (≤ 155) · `h1` · `intro` · `faq[]` · `sources[]` · `author` · `reviewer` (обов'язково, якщо `ymyl: true`) · `updated`.

**Додати новий калькулятор** = `npm run new <id>` → написати `logic.ts` + тести → зібрати UI з готових компонентів → написати MDX → заповнити `related`/`next` → PR. Меню, хаб, хлібні крихти, sitemap, hreflang, розмітка й зворотні посилання з'являються самі.

## 3. GitHub: спільна робота

**Структура доступу:**
1. Створюємо **GitHub Organization** (безкоштовний план), наприклад `<бренд>-calculators`. Репозиторій належить організації, а не особистому акаунту, тож доступ можна давати й забирати, не передаючи свій акаунт.
2. Власники організації — **ти + один резервний акаунт** (щоб не втратити доступ).
3. Команда `core` з правом **Write**: сюди додаються розробники й редактори. Разовим фрілансерам — доступ до конкретного репозиторію як outside collaborator.
4. Репозиторій **приватний** до запуску.

**Правила гілки `main`:**
- зміни тільки через Pull Request;
- обов'язково зелений CI (тести, збірка, перевірка посилань, Lighthouse);
- 1 схвалення від іншої людини;
- без force-push.

**Робочий процес:**
1. **Issue на кожен калькулятор** за шаблоном: головний запит, обсяг, SD, топ-3 конкуренти, що в них сильного, що робимо краще, обов'язкові функції, джерела формул.
2. Гілка `calc/<id>` → PR з чеклістом: тести, джерела, FAQ, related/next, скріншот мобільної версії.
3. PR автоматично отримує **preview-посилання** для перевірки.
4. Merge → автоматичний деплой.

## 4. Деплой: статичний сайт

Сайт повністю статичний: після `npm run build` папка `dist/` містить готові HTML/CSS/JS. Жодної бази даних чи бекенду → дешево, швидко, безпечно, нічого «не падає».

### Варіант A (рекомендую): свій Dokploy-сервер + Cloudflare CDN

Узгоджено з тим, як уже працюють твої сайти.

```
GitHub (push у main)
   └─► GitHub Actions: install → тести → build → перевірка посилань → Lighthouse
          └─ успішно ─► webhook Dokploy ─► збірка Docker-образу ─► nginx віддає dist/
                                                    │
                                    Cloudflare (DNS proxy, SSL, кеш, CDN у США)
```

- **Сервер:** `49.12.4.84` (Hetzner, новий сервер під нові сайти) або будь-який з флоту.
- **Збірка — через Dockerfile, не Nixpacks:** двоетапний образ `node` (build) → `nginx:alpine` (роздача `dist/`). Nixpacks на твоїх серверах уже лишав гігабайти сміття в `/tmp` при перерваних збірках, а Dockerfile передбачуваніший і дає образ ~20 МБ.
- **Окремий репозиторій** → жодних «штормів деплою», як з `amazon-claude-sites`, де один push перебудував 30 сайтів.
- **Деплой тільки після зеленого CI:** у Dokploy вимикаємо auto-deploy на push, а GitHub Actions після успішних тестів викликає деплой-вебхук Dokploy. Зламана збірка ніколи не потрапить на прод.
- **Preview для PR:** preview deployments у Dokploy на піддомені `pr-123.preview.<домен>`.
- **Cloudflare перед сервером:** сервер у Німеччині, аудиторія в США, тому потрібен CDN. Налаштування:
  - кешуємо статику на рік (`/_astro/*` з хешем у назві);
  - HTML кешуємо коротко;
  - після деплою Actions скидає кеш через API Cloudflare.
- **Заголовки nginx:** `Cache-Control` для ассетів `immutable`, для HTML `no-cache`; редиректи 301 з реєстру; власна сторінка 404.

### Варіант B: Cloudflare Pages

Без власного сервера: Cloudflare сам збирає з GitHub, дає preview на кожен PR, глобальний CDN і безкоштовний необмежений трафік. Мінус — ще одна платформа поруч із Dokploy.

Оскільки сайт статичний, перехід між A і B займає годину. Рішення не «назавжди».

## 5. Аналітика й сервіси

| Сервіс | Навіщо | Коли |
|---|---|---|
| Google Search Console | покази, кліки, позиції, індексація — головний інструмент | з першого дня |
| Bing Webmaster Tools | Bing + ChatGPT Search беруть індекс Bing | з першого дня |
| GA4 або Umami/Plausible (self-host на Dokploy) | поведінка, події: «порахував», «поділився», «друк», «експорт» | з першого дня |
| Search Console (Performance) | відстеження позицій і запитів по кожній сторінці | після запуску |
| Google AdSense + CMP (Privacy & messaging) | реклама + згода на cookies (EEA) + «Do Not Sell» (CCPA) | коли буде 20–30 сторінок і трафік |

## 6. Що потрібно вирішити тобі

1. **Під яким GitHub-акаунтом створити організацію:** `dimytropchela`, `xxxPchelkinxxx` чи `DmytroShmel`? І як назвати організацію.
2. **Хто ще отримає доступ** (GitHub-логіни людей для команди `core`).
3. **Домен:** брендова коротка назва `.com` (calcshelf, omnicalculator — теж бренди, а не «calculator-online-free.com»). Перед купівлею перевірити, що назва вільна як торгова марка.
4. **Деплой:** варіант A (Dokploy `49.12.4.84` + Cloudflare) чи B (Cloudflare Pages).
