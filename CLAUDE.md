# CLAUDE.md — інструкції для AI-асистента в цьому проєкті

Проєкт: статичний сайт онлайн-калькуляторів для пошуку Google у США. Спершу прочитай `HANDOFF.md`: там стан проєкту, рішення та історія обговорення. Карта файлів — `README.md`.

## Спілкування
- Власник пише українською (іноді з російськими словами). Відповідай **українською**, просто й без жаргону. Технічні терміни пояснюй.

## Правила роботи зі сторінками (рішення власника, 28.09.2026)
1. **Аналіз перед кожною сторінкою роби сам і автоматично**, не чекаючи окремої команди. Виконай чекліст `docs/09-page-brief-checklist.md`, заповни бриф за шаблоном `docs/templates/page-brief.md` і **одразу будуй сторінку** на основі брифу. Потім пройди перевірки `docs/07-seo-checklist.md`, розділ B.
2. **Ubersuggest для аналізу не використовуй.** Джерела:
   - попит і пріоритет — `Page_Plan_12_months.xlsx`, `research/data/page_inventory.csv`, `research/keywords_*.tsv`;
   - конкуренти — `research/data/competitor_pages.csv` (хто має таку сторінку, трафік, донори) + веб-пошук; сторінки конкурентів завантажуй і розбирай напряму, їхні калькулятори тестуй на однакових вхідних даних;
   - формули — офіційні першоджерела (NIST, U.S. DOL/FLSA, IRS, CDC/NIH, виробники), знайдені веб-пошуком;
   - питання людей — підказки Google, People Also Ask, Reddit, форуми;
   - після запуску — Google Search Console.
3. **Не вважай рейтингом видачу Google/Bing у вбудованому браузері.** Вона неправдива (сторонні сайти, казино), бо запити йдуть не з США.
4. **Сторінку не будуй, якщо в брифі немає 3 конкретних переваг над топ-3.** Спершу знайди, чим бути кращими.
5. **Сторінка значення** («80 kg to lbs», «90 days from today») — лише при підтвердженому попиті ≥ 1 000/міс і з власною цінністю (таблиця сусідніх значень, перцентиль, календар тощо).
6. **YMYL-сторінки** (фінанси, здоров'я, податки по штатах) — лише з рецензентом, джерелами .gov/.edu, дисклеймером і датою оновлення даних.

## Архітектура й код (коли почнеться розробка)
- Порядок робіт — `docs/10-build-guide.md` (етапи A–H з критеріями «Готово, коли…»). Не переходь до наступного етапу, поки не виконано критерій попереднього.
- Стек: Astro (static) + Preact-острівці + TypeScript + Tailwind; тести Vitest (логіка) і Playwright (smoke, мобільна версія). Деталі — `docs/04-tech-and-deploy.md`.
- Один калькулятор = папка `src/calculators/<id>/` (`meta.ts`, `logic.ts`, `logic.test.ts`, UI). Контент — MDX у `src/content/`.
- Меню, хаби, хлібні крихти, related/next-посилання, sitemap, hreflang і schema генеруються з реєстру, **не вручну**.
- Адреси: нижній регістр, дефіси, слеш у кінці, плоскі (`/gravel-calculator/`). Після публікації не змінювати без 301-редиректу.
- Логіка калькулятора — чисті функції, щонайменше 5 еталонних прикладів у тестах, з них ≥ 2 з першоджерела.
- Mobile-first (`docs/06-mobile.md`): калькулятор на першому екрані 375 px, результат під час введення, без реклами над калькулятором.
- **Дизайн — `docs/11-design-system.md` («Field Manual»).** Усі кольори, шрифти, радіуси, тіні й тривалості беруться з токенів `src/styles/global.css`. Нових значень «з голови» не вводь: потрібен відтінок — додай токен. Картка калькулятора завжди `CalculatorCard.astro`, поля — компоненти з `src/components/ui/`. Антиква (Newsreader) лише в `h1`–`h3`; цифри, що змінюються, — з класом `.figure`. Після візуальних правок перевіряй бюджети з §9 цього документа (Lighthouse моб.: Perf ≥ 90, A11y ≥ 95, SEO 100, CLS ≤ 0,05).
- Шрифти самохостовані в `public/fonts/`; оновлення — `npm run fonts` (виконується автоматично в `npm run build`).
- Встановлені скіли-помічники (не в git, пін у `skills-lock.json`, відновлення — `npx skills experimental_install`): `tailwind-design-system` (Tailwind v4, CSS-first токени), `ui-animation` (правила руху), `accessibility`, `core-web-vitals`, `performance`, `best-practices`, `seo`, `web-quality-audit` (аудит за Lighthouse). Глобальний `frontend-design` — для візуальних рішень.
- Секрети лише в `.env` (у `.gitignore`). Не комітити ключі.

## Розробка (стан на 30.09.2026: етапи B і C виконано локально)
- Код сайту лежить у корені цієї папки поруч із `docs/` і `research/`. Spec-kit: `.specify/`, специфікації в `specs/` (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`). Конституція проєкту — `.specify/memory/constitution.md`.
- Команди: `npm run dev` · `npm run check` · `npm test` · `npm run build` (fonts + astro build + pagefind) · `npm run seo-lint` · `npm run links` · `npm run test:e2e` (Playwright, iPhone SE 375 / Pixel 7 / 320 px) · `npm run verify` (усе разом, крім e2e) · `npm run new <id>` (скелет калькулятора).
- Кожен калькулятор: `src/calculators/<id>/{meta.ts, logic.ts, logic.test.ts, <Name>Calculator.tsx, island.astro}` + `src/content/calculators/en/<slug>.mdx`. `island.astro` обов'язковий: Astro не гідрує динамічні framework-компоненти, тому обгортка статично імпортує острівець.
- `<Calc slug="…">` у MDX: невідомий слаг ламає збірку; слаг чернетки (`status.en: 'draft'`) рендериться текстом і стає посиланням автоматично після публікації.
- Хаб категорії будується лише коли в ній є ≥ 1 опублікований калькулятор. Заглушки (`status: 'draft'`) не рендеряться, але потрібні для `related`/`next`.
- Домен і бренд — плейсхолдери: `SITE_URL` у `.env`, `src/data/site.ts` (`TODO(owner)`), `public/robots.txt` (рядок Sitemap).
- Потрібні Node 22.12+ і npm ≥ 9 (на цьому ПК: Node 24.14, npm 11.20; npm 12 вимагає Node ≥ 24.15). `typescript` тримати на 6.x — `@astrojs/check` ще не підтримує 7. Перед `npm ci` зупиняй `astro preview`, інакше EPERM на `lightningcss*.node`.

## План сторінок
- `Page_Plan_12_months.xlsx` — поіменний план (місяць 0 = запуск). Після публікації сторінки онови колонку Status (аркуш All pages).
- Перезбірка плану, якщо змінились правила: `python research/build_inventory.py`, потім `python research/export_plan.py`.
- `research/harvest.py` збирав дані з журналів сесій на ПК власника. На іншому ПК він не потрібен: дані вже в `research/data/`.

## Відкриті питання (див. HANDOFF.md, розділ 5)
GitHub-акаунт і назва організації · домен · розміщення (Dokploy `49.12.4.84` + Cloudflare чи Cloudflare Pages) · рецензенти для фінансів і здоров'я. Не створюй репозиторій, не купуй домен і не деплой без відповіді власника.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
