# Learning Path — Patent Infringement Enforcement Lifecycle

**Призначення.** Зібраний список ресурсів, щоб повністю зрозуміти шлях розслідування і розгляду справи про порушення патентного права — з фокусом на **класифікацію стадій** і **набір інструментів/інтеграцій**, потрібних на кожній стадії. Це робоча основа для дизайну DeLi-платформи і її milestone-схеми.

**Як читати цей файл.** Спочатку — драфт-таксономія стадій (готова стартова мапа, яку треба критично переглянути). Потім ресурси, згруповані за призначенням. У кінці — рекомендований порядок читання.

---

## 1. Draft stage taxonomy

Це **початкова класифікація**, виведена з матеріалів нижче. Її треба валідувати і уточнювати в процесі — особливо мапінг "що відбувається на кожній стадії" → "які інструменти треба інтегрувати".

### Pre-litigation phase (P)

| Stage | Що відбувається | Типові інтеграції |
|---|---|---|
| **P1. Detection / monitoring** | Виявлення підозрюваного порушення | Patent monitoring tools, competitive intel feeds |
| **P2. Patent strength analysis** | Огляд prosecution history, prior art search, оцінка validity ризиків | Espacenet, EPO Register, PatBase, UPC opt-out registry |
| **P3. Infringement analysis** | Claim charts, element-by-element comparison, doctrine of equivalents | Patlytics / ClaimChart LLM / LitAgility / PatX Studio або ручне чартування |
| **P4. Damages quantification** | Lost profits + reasonable royalty (під IPRED Art. 13 / UPCA Art. 68) | Damages-modeling software, market data, fin-data feeds (Orbis, Bloomberg) |
| **P5. Defendant due diligence** | Корпоративна структура, фінансовий стан, локація активів | D&B Hoovers, Orbis, OpenCorporates, national corporate registries |
| **P6. Strategy decision** | Litigate vs. license vs. drop; вибір forum (UPC / national / none) | Case analytics: Lex Machina (US), Darts-IP (EU/global), JUVE Insights |
| **P7. Cease-and-desist / formal notice** | Warning letter; в ряді юрисдикцій передумова для injunction (IPRED Art. 9) | Document automation, eIDAS-qualified registered mail, certified delivery |
| **P8. Settlement / licensing negotiation (pre-suit)** | Прямі переговори, mediation, term-sheets | NDA / term-sheet templates, контрактні платформи |

### UPC litigation phase (L)

| Stage | Що відбувається | Терміни / тригери |
|---|---|---|
| **L1. Statement of Claim filing** | Електронна подача через UPC CMS + сплата court fee | Початкова дія claimant |
| **L2. Service of process** | Service defendant'у згідно UPC Rules | Через UPC або national authority |
| **L3. Preliminary Objections** | Defendant: jurisdiction / competence / language | 1 місяць від service |
| **L4. Statement of Defence** | Defendant; може включати Counterclaim for Revocation | 3 місяці від service |
| **L5. Reply / rejoinder cycle** | Claimant Reply → Defendant Rejoinder; якщо є counterclaim — додаткові round-trip-и | 1-2 місяці на кожен step |
| **L6. Closure of written procedure** | Judge-rapporteur закриває письмовий етап | Після всіх submissions |
| **L7. Interim procedure / case management** | Interim conference, court explores settlement | ~3 місяці |
| **L8. Oral procedure / hearing** | Усне слухання (зазвичай 1 день) + допит свідків / експертів | Дата визначається судом |
| **L9. First-instance decision** | Рішення | Ціль: ~6 тижнів після oral hearing |
| **L10. Provisional measures (PI track)** | Preliminary injunction — паралельний прискорений трек | Можливо до або під час L1-L9 |

### Post-decision phase (A)

| Stage | Що відбувається | Терміни / інтеграції |
|---|---|---|
| **A1. Appeal — Court of Appeal Luxembourg** | Апеляція першоінстанційного рішення | 2 місяці від публікації рішення; нові докази загалом блокуються |
| **A2. Damages assessment (окреме провадження)** | Кількісне визначення збитків якщо separated із базового рішення | Може займати додаткові місяці |
| **A3. Enforcement of judgment** | Виконання injunction, стягнення damages award; крос-бордер enforcement (Brussels I bis) | Enforcement agents, asset tracing |
| **A4. Settlement execution** | Може відбутись на будь-якій стадії, у тому числі після decision | Payment rails (stablecoin / fiat), escrow, on-chain розрахунок |

