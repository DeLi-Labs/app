# План переробки сторінки `/patent/[id]` → сторінка кейсу

**Призначення.** Перетворити поточну сторінку `core/packages/nextjs/app/patent/[id]/page.tsx` (показує патент + ліцензійну кампанію) на **сторінку кейсу case-DAO** — те, що бачить funder *до* того, як зайти в DAO по конкретному infringement-кейсу.

**Контекст із PRD.**

- Кожен кейс має власний case-DAO з окремим treasury і LFA-обгорткою (per-case DAO model).
- Перед входом funder отримує **unified AI-assisted case dashboard** із структурованою інформацією по DD-осях: patent strength, infringement-read confidence, damages range, defendant recoverability, procedural risk flags, timeline projection.
- Кейс може зайти в платформу на одному з трьох entry-points: **P** (pre-litigation), **L** (active-litigation), **A** (post-judgment). Стадії від `learning-path-patent-enforcement.md` §1.

**Що поза скоупом.**

- Форми заповнення даних (профіль власника патенту, інтейк кейсу, заявка інфрінджера).
- Зміни в стилях, кольорах, типографіці, layout-розмірах, gradient-border-ах. Все залишається 1-в-1 як зараз.
- Зміни в інших сторінках платформи.

**Що в скоупі.** Тільки переназначення *вмісту* існуючих компонентів сторінки на дані case-DAO.

**Базове перейменування.** `/patent/[id]` → концептуально `/case/[id]` (де `id` — case-DAO ідентифікатор, а не tokenId патенту). Маршрут можна або переназвати, або тримати під старим URL із внутрішнім перевизначенням сутності — це окреме рішення, не блокуюче для плану.

---

## Дві сутності на сторінці

Слід чітко тримати в голові, що сторінка обслуговує **дві сутності одночасно**:

1. **Patent (загальні дані)** — публічно відомі факти про патент, який є основою кейсу. Джерела: EPO Register, Espacenet, prosecution history, UPC opt-out registry. Це **не змінюється від кейсу до кейсу** — те саме для будь-якого кейсу по тому самому патенту.

2. **Case (specific infringement case)** — конкретний infringement-кейс по цьому патенту: хто відповідач, що порушує, на якому етапі (P/L/A), скільки грошей треба зібрати, які умови LFA, прогрес по стадіях. Це **сутність case-DAO**.

Поточні компоненти показують головно сутність №1 (патент) + ліцензійну кампанію. У новій версії компоненти **переключаються на показ переважно сутності №2 (кейсу)**, з мінімально необхідним підмножиною даних сутності №1 (бо funder має бачити, що за патент стоїть за кейсом, але детальне prosecution-history-чтиво — не на цій сторінці).

---

## Покомпонентна карта замін

Структура нижче слідує DOM-порядку компонентів у `app/patent/[id]/page.tsx`. Для кожного компонента:

- **Поточна роль** — що там зараз.
- **Нова роль** — що там буде.
- **Mapping полів** — кожне поточне поле/слот → новий вміст.

### 1. `CrumbsNavigation`

**Поточна роль.** Хлібні крихти: `Patents › <patent name>`.

**Нова роль.** Хлібні крихти: `Cases › <case short name>`.

**Mapping.**

| Поточне | Нове |
|---|---|
| `labelMap={{ patent: "Patents" }}` | `labelMap={{ case: "Cases" }}` (або зберегти URL — `{{ patent: "Cases" }}`, якщо роут не перейменовуємо) |
| Динамічна підпис: `patentDetail.name` | Динамічна підпис: case short name (формат: `<patent number short> v. <defendant short>`) |

---

### 2. `PatentHeader` — секція

Секція тримає три внутрішні блоки: `PatentHeaderGeneralData` (зліва), `PatentHeaderMarketDataAndSocials` (справа), `PatentHeaderIndustries` (низ). Контейнер з gradient-border і `patentHeaderGlowSvg` залишається без змін.

#### 2.1 `PatentHeaderGeneralData` (лівий блок)

**Поточна роль.** Зображення патенту + дисклеймер про license mode + dropdown ліцензійних кампаній + назва патенту + коротке description + "Initial rights holder" з copy-кнопкою.

