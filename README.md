# Сайт калькуляторів для США

Статичний сайт онлайн-калькуляторів, конвертерів і швидких відповідей під пошук Google у США. Заробіток — реклама. Англійська зараз, іспанська для США — вибірково пізніше. Розробка в GitHub, розміщення статики на власному сервері (Dokploy) або в Cloudflare Pages.

> **Вперше тут? Почни з [HANDOFF.md](HANDOFF.md)**: що за проєкт, історія рішень, що далі.
> **Будуєте сайт? Покрокова інструкція — [docs/10-build-guide.md](docs/10-build-guide.md).**
> Для AI-асистента правила — у [CLAUDE.md](CLAUDE.md).

## Статус (30.09.2026)

| Етап | Стан |
|---|---|
| Дослідження попиту й конкурентів | ✅ готово |
| Стратегія, мови, архітектура, мобільна версія, SEO, технології | ✅ готово (документи в `docs/`) |
| Поіменний план сторінок на 12 місяців | ✅ готово (`Page_Plan_12_months.xlsx`) |
| Чекліст аналізу перед кожною сторінкою | ✅ готово (`docs/09`) |
| **Етап B — каркас сайту** (Astro 7 + Preact + Tailwind 4, реєстр, макети, SEO, пошук, скрипти перевірок) | ✅ готово локально (`specs/001-site-skeleton-gravel/`) |
| **Етап C — перший калькулятор** (`/gravel-calculator/`: бриф, логіка з 37 тестами, острівець, текст) | ✅ готово локально; Lighthouse mobile 99/100/100/100, JS 10 KB gzip |
| Рішення власника: GitHub-акаунт, домен, розміщення | ⏳ очікується |
| **Етап D — CI** (`.github/workflows/ci.yml`: check → test → build → seo-lint → links → Playwright → Lighthouse budgets; шаблони PR/issue) | ✅ готово; захист гілки `main` — після `gh auth login` |
| Етап E (деплой), F (143 сторінки) | ⬜ не почато |

Запуск локально: `npm install` → `npm run dev`. Усі перевірки: `npm run verify && npm run test:e2e`. Деталі — `specs/001-site-skeleton-gravel/quickstart.md`.

## План сторінок

**[Page_Plan_12_months.xlsx](Page_Plan_12_months.xlsx)** — поіменний перелік: 143 сторінки на запуску → 342 до 3-го місяця → 570 до 6-го → 1 020 до 12-го, плюс 1 184 у беклозі. По кожній сторінці: адреса, тип, категорія, місяць, трафік конкурента, приклад його сторінки, статус.

## Документи

| Файл | Про що |
|---|---|
| [HANDOFF.md](HANDOFF.md) | **Почни тут:** огляд, історія обговорення, рішення, відкриті питання, наступні кроки, словник |
| [CLAUDE.md](CLAUDE.md) | Правила для AI-асистента (аналіз сторінок автоматично, без Ubersuggest тощо) |
| [docs/01-research.md](docs/01-research.md) | Реальний попит і конкуренти в Google США, рейтинг можливостей, сильні сторони лідерів |
| [docs/02-languages.md](docs/02-languages.md) | Які мови робити і чому (з цифрами); чому іспанська лише вибірково |
| [docs/03-architecture.md](docs/03-architecture.md) | Категорії, адреси, меню, шаблон сторінки, SEO-текст, перелінковка, E-E-A-T, реклама |
| [docs/04-tech-and-deploy.md](docs/04-tech-and-deploy.md) | Стек (Astro + Preact + TS), структура коду, робота в GitHub, деплой |
| [docs/05-roadmap.md](docs/05-roadmap.md) | Скільки сторінок по місяцях, фази запуску, стартові 21 калькулятор, метрики |
| [docs/06-mobile.md](docs/06-mobile.md) | Мобільна версія: введення, липкий результат, PWA/офлайн, реклама, перевірки |
| [docs/07-seo-checklist.md](docs/07-seo-checklist.md) | SEO-чекліст: перед запуском, перед публікацією сторінки, посилання, щомісячний контроль |
| [docs/08-growth-strategy.md](docs/08-growth-strategy.md) | **Стратегія:** як обігнати конкурентів, звідки в них трафік, 10 напрямів росту |
| [docs/09-page-brief-checklist.md](docs/09-page-brief-checklist.md) | Чекліст аналізу перед кожною сторінкою: запит, конкуренти, формула, UX, контент, рішення |
| [docs/templates/page-brief.md](docs/templates/page-brief.md) | Шаблон брифу сторінки |
| [docs/10-build-guide.md](docs/10-build-guide.md) | **Покрокова інструкція побудови сайту:** від рішень і акаунтів до каркаса, першого калькулятора, CI, деплою, запуску та щомісячної роботи |
| [docs/11-design-system.md](docs/11-design-system.md) | **Дизайн-система «Field Manual»:** концепція, кольорові токени, шрифти, сітка, компоненти, рух, доступність, бюджети |

## Коротко про рішення