---

## 2. Resources by layer

### Layer 1 — Foundational reads (повна картина lifecycle)

Це обов'язковий мінімум. Після цього шару у тебе має бути робоча мапа всього флоу.

1. **UPC Consolidated Rules of Procedure (canonical, EN)** — 250+ сторінок, але це **єдиний** першоджерельний документ. Тримай як reference.
   https://www.unifiedpatentcourt.org/sites/default/files/upc_documents/Consolidated%20Rules%20of%20Procedure%20UPC_EN.pdf

2. **Bird & Bird — A Guide to Conducting an Action Before the UPC.** Структурований practitioner guide.
   https://www.twobirds.com/en/insights/2016/uk/a-guide-to-conducting-an-action-before-the-unified-patent-court

3. **Pinsent Masons — Everything you need to know about the UPC.** Огляд процедури і термінів.
   https://www.pinsentmasons.com/out-law/guides/everything-you-need-to-know-about-the-unified-patent-court

4. **HEUKING — Procedure and deadlines of a UPC infringement procedure.** Детальний timeline по стадіях.
   https://www.heuking.de/en/expertise/patent-law/unitary-patent/procedure-and-deadlines-of-a-upc-infringement-procedure.html

5. **Paustian & Partner — Time-dependent course of infringement proceedings before the UPC of first instance.** Timeline-візуалізація.
   https://paustian.de/en/time-dependent-course-of-infringement-proceedings-before-the-upc-of-first-instance

6. **Kromann Reumert — How does a case proceed through the UPC system?**
   https://kromannreumert.com/en/knowledge/articles/how-does-a-case-proceed-through-the-upc-system

7. **McDermott — Unified Patent Court Procedural Timeline.**
   https://www.mcdermottlaw.com/insights/unified-patent-court-procedural-timeline/

8. **De Clercq & Partners — Timeline of Infringement and Revocation Actions Before the UPC.** Чітка візуальна timeline-схема.
   https://www.dcp-ip.com/en/press-news-insights/timeline-of-infringement-and-revocation-actions-before-the-unified-patent-court

### Layer 2 — Pre-litigation deep-dive

Найважливіший шар для дизайну DeLi, бо тут концентрується DD-work, що його платформа має дешевшати.

9. **Wolf Greenfield — What To Do if You Think Someone is Infringing Your Patent.** Безкоштовний 5-крокий pre-suit процес: study patent + prosecution history → assess infringement strength → assess defenses (validity) → estimate damages → gather infringer intelligence. **Найкращий cleaн starting point замість gated Practical Law toolkit.**
   https://wolfgreenfield.com/resources/what-to-do-if-you-think-someone-is-infringing-your-patent

10. **HLK — Proceedings at the UPC: How to prepare and what to expect.** **UPC-специфічна** pre-litigation guidance: моніторинг early warning signs (паралельні справи в інших юрисдикціях, opt-out status), no pre-suit notice requirement в UPC, front-loaded nature процедури. Точно під твій кейс.
    https://www.hlk-ip.com/news-and-insights/upc-unpacked-how-to-prepare-and-what-to-expect/

11. **The Plus IP Firm — Reasonable Investigation Under Rule 11 for a Patent Infringement Lawsuit.** Мінімальний procedural floor для pre-suit investigation: claim construction + sample of accused product + claim charts. US-focused (Rule 11), але встановлює universal baseline.
    https://plusfirm.com/what-is-a-reasonable-investigation-under-rule-11-for-a-patent-infringement-lawsuit/

12. **Finnegan — Reasonable Prefiling Investigation and the Test for Rule 11.** Детальний розбір що **обов'язково** vs що **не обов'язково** у pre-suit investigation (Federal Circuit case law). Корисно щоб не over-engineer DD requirements.
    https://www.finnegan.com/en/insights/articles/reasonable-prefiling-investigation-and-the-test-for-rule-11-the.html

11. **Allen, Dyer, Doppelt + Gilchrist — The Patent Infringement Lawsuit Process from Discovery to Filing Suit.** US-flavored, але детальний flow.
    https://allendyer.com/the-patent-infringement-lawsuit-process-from-discovery-to-filing-suit/