**Нова роль.** Зображення кейсу/відповідача + бейдж entry-point (P/L/A) + назва кейсу + коротка infringement-теза + ідентифікація **двох сторін кейсу** (patent owner ↔ defendant).

**Mapping.**

| Поточний слот | Що було | Що стає |
|---|---|---|
| `data.image` (round image 42/87px) | Логотип/арт патенту | Логотип/арт **відповідача** (D&B / OpenCorporates logo, fallback — placeholder). Опційно: dual-avatar (owner ↔ defendant) у тому самому slot-розмірі — два кружечки внахлест |
| Текст-підказка `*terms of use may vary depending on the license mode` | Інформаційний підпис над dropdown-ом | **Бейдж entry-point**: `Pre-litigation entry` / `Active-litigation entry` / `Post-judgment entry`. Текст — той самий розмір/колір, що поточний підпис |
| `CampaignDropdown` (license mode selector) | Вибір ліцензійного режиму | **Прибрати** (один кейс — один LFA-режим). Сам контейнер dropdown-висоти зберегти як **статичну "Case mode"-плашку** з coпier: `Case mode: <Fixed-cap funding round>` / `<Open commitment until close date>`. Якщо в кейсі справді буде кілька раундів фандингу (tranche A / B), dropdown зберігається з тими ж візуальними кодами, але вибирає **tranche**, а не license mode |
| `data.name` (h3) | Назва патенту | **Назва кейсу**: `<Patent EP-#> v. <Defendant short name>` |
| `data.description` (з `See more` → `#description`) | Перші 120 символів опису патенту | Перші ~120 символів **infringement-тези**: коротко "що порушено, ким, у якому продукті/сервісі, у якій юрисдикції". Якорь `#description` далі веде на **повну infringement-тезу**, не на патент-description |
| `Initial rights holder: <truncated owner>` + copy-кнопка | Wallet patent owner-а | **Два рядки** в тому самому блок-контейнері (gradient-border container) або один рядок із двома значеннями: `Patent owner: <truncated>` (copy) і `Defendant: <truncated name / wallet if exists / "N/A on-chain">`. Якщо тримати один рядок — лишити patent owner, а defendant перенести в правий блок. Перевага дворядкового: одразу видно обидва боки спору |

**Що залишається ідентичним.** Розміри елементів (42px / 87px image, gap-и, grid-кеси), кольори (`text-deli-white`, `text-deli-grey-light`), gradient-border на нижньому блоці.

#### 2.2 `PatentHeaderMarketDataAndSocials` (правий блок)

**Поточна роль.** Соц-кнопки (website/telegram/instagram/X) + status-card (patent status + timestamp) + token-id card + market-data table (Price + market cap, trading volume, total supply, retail %).

**Нова роль.** Зовнішні посилання на референс-матеріали по кейсу + status-card (case status у платформи) + case-id card + **case economics table** (funding target, committed, funder count, expected ROI band).

**Mapping.**

| Поточний слот | Що було | Що стає |
|---|---|---|
| 4 соц-іконки (Website/Telegram/Instagram/X) | Соцмережі патент-холдера | **Зовнішні референси кейсу** в тих же 4 слотах (та сама іконка-плюс-капсула, тільки інші icon-и і label-и можна не змінювати — використати ті ж SVG як універсальні links). Кандидати: посилання на патент в **Espacenet**, **EPO Register prosecution history**, **UPC CMS case record** (якщо вже L-етап), **defendant corporate registry** (Handelsregister / Infogreffe / OpenCorporates). Лейбли — `Patent`, `Prosecution`, `UPC case`, `Defendant` |
| `Patent status: valid/pending/invalid` + relative time | Юридичний статус патенту (з мапи `status`) | **Case status на платформі**: `Open for funding` / `Fully funded` / `In due diligence` / `Active litigation` / `Settled` / `Closed`. Колір-кодування і `(<n> ago)` — на тій самій механіці, що `getRelativeTimeLabel` |
| `Token ID: <n>` | tokenId NFT-патенту | **Case ID: `<short>`** (case-DAO адреса в скороченій формі або платформенний номер кейсу). Поточний tokenId патенту переїжджає в нижній правий стовпець статистики (див. 6.3) |
| Header `Price` + `$<currentPrice>` + 24h growth-badge | Ціна license-токена і % зростання | **`Funding target` + `$<targetAmount>` + `<funded %> badge`**. Growth-badge перевикористати під progress-percent (зелений > 50% / червоний / нейтральний — або просто завжди той самий колір категорії; візуальна семантика "growth" замінюється семантикою "fill") |
| `market cap` row | `$<totalEmittedLicensesValueUSD>` | **`Committed capital`** — `$<committedSoFar>`. Розмір/typo той самий |
| `Trading volume` row | `$<totalTradingVolumeUSD>` | **`Damages estimate range`** — `$<min> – $<max>`. (Це AI-згенеровний/owner-attested band per PRD §dashboard.) |
| `Total supply` row | Загальна емісія license-токенів | **`Funders`** — `<n participants>` (кількість унікальних адрес що закомітились) |
| `Retail percent` row | % retail vs професійних учасників | **`Retail share`** — те саме поняття, але по case-DAO funder set-у. Поняття і формат `%` зберігається 1-в-1 |

