# 10 · Покрокова інструкція: як побудувати сайт

Документ для людини, яка будуватиме сайт: розробника або власника, що працює з AI-асистентом. Кроки йдуть у тому порядку, в якому їх треба виконувати. Кожен етап закінчується пунктом **«Готово, коли…»**: поки він не виконаний, далі не йдемо.

Деталі кожної теми — в окремих документах, на них є посилання. Цей документ — маршрут.

| Етап | Що | Тривалість |
|---|---|---|
| A | Підготовка: рішення, акаунти, програми | 1–2 дні |
| B | Каркас сайту | ~1 тиждень |
| C | Перший калькулятор від і до (зразок для всіх наступних) | 2–3 дні |
| D | Автоматичні перевірки (CI) | 1–2 дні |
| E | Деплой і домен | 1 день |
| F | Наповнення до запуску (143 сторінки) | тижні 3–8 |
| G | Запуск | 1–2 дні |
| H | Щомісячна робота | постійно |

---

## Як працювати: з AI-асистентом чи вручну

**Рекомендовано — з Claude Code.**
1. Відкрийте папку проєкту (пізніше — репозиторій) у Claude Code. Він сам прочитає `CLAUDE.md` з правилами.
2. Давайте завдання по кроках цієї інструкції, наприклад:
   - «Виконай крок B1–B4 з docs/10»;
   - «Зроби етап C для gravel calculator»;
   - «Візьми наступні 10 сторінок з аркуша Launch і зроби для кожної бриф і сторінку».
3. Ваша роль — ухвалювати рішення (етап A), переглядати результат (PR, preview-посилання, телефон) і погоджувати публікацію.

**Вручну** — ті самі кроки. Команди й зразки коду наведено нижче.

---

## Етап A. Підготовка

### A1. Рішення власника (без них далі не йдемо)
- [ ] GitHub: акаунт-власник і назва організації.
- [ ] Хто ще отримує доступ (GitHub-логіни).
- [ ] Домен: коротка брендова назва `.com`, перевірена на торгову марку (USPTO TESS) і вільна.
- [ ] Розміщення: **A** — свій сервер Dokploy + Cloudflare, або **B** — Cloudflare Pages. Порівняння — `docs/04-tech-and-deploy.md`, розділ 4.
- [ ] Записати рішення в `HANDOFF.md`, розділ 5.

### A2. Програми на комп'ютері
- [ ] **Node.js** LTS (22 або новіший) — https://nodejs.org
- [ ] **Git** — https://git-scm.com
- [ ] **Claude Code** (якщо з асистентом) або редактор коду (VS Code)
- [ ] **Python 3** + `pip install openpyxl` — лише для перебудови Excel-плану

### A3. GitHub
- [ ] Створити **Organization** (Free plan) → Settings → Member privileges → базові права «No permission».
- [ ] Команда `core` з правом **Write**; додати людей.
- [ ] Створити **приватний** репозиторій (наприклад, `site`).
- [ ] Правила для гілки `main` (Settings → Branches → Add rule):
  - зміни лише через Pull Request;
  - 1 схвалення;
  - обов'язкові перевірки (додамо на етапі D);
  - заборона force-push.

### A4. Домен і Cloudflare
- [ ] Купити домен (Cloudflare Registrar або будь-який реєстратор).
- [ ] Створити акаунт Cloudflare і додати домен. Якщо домен куплено не в Cloudflare, змінити NS-записи у реєстратора на ті, що видасть Cloudflare.

### A5. Сервіси Google (можна під час етапу E)
- [ ] Google-акаунт проєкту (окремий, не особистий).
- [ ] Search Console — підтвердимо на етапі G.
- [ ] Аналітика: GA4 або Umami/Plausible (self-host на Dokploy). Вибір — `docs/04`, розділ 5.

**Готово, коли:** рішення записані, є організація й порожній приватний репозиторій, домен доданий у Cloudflare, на комп'ютері встановлені Node.js і Git.

---