- **Мова:** англійська (98–99% попиту). Іспанська — лише сторінки, які іспаномовні в США справді шукають іспанською: конвертери одиниць, калькулятор годин, курс долара до песо.
- **Запуск ≈ 143 сторінки:**
  - 21 калькулятор у трьох темах (час і оплата праці, будівництво, математика);
  - ~52 конвертери;
  - ~32 сторінки конкретних значень;
  - ~25 відповідей про дати;
  - хаби та службові сторінки.
- **Далі:** зарплата по штатах (CPC до $21, у топі нові слабкі сайти), генератори, бізнес, геометрія; фінанси й здоров'я — з фахівцем-рецензентом.
- **Архітектура:** 10 категорій-хабів, плоскі адреси (`/gravel-calculator/`). Меню, перелінковка, sitemap, hreflang і розмітка будуються автоматично з одного реєстру.
- **Технології:** Astro (статика, мінімум JS) + Preact + TypeScript; формули — окремі функції з тестами. Сайт mobile-first.
- **GitHub:** організація, приватний репозиторій, зміни через PR з автоматичними перевірками.
- **Розміщення:** GitHub Actions → Dokploy (Dockerfile + nginx) → Cloudflare CDN, або Cloudflare Pages.
- **Перед кожною сторінкою:** бриф за `docs/09`. Аналіз робить AI-асистент сам, без Ubersuggest.

## Структура папки

```
Calculator/
├─ HANDOFF.md                  ← почни тут
├─ CLAUDE.md                   ← правила для AI-асистента
├─ README.md                   ← цей файл
├─ Page_Plan_12_months.xlsx    ← поіменний план сторінок (Summary / Launch / All pages / Legend)
├─ package.json, astro.config.mjs, tsconfig.json, vitest.config.ts, playwright.config.ts
├─ src/                        ← код сайту (Astro)
│  ├─ calculators/<id>/        ← meta.ts, logic.ts, logic.test.ts, <Name>Calculator.tsx, island.astro
│  ├─ content/                 ← MDX: calculators/en, categories/en, authors
│  ├─ components/, layouts/, pages/, lib/ (registry, seo, url-state), data/ (site, categories), i18n/
│  └─ styles/global.css        ← Tailwind 4 + дизайн-токени (світла/темна тема)
├─ scripts/                    ← seo-lint, link-report, new-calculator (+ templates/), pagefind
├─ tests/e2e/                  ← Playwright: мобільні smoke-тести
├─ specs/                      ← spec-kit: spec, plan, research, data-model, tasks для кожної фічі
├─ .specify/                   ← spec-kit: конституція, шаблони, скрипти
├─ docs/                       ← усі рішення та чеклісти (01–11), шаблон брифу, briefs/ (брифи сторінок)
├─ research/                   ← дані досліджень і скрипти
│  ├─ data/                    ← зібрані дані (CSV): сторінки конкурентів, запити, видача, план
│  ├─ keywords_*.tsv           ← перевірені запити: англійська, іспанська, нові напрями
│  ├─ serp_google_us.md        ← топ-10 Google США по 56 запитах
│  ├─ competitors_top_pages.md ← топ-сторінки 5 головних конкурентів (читабельно)
│  ├─ opportunity_ranking.md   ← рейтинг перших 55 калькуляторів
│  ├─ old-chat-…md             ← відновлений чат 6.08.2026 «Калькулятори на всі мови»
│  └─ *.py                     ← скрипти (див. нижче)
├─ US_calculator_keyword_analysis_full.xlsx ← початковий аналіз 434 запитів (6.08.2026)
├─ suggestions_ubersuggest_calculator.csv   ← сирі дані до нього
├─ notes.docx                  ← короткий опис початкової таблиці
├─ .env.example                ← зразок файлу ключів (сам .env у git не потрапляє)
└─ .gitignore
```

## Дані та скрипти

| Файл | Що |
|---|---|
| `research/data/competitor_pages.csv` | 4 006 топ-сторінок 10 конкурентів: трафік, кількість сайтів-донорів |
| `research/data/page_inventory.csv` | 2 204 унікальні сторінки з місяцем публікації (джерело для Excel-плану) |
| `research/data/keywords.csv`, `serps.csv`, `suggestions.csv` | зібрані обсяги запитів, видача Google, варіанти запитів |
| `research/keywords_en_us.tsv`, `keywords_es_us.tsv`, `keywords_expansion.tsv` | перевірені запити по напрямах |
| `research/build_inventory.py` → `export_plan.py` | перебудова плану сторінок і Excel (`python research/build_inventory.py`, потім `python research/export_plan.py`) |
| `research/score.py` | рейтинг перших 55 калькуляторів |
| `research/page_audit.py` | аудит сторінок-лідерів (обсяг тексту, H2, FAQ, розмітка) |
| `research/harvest.py` | збирав дані з журналів сесій на ПК власника; на іншому ПК не потрібен |
| `research/serp_check.py` | запасний збір видачі через Serper.dev (не використовувався) |