**Стани.** `showUnmarketedPatentMessage` (поточне "Patent is not marketed yet") → перейменувати в семантику кейсу: коли case-DAO ще не відкритий до funding-у (наприклад, перебуває в попередньому DD-аудиті reviewer-ом), показуємо ту саму overlay-плашку з текстом на кшталт `Case is in pre-funding review`.

#### 2.3 `PatentHeaderIndustries` (нижній блок секції)

**Поточна роль.** Теги індустрій патенту.

**Нова роль.** Залишається тегами індустрій (індустрія патенту й індустрія відповідача збігаються в більшості випадків) — **без змін**. Альтернатива (якщо є місце): додати другий рядок тегів — **forum tags**: `UPC Munich LD`, `UPC Mannheim LD`, `Central Division` тощо. Але тримати в окремому рядку, той самий стиль chip-ів.

---

### 3. Новий блок: **Case Progress Bar**

Перший із двох **нових компонентів**, що не мають прямого попередника на поточній сторінці. Користувач явно його замовив.

**Розташування.** Між `PatentHeader` і `DD Snapshot Grid` (див. 4), з тими ж відступами по горизонталі і `mt-[60px] lg:mt-0` зверху (як у решти секцій).

**Контейнер.** Та сама структура що `PatentHeader` секція: повноширинний контейнер з gradient-border і `bg-deli-main` (стиль скопіювати з `PatentHeader` `section`-а).

**Вміст.**

- Горизонтальна timeline-стрічка зі **всіма стадіями життєвого циклу кейсу** з `learning-path-patent-enforcement.md` §1:
  - **P1 → P8** (pre-litigation): Detection, Patent strength, Infringement, Damages, Defendant DD, Strategy, C&D, Settlement-negotiation.
  - **L1 → L10** (UPC litigation): Statement of Claim, Service, Preliminary Objections, Defence, Reply/Rejoinder, Closure, Interim, Oral, Decision, PI track.
  - **A1 → A4** (post-decision): Appeal, Damages assessment, Enforcement, Settlement execution.
- Кожна стадія — окремий **сегмент** із трьох візуальних станів:
  - `done` — заповнений кольором категорії (з `PATENT_CATEGORY_COLORS`).
  - `current` — підсвічений glow-ом (можна перевикористати `patentHeaderGlowSvg` логіку, або просто більш насичений колір категорії).
  - `pending` — нейтрально-сірий (`deli-grey-light` або `deli-background`).
- Над кожним сегментом — короткий label стадії (P1/P2/.../L1/.../A4). Hover/tap відкриває tooltip із розгорнутою назвою стадії і коротким "що відбулось" / "що очікується".
- Праворуч від стрічки (або під нею на mobile) — **summary-стрічка**:
  - `Stage: <current stage name>` (приклад: `Stage: L4 — Statement of Defence`).
  - `Entry point: P / L / A` (бейдж того entry-point-у, з якого кейс зайшов на платформу — щоб funder одразу бачив, що до етапу X кейс ішов поза платформою).
  - `Next expected event: <name + ETA>` (приклад: `Reply (Claimant) — by 2026-07-15`).

---

### 4. Новий блок: **DD Snapshot Grid**