12. <span style="color:green">[Прочитано]</span> **Litigation Funding Blog — The Art and Science of Diligence in Funded Patent Litigation: A Guide.** Як funders проводять DD; критично для розуміння, що саме треба автоматизувати.
    https://www.litigationfundingblog.com/post/the-art-and-science-of-diligence-in-funded-patent-litigation-a-guide

    1) в цій статті дуже великий список пунктів які вимагає детальне diligence, треба проаналізувати які з них можна автоматизувати завдяки пошуку у відкритих джерелах, які завдяки AI, а які не можна автоматизувати взагалі і треба робити human-in-the-loop з експертами

13. **Burford Capital — Adding value beyond capital: During case review.** DD-процес зсередини найбільшого комерційного litigation funder-а.
    https://www.burfordcapital.com/insights-news-events/insights-research/adding-value-beyond-capital-during-case-review/

### Layer 3 — Litigation finance perspective (як думають funders)

Ключовий шар для розуміння, чим саме DeLi конкурує і де вікно. **Старт тут:** пункт 14 (PDF) або 15 (Woodsford PDF).

14. <span style="color:green">[Прочитано]</span> **Burford Capital — Introduction to Legal Finance (PDF, 2024).** Повноцінний intro-guide (~30 стор.): продукти (fees & expenses, monetization, portfolio), funding process, FAQ, case studies. **Краще за "Playbook" blog-сторінку.** https://www.burfordcapital.com/media/g12gxb0a/intro-to-legal-finance_2024.pdf
  Висновки: 
  1) litigation finance не тільки для покриття витрат на судову справу, а і для
  прискорення монетизації будь яких фінансових результатів легальних процесів ("Accelerate capital tied to pending commercial claims, judgments and awards")
  2) пред'явник претензії може прийти на платформу з вже активним кейсом (в середині життєвого циклу)
  3) платформа може діяти не тільки як маркетплейс і агрегатор а і сама надавати litigation finance послуги
  4) судяячи з усього є ще 4 стейкхолдер - reviewer, який надає асессмент кейсу і залученість якого напряму впливає на бажання фандера вкладати гроші в кейс. так у великих litigation finance фірмах це внутрішні відділи аналітиків. треба щоб ще до появи кейса на платформі вже був присутній певний аудит цього кейсу

15. <span style="color:green">[Прочитано]</span> **Woodsford — A Practical Guide to Litigation Funding (PDF).** Найповніший practitioner guide: 6 критеріїв funder-а, underwriting funnel (100% → 3.5% funded), розбір LFA по секціях (definitions, waterfall, termination).
    https://woodsford.com/wp-content/uploads/2022/09/A-Practical-Guide-Litigation-Funding.pdf
    Висновки:
      1) DD часто буває просто опитувальником
      2) є невирішене питання як прозора платформа буде менеджити NDAs і інші речі комерційної таємниці

16. **Burford Capital — Introduction to Legal Finance (web).** Той самий контент, що PDF, плюс лінки на diligence / case review / ethics (champerty, disclosure).
    https://www.burfordcapital.com/introduction-to-legal-finance/

19. **Burford Capital — The Legal Finance Playbook (blog summary).** Короткий summary вебкасту; не заміна PDF (п. 14).
    https://www.burfordcapital.com/insights-news-events/insights-research/legal-finance-playbook/

20. **LexShares — Litigation Finance Guide (PDF).** Compact intro: non-recourse, funding process, product types.
    https://d82jt2cluomp.cloudfront.net/docs/litigation-finance-guide.pdf

21. **Westfleet Insider — 2024 Litigation Finance Market Report.** Ринкові цифри (32% patent share, тощо).
    https://www.westfleetadvisors.com/wp-content/uploads/2025/03/WestfleetInsider-2024-Litigation-Finance-Report.pdf

22. **GAO-25-107214 — Information on Third-Party Funding of Patent Litigation.** US federal-level огляд (включає LFA structure, fund returns).
    https://www.gao.gov/assets/gao-25-107214.pdf

23. **Validity Finance — How Litigation Funders Pick Cases for Investment.**
    https://www.validityfinance.com/news/thought-leadership/2020-08-27-how-funders-pick-cases

24. **Chambers Expert Focus — Patent Case Funding and Challenges in the US.**
    https://chambers.com/legal-trends/getting-us-patent-cases-funded

25. **UK Legal Services Board — A review of litigation funding.** Реджектація 95-97% кейсів.
    https://legalservicesboard.org.uk/research/a-review-of-litigation-funding