## Етап B. Каркас сайту

Мета: порожній, але повністю робочий сайт, куди нові сторінки додаються без ручної роботи з меню, посиланнями й SEO. Детально — `docs/03-architecture.md` і `docs/04-tech-and-deploy.md`.

### B1. Створити проєкт
```bash
npm create astro@latest site -- --template minimal --typescript strict
```
```bash
cd site
```
```bash
npx astro add preact mdx sitemap tailwind
```
```bash
npm i -D vitest @playwright/test pagefind
```

### B2. Налаштування `astro.config.mjs`
```js
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ВАШ-ДОМЕН.com',
  trailingSlash: 'always',            // /gravel-calculator/
  build: { format: 'directory' },
  integrations: [preact(), mdx(), sitemap()],
  i18n: { defaultLocale: 'en', locales: ['en', 'es'], routing: { prefixDefaultLocale: false } },
  vite: { plugins: [tailwindcss()] },
});
```

### B3. Скрипти в `package.json`
```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build && pagefind --site dist",
  "preview": "astro preview",
  "check": "astro check",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "seo-lint": "node scripts/seo-lint.mjs",
  "links": "node scripts/link-report.mjs",
  "new": "node scripts/new-calculator.mjs"
}
```

### B4. Структура папок
Створити структуру з `docs/04-tech-and-deploy.md`, розділ 2:
- `src/calculators/`, `src/content/`, `src/components/`, `src/layouts/`, `src/pages/`, `src/i18n/`;
- `src/registry.ts`, `scripts/`, `public/`;
- `docs/` — скопіювати туди документи з цієї папки разом із `docs/templates/`;
- `CLAUDE.md` — у корінь репозиторію.

### B5. Дизайн-основа і макет (mobile-first)
- [ ] Дизайн-токени (кольори, шрифти, відступи) і світла/темна тема.
- [ ] `layouts/Base.astro`:
  - **шапка** — лого, пошук Pagefind, меню категорій (на телефоні бургер, пошук завжди видно);
  - **футер** — категорії, About, Methodology, Editorial Policy, Contact, Privacy, Terms, «Do Not Sell or Share»;
  - хлібні крихти.
- [ ] Вимоги: `docs/06-mobile.md`. Перевіряти на ширині 375 px.