Другий новий компонент сторінки. Це візуальне втілення "unified AI-assisted case dashboard" з PRD §dashboard inputs — структуроване DD-резюме по фіксованих funder-evaluation-осях.

**Розташування.** Між `Case Progress Bar` (див. 3) і `SwapSection` (див. 5). Відступ — `mt-[60px] lg:mt-0`, як у решти секцій.

**Контейнер.** Повноширинна `section` з gradient-border + `bg-deli-main`, така сама обгортка, як у `PatentHeader` і `Case Progress Bar`. Header секції зверху: `Due diligence snapshot` (текст-стиль `text-h4 text-deli-white`, як у `ScrollContainer` header-ах).

**Layout.** Сітка карток. На lg: `grid-cols-3 grid-rows-2`, на mobile: `grid-cols-1`. Кожна картка — той самий стиль gradient-border-маленьких карток, що вже використовується в правому стовпці `PatentTermsDetails` (див. 6.3) і в `PatentHeaderMarketDataAndSocials` (`marketTableCardClassName`). **Жодних нових візуальних стилів не вводимо.**

**6 DD-карток (фіксовані осі — з PRD §dashboard inputs):**

1. **Patent strength** — короткий вердикт (`Strong / Medium / Weak`) + per-axis confidence (`72%`) + 1-2 короткі підпункти (claim breadth, prosecution-history flags).
2. **Infringement read** — вердикт + confidence + посилання на сорс claim-chart (Patlytics / PatX export / ручний chart від owner-а).
3. **Damages range** — `$<min> – $<max>` + методологія в один рядок (`Reasonable royalty 3-5% × accused revenue $X-Y`).
4. **Defendant recoverability** — `Strong / Medium / Weak` + 1-рядкове summary з Orbis / OpenCorporates (assets, jurisdiction of seat, parallel litigations).
5. **Procedural risk flags** — список (`UPC opt-out: no`, `Parallel revocation pending in DE: yes`, `Counterclaim risk: medium`).
6. **Timeline projection** — очікувана тривалість до next milestone і до case resolution (`~6 months to oral hearing`, `~14 months to first-instance decision`).

**Інтракартковий формат (єдиний для всіх 6).** Кожна картка тримає три зони:

- Top: `label` (наприклад, `Patent strength`) — `text-body-3-caps text-deli-grey-light`.
- Middle: `verdict` / основне значення — `text-h3 text-deli-white` (як `Price` в `PatentHeaderMarketDataAndSocials`).
- Bottom: `confidence` бейдж (`xx% confidence`) — стиль як growth-badge в header-і (`bg` + `text-[var(--deli-status-valid)]` градації від upper-mid до низької впевненості); + 1-2 рядки supporting bullets `text-body-2 text-deli-grey-light`.

Розмір кожної картки — фіксований мінімум по висоті (узгоджено з `marketTableCardClassName` падингом), щоб ряд із трьох карток виглядав рівним.

**Кнопка "See sources" / "Methodology"** в правому верхньому куті кожної картки — посилання на сторінку джерел DD (поза скоупом цієї сторінки; URL — заглушка наразі).

---

### 5. `SwapSection` (чарт + свопер) → **Capital Commitment Section**

Секція **залишається у своєму поточному форматі**: лівий широкий блок (`flex-1`, 500px висота) — чарт; правий блок (`w-[500px]`) — формоподібний UI. Поточний layout зберігається 1-в-1. Змінюється тільки семантика наповнення обох блоків — це формат **commit** (як на DEX купують токен за стейбл — тут так само закомічуєш у case-DAO купуючи position-токен).

#### 5.1 Лівий блок: `CampaignChart` → **Funding Progress Chart**

**Поточна роль.** Графік погодинної ціни license-токена (часова крива `hourlyPrices` → лінійний/area chart кольору категорії).

**Нова роль.** **Чарт прогресу фандингу case-DAO** — той самий time-series-чарт, що приймає масив `{ timestamp, value }` точок, тільки осі і метрика інші.

**Mapping (структура `CampaignChart` props не змінюється):**