### Layer 4 — DAO / collective funding precedents (DeLi-специфіка)

26. **bio.xyz / BioDAO concept docs.** Architectural reference для DeLi.
    https://docs.bio.xyz/bio/introduction/concepts/biodaos

27. **bio.xyz — Deal flow process.**
    https://docs.bio.xyz/bio/introduction/biodaos/deal-flow-process

28. **BioDAO Litepaper.**
    https://biodaoxyz.gitbook.io/litepaper

29. **Liti Capital SA — LITI tokens (Swiss tokenized litigation equity).**
    https://liticapital.com/liti-tokens/

30. **Ryval / Roche Freedman — proposed ILO marketplace.**
    https://www.abajournal.com/web/article/why-a-new-york-law-firm-wants-to-create-a-stock-market-for-litigation-finance

31. **Apothio ILO on Republic / Avalanche.**
    https://www.crowdfundinsider.com/2021/10/182290-republic-lists-first-initial-litigation-offering-for-apothio-case/

32. **LexShares (platform).**
    https://www.lexshares.com/pages/investors

### Layer 5 — Tooling landscape (інтеграційні кандидати)

Це **готові категорії інструментів**, які платформа може або інтегрувати, або замінити, або white-label-нути всередині case-DAO operations frontend.

#### Patent search and analysis

- **EPO Espacenet** — безкоштовний патент-search engine ЄПВ. https://worldwide.espacenet.com/
- **Google Patents** — швидкий search. https://patents.google.com/
- **PatBase / Derwent Innovation / Questel Orbit** — комерційні платні.
- **EPO Register / EPO Patent Knowledge / European Publication Server** — для prosecution history.
- **UPC opt-out registry** — щоб перевірити, чи патент під юрисдикцією UPC.

#### Claim charting / infringement analysis

- **Patlytics** — AI claim charts з evidence citations. https://www.patlytics.ai/infringement-detection
- **ClaimChart LLM (XLSCOUT)** — LLM-based, --75% часу від ручного методу. https://xlscout.ai/claimchart-llm-ai-patent-infringement-analysis/
- **LitAgility BridgeIP / BridgeIndex** — evidence management + AI-assisted charting. https://litagility.com/bridgeip/
- **PatX Studio** — AI claim charts з element-by-element citations. https://patx.ai/

#### Case analytics

- **Lex Machina** — US patent litigation analytics.
- **Darts-IP** — global IP case database.
- **JUVE Patent / JUVE Insights** — EU patent news + analytics.
- **Osborne Clarke UPC tracker.** https://upc.osborneclarke.com/upc-basics
- **D Young & Co UPC stats.** https://www.dyoung.com/en/knowledgebank/

#### Corporate / financial intelligence (defendant DD)

- **Bureau van Dijk / Orbis** — корпоративні структури і фінанси по всьому світу.
- **D&B Hoovers** — business profiling.
- **OpenCorporates** — публічний реєстр компаній.
- **National corporate registries** (German Handelsregister, French Infogreffe, тощо).

#### Document delivery and evidence chain

- **eIDAS qualified trust service providers** — список ЄК: https://webgate.ec.europa.eu/tl-browser/
- **Qualified registered electronic delivery (QeRDS)** — для C&D і notices.
- **Process servers** — Sherrife (UK), Bailiff Express (EU), національні bailiff-сервіси.
- **Translation services** — Lionbridge, RWS Group (legal-grade), Linguee (швидке reference).
- **E-discovery / evidence management** — Relativity, DISCO, Logikcull, Everlaw.

#### UPC integration

- **UPC Public APIs (v2.3)** — case + decision search, без авторизації.
  https://www.unifiedpatentcourt.org/sites/default/files/upc_documents/public_apis_instructions_v2.3.pdf
  Endpoint: `https://netservice-prod.apigee.net/upc/public/api/v4`
- **UPC CMS Portal** — електронна подача (для зареєстрованих representatives).

#### Payments / settlement rails

- **Fireblocks / Anchorage / Sygnum** — інституційне stablecoin custody.
- **Circle (EURC, USDC)** — MiCA-compliant stablecoin issuance.
- **Wise / Banking Circle** — fiat корпоративні переказі (як baseline для comparison).

### Layer 6 — Legal frameworks (must-know)