### B6. UI-кіт калькуляторів (`src/components/`)
- [ ] `NumberInput` (правильна клавіатура, розумний розбір «1,250»), `TimeInput` («855» → 8:55), `UnitToggle` (`ft | m`), `Select`/сегменти.
- [ ] `ResultCard` (великий результат + «How it's calculated»), `ResultTable`, `StickyResult` (липкий рядок на телефоні).
- [ ] `ShareButton` (стан у URL + Web Share), `CopyButton`, `PrintButton`, `CsvButton`.
- [ ] `AdSlot` (резервована висота), `FAQ`, `Breadcrumbs`, `RelatedCards`, `NextSteps`, `Calc` (посилання на інший калькулятор; якщо слаг не існує, збірка падає).

### B7. Реєстр калькуляторів (`src/registry.ts`)
Кожен калькулятор описує себе в `meta.ts` (формат — `docs/04`, розділ 2). Реєстр збирає всі `meta.ts` і **перевіряє при збірці**:
- [ ] унікальність слагів і головних запитів (антиканібалізація);
- [ ] що всі `related`/`next` існують;
- [ ] що зв'язки `related` двосторонні (додає зворотні автоматично);
- [ ] що категорія існує.

З реєстру генеруються меню, хаби, хлібні крихти, related/next, sitemap, hreflang.

### B8. Схема контенту (`src/content.config.ts`)
Колекції `calculators`, `categories`, `authors`, `guides` зі схемою zod:
- `title` ≤ 60, `description` ≤ 155, `h1`, `intro`;
- `faq[]` (≥ 4), `sources[]`, `author`;
- `reviewer` (обов'язково, якщо `ymyl: true`), `updated`.

### B9. Маршрути (`src/pages/`)
- [ ] `index.astro` — головна: **повноцінний базовий калькулятор** + пошук + категорії + популярні.
- [ ] `[slug].astro` — сторінка калькулятора (шаблон блоків — `docs/03`, розділ 5).
- [ ] `[category]/index.astro` — хаб категорії.
- [ ] Службові: about, methodology, editorial-policy, authors, contact, privacy, terms, 404.
- [ ] `es/…` — підготувати, але не публікувати до 5-го місяця.

### B10. SEO-компоненти
- [ ] `Head.astro`: title, description, canonical (без параметрів), hreflang, `lang`, Open Graph.
- [ ] `JsonLd.astro`: WebApplication, BreadcrumbList, FAQPage (лише для видимого FAQ), Organization/WebSite на головній.
- [ ] `public/robots.txt` (закрити `/search/`, посилання на sitemap).
- [ ] Автоматична OG-картинка для кожного калькулятора.

### B11. Службові скрипти (`scripts/`)
- [ ] `new-calculator.mjs` — `npm run new gravel` створює папку калькулятора, `meta.ts`, `logic.ts`, `logic.test.ts`, UI-файл і MDX за шаблоном.
- [ ] `seo-lint.mjs` — перевірки з `docs/07-seo-checklist.md`, розділ «Що автоматизуємо».
- [ ] `link-report.mjs` — сироти, сторінки з < 3 вхідних посилань, биті посилання.

**Готово, коли:** `npm run dev` показує головну, хаб і тестову сторінку-заглушку; меню й хлібні крихти будуються з реєстру; `npm run build` проходить; сторінка на 375 px виглядає правильно.

---

## Етап C. Перший калькулятор від і до

Пілот — **gravel calculator** (легкий, слабкий топ, SD 21). Усі наступні калькулятори робляться так само.

### C1. Бриф
- [ ] Виконати чекліст `docs/09-page-brief-checklist.md` і заповнити `docs/templates/page-brief.md`.
- [ ] Зберегти як `docs/briefs/gravel-calculator.md`.
- [ ] Результат брифу: формула з першоджерелом, поля, припущення, ≥ 5 еталонних прикладів, must-have, 3 переваги над топ-3, план тексту, FAQ, перелінковка.

### C2. Логіка і тести
```bash
npm run new gravel
```
`src/calculators/gravel/logic.ts` — лише чисті функції, без UI:
```ts
/** Об'єм у кубічних ярдах. Довжина й ширина у футах, глибина в дюймах. */
export function volumeYd3(lengthFt: number, widthFt: number, depthIn: number): number {
  return (lengthFt * widthFt * (depthIn / 12)) / 27;
}
```
`logic.test.ts` — еталонні приклади з брифу:
```ts
import { describe, it, expect } from 'vitest';
import { volumeYd3 } from './logic';

describe('gravel volume', () => {
  it('10 ft × 10 ft × 3 in = 0.926 yd³', () => {
    expect(volumeYd3(10, 10, 3)).toBeCloseTo(0.926, 3);
  });
});
```
```bash
npm test
```

### C3. Інтерфейс (острівець Preact)
- [ ] Поля за специфікацією брифу, значення за замовчуванням, розрахунок під час введення.
- [ ] Пояснення з формулою, дії з результатом, стан у URL.
- [ ] Липкий результат на телефоні, якщо форма довга.

### C4. Текст (`src/content/calculators/en/gravel-calculator.mdx`)
- [ ] Frontmatter (title, description, h1, faq, sources, author, updated).
- [ ] Текст за планом брифу, посилання на інші калькулятори через `<Calc slug="…">`.

### C5. Зв'язки (`meta.ts`)
- [ ] `category`, `related` (4–6), `next` (2–3), `aliases`.

### C6. Локальна перевірка
```bash
npm run dev
```
- [ ] Перевірити на телефоні або в емуляції 375 px: калькулятор на першому екрані, результат одразу, немає горизонтальної прокрутки.
- [ ] Запустити `npm test`, `npm run build`, `npm run seo-lint`, `npm run links`.

### C7. Pull Request
- [ ] Гілка `calc/gravel` → PR з чеклістом (тести, джерела, FAQ, related/next, скріншот мобільної версії, посилання на бриф).
- [ ] Рев'ю → merge.

**Готово, коли:** gravel calculator повністю відповідає брифу, проходить усі перевірки і злитий у `main`. Процес зафіксовано як зразок.

---

## Етап D. Автоматичні перевірки (CI)

Файл `.github/workflows/ci.yml` (скелет):
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run check
      - run: npm test
      - run: npm run build
      - run: npm run seo-lint
      - run: npm run links
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```
- [ ] Playwright-тести: кожна сторінка відкривається на iPhone SE (375×667) і Pixel 7; калькулятор видно на першому екрані; результат з'являється; немає горизонтальної прокрутки.
- [ ] Lighthouse CI (мобільний профіль): Performance ≥ 90, Accessibility ≥ 95, SEO = 100, JS ≤ 50 КБ.
- [ ] У правилах гілки `main` (A3) позначити job `check` як обов'язковий.
- [ ] Шаблони `.github/ISSUE_TEMPLATE/new-page.md` (на основі брифу) і `.github/PULL_REQUEST_TEMPLATE.md` (чекліст із C7).

**Готово, коли:** PR з навмисною помилкою (задовгий title або битий `<Calc>`) не можна злити, а чистий PR проходить.

---

## Етап E. Деплой і домен

### Варіант A: свій сервер Dokploy + Cloudflare
`Dockerfile` у корені:
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
```
`nginx.conf`:
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  location / { try_files $uri $uri/ =404; add_header Cache-Control "no-cache"; }
  location /_astro/ { expires 1y; add_header Cache-Control "public, immutable"; }
  error_page 404 /404.html;
}
```
- [ ] У Dokploy: новий Application з GitHub-репозиторію, **Build Type: Dockerfile** (не Nixpacks), домен, HTTPS.
- [ ] **Вимкнути автодеплой при push.** Деплой запускає GitHub Actions після зеленого CI: окремий job, що викликає деплой-вебхук Dokploy. URL вебхука зберігається в GitHub Secrets.
- [ ] Cloudflare:
  - DNS-запис на сервер у режимі «Proxied»;
  - SSL/TLS «Full (strict)»;
  - правило кешу для `/_astro/*`;
  - після деплою Actions скидає кеш через API Cloudflare.
- [ ] Preview-деплої для PR: Dokploy preview deployments на піддомені.

### Варіант B: Cloudflare Pages
- [ ] Cloudflare → Workers & Pages → Create → Pages → підключити GitHub-репозиторій.
- [ ] Build command `npm run build`, Output directory `dist`, змінна `NODE_VERSION=22`.
- [ ] Прив'язати свій домен. Preview для кожного PR створюється автоматично.

**Готово, коли:** злиття в `main` автоматично оновлює сайт на домені з HTTPS, а кожен PR має preview-посилання.

---

## Етап F. Наповнення до запуску (143 сторінки)

Список — аркуш **«Launch (month 0)»** у `Page_Plan_12_months.xlsx`.

### F1. Спершу — «движки» для масових типів сторінок
Кожен тип будується один раз, далі сторінки додаються конфігурацією + текстом:
- [ ] **Конвертер одиниць:** таблиця одиниць з точними коефіцієнтами NIST; один шаблон для будь-якої пари; обидва напрямки пов'язані; таблиця популярних значень; друк.
- [ ] **Сторінка значення:** генерується з конфігурації (список значень лише з попитом ≥ 1 000/міс). Своя цінність: перцентиль зросту (CDC), сусідні значення, контекст.
- [ ] **Дата:** «N days/weeks/months from today / ago». «Сьогодні» рахується в браузері за часовим поясом користувача; статичний HTML показує дату збірки (щоденна перезбірка за розкладом у GitHub Actions); робочі дні, свята США, календар.
- [ ] **Відлік / свято:** правило дати (наприклад, 4-й четвер листопада), дати на 3–5 років.
- [ ] **Швидка відповідь:** «how many weeks in a year», «what is today's date».

### F2. Сторінки зі списку запуску
Для кожної сторінки:
1. Бриф за `docs/09`. Для конвертерів, значень і дат — скорочений, 20–40 хв.
2. Побудова: калькулятор як на етапі C, або запис у конфігурації движка + текст.
3. PR → перевірки CI → рев'ю → merge.
4. У `Page_Plan_12_months.xlsx`, аркуш All pages, колонка Status → `Published`.

Порядок:
1. 21 калькулятор;
2. 52 конвертери;
3. 32 сторінки значень;
4. 25 дат і відповідей;
5. 5 хабів (тексти вступів);
6. 8 службових сторінок.

### F3. Службові сторінки і довіра
- [ ] About, Methodology (як тестуємо формули), Editorial Policy, Authors (реальні люди з біографією), Contact, Privacy, Terms, Do Not Sell or Share.

**Готово, коли:** усі 143 сторінки мають статус Published у плані й проходять CI; `npm run links` не показує сирітських сторінок.

---

## Етап G. Запуск

- [ ] Пройти `docs/07-seo-checklist.md`, розділ **A**, повністю.
- [ ] Search Console: підтвердити доменний ресурс (DNS-запис у Cloudflare), надіслати sitemap.
- [ ] Bing Webmaster Tools: імпортувати з Search Console, увімкнути IndexNow.
- [ ] Аналітика: події calculate, copy, share, print, export, кліки «next».
- [ ] «Request indexing» у Search Console для 10–20 головних сторінок.
- [ ] Реклама: подати сайт в AdSense після запуску (потрібен реальний контент і трафік), налаштувати CMP (згода на cookies) і `ads.txt`.
- [ ] Почати роботу з посиланнями: віджети, шаблони для друку, ресурсні сторінки (`docs/07`, розділ C).

**Готово, коли:** sitemap прийнятий, перші сторінки в індексі (перевірка через 1–2 тижні), аналітика збирає події.

---

## Етап H. Щомісячна робота

1. **На початку місяця:** відфільтрувати в `Page_Plan_12_months.xlsx` сторінки поточного місяця (All pages → Month = N).
2. **Для кожної сторінки:** бриф (`docs/09`) → побудова → CI → публікація → Status = Published.
3. **Відкриття нових фаз за планом:**
   - місяць 2 — генератори і Business;
   - місяць 3 — Health (потрібен рецензент) і зарплата по штатах (потрібен податковий движок із даними на поточний рік);
   - місяць 4 — Finance (автор-фахівець);
   - місяць 5 — іспанська версія (носій мови) і Science.
4. **Контроль:** `docs/07`, розділ D (Search Console: CTR, позиції 8–20, помилки індексації, Core Web Vitals, канібалізація).
5. **Оновлення даних за календарем:** податкові таблиці й ліміти (січень), свята, мінімальні зарплати, курси (щодня автоматично).
6. **Якщо змінились правила плану:** `python research/build_inventory.py` і `python research/export_plan.py`. Колонку Status перенести вручну або попросити асистента.

---

## Шпаргалка: головні документи

| Коли | Документ |
|---|---|
| Як влаштований сайт | `docs/03-architecture.md` |
| Технології, структура коду, деплой | `docs/04-tech-and-deploy.md` |
| Мобільна версія | `docs/06-mobile.md` |
| SEO перед запуском і перед кожною публікацією | `docs/07-seo-checklist.md` |
| Аналіз перед кожною сторінкою | `docs/09-page-brief-checklist.md` + `docs/templates/page-brief.md` |
| Які сторінки і коли | `Page_Plan_12_months.xlsx` |
| Чому саме так | `HANDOFF.md`, `docs/08-growth-strategy.md` |