| Поточний props/data point | Нове |
|---|---|
| `hourlyPrices: { timestamp, price }[]` | `hourlyCommitted: { timestamp, committedUsd }[]` — кумулятивний committed capital по case-DAO з моменту відкриття funding round-у |
| `currentPrice` (поточне число у правому верхньому куті чарта) | `currentCommitted` — поточна сума committed capital (наприклад: `$840K / $1.2M`, з progress-у %) |
| `colors` (з `PATENT_CATEGORY_COLORS[categoryId]`) | Без змін — той самий gradient |
| Horizontal time-axis | Без змін — час від funding round open до now (з opcional pojuntctured-лінією до funding close date) |
| Vertical price-axis | Замінити на $-axis (committed capital). Опційно: горизонтальна лінія "funding target" як ціль, до якої тягнеться крива |

**Що користувач бачить.** Зростаюча крива committed capital у часі, з міткою current value, з target-лінією зверху і close-date-міткою справа. Кольор-схема — категорії патенту (та сама механіка `PATENT_CATEGORY_COLORS`).

**Альтернативні метрики для подальшого розгляду** (відкрите рішення — див. незакрите питання 6):

- `cumulative funders count` over time — корисно для оцінки моменту/depth попиту.
- Залежно від PRD open research (3): якщо буде secondary liquidity по case-DAO position-токенах — чарт може повернутися до price-чарта.

Наразі за замовчуванням — `cumulative committed capital`.

#### 5.2 Правий блок: `CampaignSwapper` → **Commit Widget (buy-token-for-stable framing)**

**Поточна роль.** Swap-форма: купити/продати license-токен за USDC/інший numeraire (двосторонній swap, `Buy` / `Sell` режими).

**Нова роль.** **Commit-форма у форматі "купити case-DAO position-токен за stablecoin".** Концептуально це те саме що покупка license-токена за стейбл — funder обмінює стейбл на case-DAO position-токен, який в момент settlement дає право на частку recovery згідно LFA. UX-обгортка свопера лишається тією самою.

**Mapping полів (1-в-1 під поточний swapper UI):**

| Поточний slot у `CampaignSwapper` | Нове |
|---|---|
| `Buy` input — license-токен | **Position-токен case-DAO** (отримуваний side). Скільки position-токенів funder отримає за введену суму стейблу |
| `Sell` input — numeraire (USDC/EURC/тощо) | **Stablecoin commit** — скільки EURC / USDC funder вкладає (`(5)` PRD open research уточнить токен) |
| Tokens icons / symbols | З лівого боку — case-DAO position icon (можна використати ту саму іконку, що генерується для license-токена, з кольором категорії); з правого — stablecoin icon (через `getNumeraireLogoUrl`, як зараз) |
| Swap-стрілка `arrowsSwapSvg` | **Залишити в тому ж місці і з тою ж семантикою бідіректційності в момент secondary-liquidity** (PRD open research (3) припускає можливість виходу funder-а). Якщо secondary не активний — стрілка лишається візуально, але клік по ній не міняє directions (або деактивується станом "Secondary market not yet enabled" — той же UX, що "swap-directionality lock") |
| Wallet balance / "Connect wallet" | Залишити 1-в-1 — той самий UX |
| Permit / approve flow (signTypedData + ERC-20 approve) | Той самий typed-data flow, тільки destination contract — case-DAO escrow / position-mint contract замість AMM router-а. Зовнішньо UX без змін |
| Primary button: `Buy` / `Sell` (label контекстний) | `Commit` (у `Buy`-direction) / `Exit position` (у `Sell`-direction, якщо secondary активний і вибрано) |

**Маленька плашка над кнопкою.** Поверх існуючого свопер-frame, **в межах того ж padding-у і без додаткових візуальних елементів**, додати 2-3-рядкову LFA-summary: `Lockup: ~14 months`, `Waterfall: 60/30/10 (funders/owner/platform)`, `Exit checkpoints: 2`. З посиланням-якорем `Read full LFA` → `#lfa` (див. 6.2).

**Position-токен tickerSymbol.** Заразом замінює поточний `licenseSymbol`. Формат — щось схоже на `CASE-<short-id>-POS` або просто `<patent>-CASE`. Це впливає на текст в формі (там, де зараз показується `licenseSymbol`).

---

### 6. `PatentTermsDetails` (3-column section) → **Case Details Section**