33. **IPRED — Directive 2004/48/EC on the enforcement of IP rights.** Особливо Art. 9 (provisional measures), Art. 13 (damages), Art. 14 (legal costs).
    https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004L0048

34. **UPCA — Unified Patent Court Agreement.** Art. 68 (damages), Art. 69 (costs), Art. 70 (interim measures).
    https://www.unified-patent-court.org/en/court/legal-documents

35. **Brussels I bis — Regulation 1215/2012.** Для крос-бордер enforcement рішень.
    https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32012R1215

---

## 3. Recommended reading order

Якщо є 4 робочі тижні на формування workable mental model:

### Week 1 — Lifecycle overview (Layer 1)

Ціль: вийти з тижня з чіткою мапою стадій від detection до enforcement.

- День 1-2: Bird & Bird Guide + Pinsent Masons (загальна структура).
- День 3: HEUKING + Paustian (timeline-фокус).
- День 4-5: Kromann Reumert + McDermott + De Clercq (cross-check; різні кути).

**Результат:** оновлена version draft-таксономії з розділу 1 цього файлу.

### Week 2 — Pre-litigation deep-dive (Layer 2)

Ціль: розуміти, що саме відбувається в P1-P8, і що з цього можна автоматизувати.

- День 1: Practical Law Pre-Suit Toolkit + Aaron Hall checklist.
- День 2-3: Litigation Funding Blog "Art and Science of Diligence" (це фундаментальне; перечитати двічі).
- День 4: Burford "Adding value beyond capital" + порівняти з тим, що в DeLi planується автоматизувати.
- День 5: пройти UPC opt-out registry і EPO Espacenet самостійно на реальному прикладі.

**Результат:** drafting "what platform must capture vs. what it links out to" на pre-litigation стадії.

### Week 3 — UPC procedural mechanics (canonical)

Ціль: занурення в Rules of Procedure там, де це безпосередньо стосується platform mechanics.

- День 1-2: UPC Consolidated Rules — особливо Parts 1 (general), 2 (procedure of first-instance), 3 (procedure of CoA), 5 (rules on evidence).
- День 3: Court fee schedule + рішення про opt-out / opt-in динаміку.
- День 4-5: реальні UPC рішення (відбери 2-3 опубліковані cases з 2024-2025 і пройди flow).

**Результат:** валідовані milestones (L1-L10) з прив'язкою до конкретних правил.

### Week 4 — Funder perspective + tooling

Ціль: розуміти "що хоче бачити funder в DD пакеті" і "які інструменти існують для кожної стадії".

- День 1: Burford Intro to Legal Finance PDF (п. 14) + Woodsford Practical Guide PDF (п. 15).
- День 1 (вечір): Westfleet 2024 Report (п. 19).
- День 2: GAO-25-107214 (по economic structure of funded matters).
- День 3-4: tooling demos — мінімум один claim-charting tool (Patlytics або PatX), один patent search engine (PatBase trial), один corporate intel (Orbis або D&B).
- День 5: bio.xyz docs + порівняння з DeLi case-DAO моделлю — wgz фактично відповідає.

**Результат:** прив'язка кожної стадії таксономії до конкретного набору existing tools, що з них можна або (а) інтегрувати, (б) реплікувати, (в) замінити власним workflow.

---

## 4. Open questions to track during reading

Це питання, які поки відкриті — частина з них уже занесена в PRD як open research areas. Тримай у голові під час читання:

- **Champerty / TPF allowance map по UPC member states** — на якому етапі читання це стає reverable з open sources?
- **eIDAS-compliant notice mechanics** — як саме виглядає production-grade good-faith response receipt? (P7 + L2)
- **Multilingual evidence handling** — як ефективно нормалізувати DE / EN / FR / IT / NL?
- **Що ровно входить в "case-DAO treasury operations"** з точки зору регулятора в обраній юрисдикції платформи?

---

## 5. Maintenance notes

- Цей файл — **living document.** Після кожного тижня читання повертайся і вноси: (а) уточнення в таксономію стадій (розділ 1), (б) нові ресурси, які знайшов, (в) tools що оцінив самостійно.
- Якщо знаходиш ресурс, який заслуговує бути в Layer 1 (foundational) — переноси з нижчих шарів. Layer 1 має тримати ≤10 джерел; інакше стає overwhelming.
- Усі URL живі станом на 2026-05. Якщо щось померло — додай Wayback Machine snapshot.