Поточно секція має layout: лівий 2/3-стовпець з двома scroll-card-ами (Description + Usage Rights), правий 1/3-стовпець з трьома статичними картками. Layout зберігається.

#### 6.1 Лівий-верхній scroll-card: `Description` → **Infringement Case Description**

**Поточна роль.** Повний опис патенту (scroll-card).

**Нова роль.** Повна **infringement-теза кейсу** + патент-summary в кінці.

**Структура (всередині того самого `ScrollContainer`, header стає `Case description`):**

1. **What the patent covers** (1-2 абзаци) — стислий summary патенту (звужений тех-опис, не повний пейтент).
2. **Accused product / service** — що саме порушує (модель, версія, період продажу, ринки).
3. **Theory of infringement** — literal infringement / doctrine of equivalents; на які claim-elements мапиться; чи є залежність від експертної інтерпретації.
4. **Why now** (опційно) — чому кейс підіймається саме зараз (наприклад: defendant нещодавно випустив новий релевантний продукт; патент опинився під загрозою revocation і enforcement має йти швидко).
5. **Materials referenced** — список референсних доків у evidence-чейні (claim chart від Patlytics, technical report від експерта, market data report).

Якорь `#description` лишається працювати (із `See more` в 2.1).

#### 6.2 Лівий-нижній scroll-card: `Usage Rights & Licensing Parameters` → **LFA (Litigation Funding Agreement)**

Це — заміна, явно замовлена користувачем.

**Поточна роль.** Текст ліцензійних умов + Territory / Transferability / Duration.

**Нова роль.** Скрол-card з ключовими **умовами LFA**. Контейнер той самий (`ScrollContainer` з header-ом і scroll-thumb-ом), header: `Litigation Funding Agreement`. Якорь на секції: `#lfa`.

**Вміст (рядок-за-рядком, в тому ж форматі `<bold label>: <value>`, як зараз у Terms.tsx):**

| Поле | Приклад значення | Замінює поточне |
|---|---|---|
| `Funding round opens / closes` | `2026-06-01 → 2026-07-15` | (нове, у формі поточних `Filing Date / Grant Date`) |
| `Funding target` | `$1.2M` (з 24h-cap-ом якщо є) | (нове) |
| `Funder return waterfall` | `60% funders / 30% patent owner / 10% platform (after recovery of costs)` | замінює `usageRightsDefinition`-вільний текст |
| `Recourse type` | `Non-recourse — funders lose principal if case resolves at $0` | замінює `Transferability` рядок (той самий формат двоколонкового рядка) |
| `Lockup / case horizon` | `~14 months expected; up to 36 months tail` | замінює `License Duration` рядок (тут навіть формат "h-readable duration" з `mapDurationSecondsToHumanReadable` можна перевикористати) |
| `Exit checkpoints` | `Post-DD pre-filing; Post-adverse preliminary ruling` (список) | замінює `Territory Restriction` рядок |
| `Governing law / jurisdiction` | `Luxembourg / Lugano Convention` (приклад до уточнення в open research (1)) | (нове) |
| `Platform fee` | `2% on capital deployed + 5% settlement commission` (PRD §revenue model items 1, 3, 4) | (нове) |

**Що під цими полями (раніше — Description fallback / `whitespace-pre-line` параграф).** Скрол-овий повний текст LFA (legal-grade), або посилання-кнопка `Download full LFA (PDF)` якщо повний текст не показуємо інлайн.

**Прапорці.** Якщо case-DAO ще не у funding-стані — `hideUsageRightsSection` (поточний прапорець у `PatentTermsDetails`) перевикористовуємо для приховання LFA-секції (бо умови ще не зафіксовані).

#### 6.3 Правий стовпець: 3 статичні картки → **Case Facts Stack**

**Поточна роль.** 3 картки з patent-метаданими: (Patent #, Jurisdiction, Registration Authority); (Inventor, Classification); (Filing, Grant, NFT mint).

**Нова роль.** 3 картки з case-фактами. Структура (3 картки, по 2-3 рядки `label / value` у кожній) — без змін.

**Mapping:**

| Поточна картка | Поточні поля | Нова картка | Нові поля |
|---|---|---|---|
| Картка 1 | Patent Number, Jurisdiction, Registration Authority | **Patent reference** | Patent Number, Jurisdiction(s), Registration Authority (1-в-1, бо ці дані patentu залишаються релевантними funder-у). Додати: `Patent NFT token ID` (переїжджає сюди з 2.2) |
| Картка 2 | Inventor Names, Patent Classification | **Defendant** | Defendant legal name, Defendant jurisdiction of seat, Defendant industry / classification. (Inventor Names + Patent Classification повністю видаляються з цієї сторінки — для funder-а це не first-screen інформація; за потреби — окрема глибша вкладка / лінк) |
| Картка 3 | Filing Date, Grant Date, NFT Mint Date | **Case timeline** | `Case registered on platform: <date>` (поточна `NFT Mint Date` — її механіка `formatUnixTimestampSecondsToDateString` залишається), `Patent filing date: <date>` (зберігаємо для контексту давності патенту), `Patent grant date: <date>` (так само). Замість 1 поля (NFT mint) — 1 поле (case registered); решта два — patent dates без змін |

**Лоадинг-стани.** `TermsInfoField` із skeleton-ом залишається 1-в-1.

---

### 7. `DELI_LABS` SVG-футер

**Поточна роль.** Великий SVG-логотип DeLi Labs у кольорі категорії патенту, прив'язаному до `PATENT_CATEGORY_COLORS[categoryId]`.

**Нова роль.** **Без змін.** Категорія патенту → колір лого. Опційно: якщо в кейс-моделі category — це характеристика кейсу (а не лише патенту), мапа залишається тією самою.

---

### 8. Нижній footer-блок (designer + copyright)

**Без змін.**

---

## Що **не** потрапляє на цю сторінку (і чому)

Перелічуємо явно, щоб не дрейфувати в розширення:

- **Forms / intake** — створення кейсу, додавання evidence, KYC funder-а — не цій сторінці.
- **Detailed evidence chain / on-chain provenance log** — окрема глибша вкладка (link зі сторінки можна, але не інлайн).
- **Vote / governance UI** для non-standard рішень case-DAO — окрема секція або сторінка governance.
- **Funder commitment history per address** — окремий profile-tab funder-а.
- **Secondary market / position trading** — поза скоупом v1 (PRD open research (3)).
- **Settlement / payment-rails UI для infringer-а** — окрема сторінка infringer-flow.

---

## Незакриті питання (потрібно вирішити перед імплементацією)

1. **Маршрут.** Зберігаємо URL `/patent/[id]` (де `id` — case-DAO id, не tokenId NFT-патенту) чи переходимо на `/case/[id]`? Якщо переходимо — як підтримуємо backward-compat з посиланнями на стару сторінку?
2. **Один LFA на кейс vs. кілька tranche-LFA.** Це впливає на те, лишаємо ми dropdown в 2.1 чи прибираємо. (PRD §milestone-gated capital release не дає однозначної відповіді — це open research (4).)
3. **Source of truth для AI DD-snapshot (4.1).** Звідки беремо patent-strength / infringement-read confidence-и: попередньо згенерований снапшот, що оновлюється cron-ом, чи on-demand генерація при відкритті сторінки? Це впливає на loading-стан секції 4.1.
4. **Дані по defendant** (2.1, 2.2, 5.3 картка 2). Чи всі кейси будуть мати defendant-дані до етапу C&D / L1? Якщо ні — потрібен fallback-стан "Defendant identity protected until C&D delivered".
5. **Чи показувати на цій сторінці суто публічні дані**, чи частина DD Snapshot Grid (4) і LFA (6.2) — за paywall-ом / subscription-ом funder-а (PRD §revenue item 2). Якщо за paywall-ом — потрібен gated-стан кожної з цих секцій (skeleton + CTA `Subscribe to view`).
6. **Метрика чарта у Funding Progress Chart (5.1).** Базово `cumulative committed capital`. Альтернативи: `cumulative funders count`; `secondary-market position price` (актуально лише якщо PRD open research (3) вирішується на користь secondary-liquidity); комбінований двоосьовий чарт (capital + funders). Вибір — питання продуктового сигналу, який ми хочемо передавати funder-у-newcomer-у.
