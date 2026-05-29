# Product Requirements Document - DeLi Project

**Author:** Ivan
**Date:** 2026-05-16

> **Conventions.** `[N]` — citation to a source listed in *References* at the end of the document. `(N)` — pointer to a numbered item in *Open Research Areas*; indicates the surrounding statement depends on or is awaiting that research.

## Executive Summary

DeLi is a platform that orchestrates the interactions between the three parties involved in a patent enforcement case: the **patent owner**, the **funder**, and the **infringer**. Each party engages the same case through the platform, with workflows tailored to what they need to decide, fund, or resolve.

The platform's purpose is to make patent enforcement workable for cases that the existing market does not serve — small and mid-size patent holders whose cases never reach a traditional funder — while giving funders a cheaper way to underwrite and giving infringers a faster way to settle.

The first version focuses on the **Unified Patent Court (UPC)**, because it is the easiest jurisdiction to integrate against.

## Stakeholders and Benefits

### Patent Owner

When a patent owner has a real infringement case, the main blocker is money to pursue it. On DeLi, the owner gets access to **staged collective financing** for their case, with funds **unlocked at key milestones** as the case progresses.

This is built for patent owners who **cannot get funded through traditional litigation finance**. Traditional funders spend **$50K–$500K on due diligence** for each case they evaluate [1], and to cover that cost across their portfolio they can only fund cases with **expected profit above ~$2M** [2][3]. In practice they fund only **3–5% of the cases they review** [4][5][6]. Everything below that threshold structurally never gets funded today [7][8]. DeLi is aimed squarely at that segment.

### Funder

Funders get a platform that **aggregates structured case information** in a way that **reduces the cost of due diligence** for each case they evaluate [9]. Patent cases are already the **single largest segment of new commercial litigation finance commitments** (≈32% in 2024), so even small reductions in per-deal underwriting cost compound meaningfully [10]. On top of that, the platform enables **group litigation funding** — a mechanism that lets ordinary investors participate collectively in funding a case, rather than restricting litigation finance to a small number of professional funds [11][12][13][14].

### Infringer

The infringer gets three things from the platform:

- A clear **path to resolve the dispute with the patent owner** through a structured settlement / voluntary-licensing flow rather than waiting to be sued.
- A way to **transfer settlement funds with a lower commission via blockchain rails**, particularly for cross-border payments.
- A verifiable **good-faith response receipt** — a timestamped, independently auditable record that the infringer engaged with the patent owner through the platform in a timely manner. This record can be used in court as mitigation evidence (e.g. under IPRED Art. 13(2) on innocent-infringement damages limitation and UPCA Art. 69 on favorable cost allocation for good-faith defendants), and meaningfully changes the infringer's downside if the case still proceeds.

## Initial Scope

The product is **focused first on UPC** because it is the easiest jurisdiction to integrate with in terms of data access and procedural structure: UPC publishes **public APIs over its Case Management System without authentication** [15][16], and case volume is growing fast — **883 cases by May 2025**, with infringement filings **+31.8% YoY** in year two and **+54% YoY** into 2025 [17][18][19]. Other jurisdictions are out of scope for v1.

## Product Structure

DeLi's product architecture is modeled on the **bio.xyz / BioDAO pattern** [20]: rather than a single monolithic fund or matchmaking marketplace, **each infringement case is its own on-chain entity** with its own treasury, its own funder set, and its own dedicated legal wrapper. The platform sits above these per-case entities and provides a uniform interface to operate them.

### Per-case DAO

For every accepted infringement case the platform spins up a dedicated **case-DAO**:

- A separate on-chain treasury that holds the funders' capital committed to this case.
- A separate **legal wrapper** around the on-chain entity — SPV, segregated portfolio cell, foundation, association, or hybrid (1)(3).
- Funder commitments are bound to **this case's economics only**; there is no cross-case exposure inside the same vehicle.

### Patent owner entry points

A patent owner does not have to come to the platform at a single fixed moment. There are three distinct lifecycle entry points, and each defines a **different risk / return profile for funders** in that case-DAO and a **different set of integrated tools** the platform must provide (11):

1. **Pre-litigation entry (P).** The owner suspects or has partially detected infringement but has not filed at UPC yet. They register the case, contribute the evidence they already have, and use platform-integrated tools to complete the diligence — patent strength analysis, infringement claim charts, defendant due diligence, damages modeling, formal notice / cease-and-desist delivery, and pre-suit settlement / licensing negotiations. **Highest uncertainty for funders** (validity, infringement read, defendant solvency, willingness to settle are all unknown), **lowest entry cost**, and the longest potential horizon.

2. **Active-litigation entry (L).** A UPC infringement action is already filed and underway; the owner needs capital to continue prosecution (counsel fees, expert engagement, response submissions, oral hearing preparation). **Medium uncertainty for funders** — the case has cleared filing, court has accepted jurisdiction, defendant's responses give a clearer view of merits — but funders inherit a case structure they did not shape, and the case may already be partway through its timeline.

3. **Post-judgment entry (A).** A favorable first-instance judgment has been rendered and the owner needs capital to **collect on it** — enforcement, asset tracing, cross-border recognition under Brussels I bis, defending against appeal. **Lowest uncertainty for funders** (merits already adjudicated, damages already quantified), **highest expected ROI relative to capital deployed at this stage**, but constrained by defendant's actual recoverability — which itself becomes the primary risk axis.

Each entry point requires the platform to expose a **different set of integrated tools** to the case-DAO. Pre-litigation entry needs detection / evidence-gathering / notice tooling. Active-litigation entry needs procedural document support and UPC-CMS integration. Post-judgment entry needs enforcement, asset-tracing, and cross-border collection rails.

### Unified AI-assisted case dashboard

**Regardless of entry point**, every accepted case is surfaced to prospective funders through a **single unified information panel** generated by the platform. This panel is what a funder sees **before committing capital** to a case-DAO and is the structured artifact behind the subscription revenue stream (9).

Inputs:

- **Owner-authorized data** — claim charts, infringement evidence, prior correspondence, internal damages estimates, and any other case material the patent owner explicitly releases for funder-facing display (3).
- **Public data sources** ingested by the platform — patent register and prosecution history (EPO Register, Espacenet), UPC opt-out status, parallel proceedings in other jurisdictions, defendant corporate filings, prior UPC and national case-law involving the same patent family or defendant.

These inputs are processed through a **patent-case-tuned AI model** that synthesizes a structured summary across the funder's standard evaluation axes — patent strength signals, infringement-read confidence, damages range estimate, defendant recoverability, procedural risk flags, timeline projection — with explicit per-axis confidence indicators.

**The dashboard does not replace the funder's own due diligence.** Funder DD remains the funder's responsibility. What the dashboard does is give the funder **structured material to start from** and **shorten the back-and-forth with the patent owner**, because the obvious questions are pre-answered before any direct communication begins.

### Milestone-gated capital release

The case-DAO holds funder commitments and releases capital to the **patent owner** (and to operational vendors, see below) only as predefined milestones are reached (4). The default mode is automatic, milestone-driven release without per-tranche votes; **non-standard decisions** — for example, accepting a settlement below a threshold, switching counsel mid-case, materially changing case strategy — escalate to **on-DAO governance** by the funders of that specific case.

### Standardized operations frontend

The platform's frontend is the **single uniform interface** for every operation a case-DAO needs to perform during the lifecycle of an enforcement action:

- Issuing standard-form **notices** (infringement notice, response receipt, settlement offer, license offer).
- Engaging **expert vendors** (technical experts, validity counsel, damages experts, process servers, translators).
- Assembling **filing-ready documents** for UPC submissions.
- Receiving and disbursing **on-chain payments** for legal fees, expert fees, court fees, and settlement transfers.

Every operation above is **paid from the case-DAO's treasury**, not from the patent owner's personal funds. The frontend is the standardization layer; the case-DAO is the funding and accounting layer.

### Confidentiality layer (ZK)

Patent enforcement defaults to confidentiality — settlement amounts are NDA-covered, an infringer should not be publicly tagged as such before any court finding, and license terms are commercial secrets. A naive on-chain implementation would publish all of that on a public ledger, which is both commercially unacceptable and a GDPR problem (8). The platform combines **ZK confidential transfers** with an **off-chain confidential layer** to make on-chain operations compatible with that default:

- **Settlement and license payments** move as ZK-confidential transfers (Aztec / Railgun-style confidential stablecoin transfers). The public ledger sees only a commitment that the transfer happened; the amount and the counterparties are not visible.
- **Infringer and licensee identity** is held off-chain under the platform's KYC layer (2). On-chain artifacts are commitments and hashes, not raw identifiers — engaging with the platform does not by itself create a public "suspected infringer" record.
- **Funder identity** is KYC'd off-chain and **pseudonymous on-chain by default**. Properties that need to be provable to a counterparty or the case-DAO (e.g. accredited-investor status, jurisdiction of incorporation) are exposed via **selective disclosure** without revealing the underlying credential.
- **Case substance** (claim charts, evidence, damages models, owner-funder correspondence) stays **off-chain in confidential storage**; only **hashes anchored on-chain** for tamper-evidence and **operational metadata** (filings, milestones, payments) sit on the ledger.
- The **good-faith response receipt** issued to an infringer (see Infringer section) is constructed on this layer: independently verifiable as a timestamped record of timely engagement, while the substance of the response stays private to the parties.

Workflows that go beyond what ZK alone can express — sealed-bid settlement pricing, encrypted DAO voting on non-standard decisions, cross-case aggregate analytics on settlement data — are **out of scope for v1** and flagged as a possible FHE extension in (8).

### Funder exit checkpoints

The case lifecycle includes designated points at which individual funders can **exit their position and crystallize a loss** if the case turns out unprofitable — for example, after the due diligence stage but before a complaint is filed at UPC, or after an unfavorable preliminary ruling (4). The architectural principle: a funder should be able to **stop the bleed at known checkpoints** rather than be locked in for the full case duration.

### Why per-case rather than a shared treasury

A single shared treasury that funds many cases out of one pool was considered and rejected. Four reasons:

1. **Case duration.** A UPC infringement action targets ~12 months at first instance [21], and the end-to-end horizon extends materially beyond that once pre-filing work (DD, notices, evidence assembly) and any Court of Appeal stage are included. A funder commitment is therefore locked up for **years** per case. Per-case accounting is the only honest way to track P&L, risk, and ownership over that horizon without commingling capital across cases that are at completely different stages of their lifecycle.

2. **Separation of concerns.** Each case has its own funder set, its own counsel, its own evidence chain, and its own settlement / confidentiality regime. A shared treasury creates legal and operational cross-contamination — a problem with case A (an adverse ruling, a counsel dispute, a regulatory complaint, a confidentiality breach) can taint the capital and governance of case B. Per-case wrappers **contain each case's risk inside its own legal and on-chain boundary.**

3. **Wide spread in per-case investment sizes.** Cases vary by more than an order of magnitude in funding needs — from low six-figure budgets for fast settlement tracks to mid-seven-figure budgets for contested cases with experts, multiple national divisions, and appeals. A shared treasury forces allocation politics across cases competing for the same pool; per-case DAOs let each case raise **exactly what it needs**, from funders who selected *that* case on its own merits and at its own price.

4. **Balance between flexibility and standard flow.** Standardization belongs at the **platform layer** (the same UI, the same milestone schema, the same vendor integrations across all cases). Flexibility belongs at the **case-DAO layer** (each case's funders vote on case-specific non-standard decisions). A shared treasury collapses these two layers into one and forces either over-rigid policy (no case-level flexibility) or constant case-by-case governance overhead at the pool level. The two-layer split keeps 80% of the workflow standardized while preserving the 20% of decisions that genuinely belong to each case's own funders.

## Revenue Model

### 1. Founder's share in each case-DAO

The platform takes a **founder's share** in every case-DAO it spins up. This share is set at case-DAO formation, sits on the platform's balance sheet for the life of the case, and pays out alongside the funders' positions if and when the case resolves profitably. This aligns the platform's incentives with case outcomes: **the platform earns when funders earn.**

### 2. Subscription access to structured case data

Funders pay a **subscription** for access to structured, standardized case data on the platform before deciding whether to join the corresponding case-DAO. This monetizes the diligence-cost reduction that DeLi provides to funders **independently of whether they ultimately fund a given case** — i.e. the platform captures value even from cases the funder evaluates and skips (9).

### 3. Markup on external integrations

Every external service used inside a case-DAO through the platform — notice delivery, expert engagement, document filing, translation, process serving, payment rails — runs through the platform's integrations. The platform applies a **markup** on the underlying vendor invoice (illustrative: vendor charges $200, the case-DAO is invoiced $205). The case-DAO pays the marked-up price from its treasury; the spread is platform revenue.

This stream scales with **case activity** rather than case outcome, and is independent of whether a case ultimately wins, settles, or fails.

### 4. Settlement commission on infringer transfers

When an infringer settles a case through the platform, the platform takes a **commission on the stablecoin transfer** from infringer to patent owner (and to the case-DAO funders per the LFA) (10).

## Open Research Areas

These are the things that must be answered before the platform can be designed in detail.

(1): **Platform legal entity, wrapper form, and jurisdictional mapping.** Where the platform itself is incorporated; the exact legal wrapper around each case-DAO (SPV, segregated portfolio cell, foundation, association, or hybrid); which regulatory regimes apply (MiCA, MiFID II, AIFMD, ECSPR, AML directives, eIDAS, GDPR); and which UPC participating states allow third-party litigation funding without restriction versus apply champerty / maintenance constraints. Upstream of almost every other architectural choice below.

(2): **KYC / KYB.** What model of identity and entity verification will be compliant for all parties we onboard (patent owners, funders, retail group investors, infringers), under the jurisdictions chosen in (1).

(3): **Funder-side participation model and legal structure for group litigation funding.** Full design needed for: whether group funding is **retail crowdfunding** (ECSPR-style, broad investor base, small tickets), **pooled professional money** (private placement / AIFMD, accredited investors only), or a hybrid; which investor jurisdictions are accepted; what investors actually hold (SPV token-share, debt instrument, direct LFA participation, fund stake); whether **secondary liquidity** is allowed (token resale, fund redemption) and under which licensing. This item also covers the **trust and verification layer** that makes group funding legally workable — how case data is attested, who attests it, what is published on-chain versus kept off-chain under GDPR, how settlement confidentiality is preserved, and how infringer identity is established — because those decisions must satisfy the same legal regime as the funding instrument itself.

(4): **Platform mechanics — case lifecycle, milestones, due diligence workflow, and funder exit checkpoints.** The full mechanic of how a case moves through the platform from intake to resolution needs to be designed from scratch. This includes the milestone schema, who attests milestone completion, how each milestone unlocks a funding tranche, what happens on case stall or early settlement, how due diligence is actually performed on the platform, and **at which lifecycle points a funder may exit and crystallize a loss** (e.g. post-DD pre-filing, post-adverse preliminary ruling) — including the price mechanism on exit and whether exiting positions are reabsorbed, resold, or forfeited. The DD workflow alone is a large, separately scoped piece of work and is intentionally left abstract here.

(5): **Money flow, custody, and cross-border settlement rails.** Choice of stablecoin (EURC, USDC, EURI), where escrow funds sit during a case (smart-contract custody, regulated custodian, bank escrow with on-chain mirroring), how infringer → patent-owner settlement flows across borders, who carries FX risk, how sanctions screening is performed, and how tax reporting is handled for all three parties.

(6): **Infringer participation — settlement flow and voluntary licensing.** Two sub-areas: (a) a **voluntary / preemptive flow** that lets an infringer initiate settlement, declaratory engagement, or take a license through the platform before being sued, including license-on-demand mechanics; (b) the actual measurable cost reduction the platform delivers over the infringer's existing settlement options (commission, FX, time, certainty of finality).

(7): **UPC integration scope and depth.** How deeply v1 integrates with UPC infrastructure: CMS public APIs only, or also the opt-out registry, EPO Espacenet, and national PTO data; which UPC divisions are in scope first (Local / Regional / Central); and what multi-language normalization (DE/EN/FR/IT/NL) is required for evidence and filings.

(8): **Technical stack.** Blockchain choice (Ethereum L1 vs. L2 family vs. multi-chain), wallet model for non-crypto-native users (smart accounts with social recovery, custodial, MPC-based), on-chain identity and credential model (DID, verifiable credentials, KYC attestations bound to wallets), the on-chain / off-chain split for case data under GDPR, and the **confidentiality stack** — choice of ZK confidential-transfer scheme (Aztec, Railgun, native L2 confidential mode, custom), the selective-disclosure credential framework, and whether to extend to FHE for sealed-bid settlement, encrypted DAO voting, and encrypted cross-case analytics in future iterations.

(9): **Funder data subscription — willingness to pay and pricing.** Whether funders will actually pay a subscription for access to DeLi's structured case data before deciding to enter the corresponding case-DAO, and at what price band. The risk: a meaningful share of funders may extract value from the platform's free signals plus their own counsel and historical relationships without paying for subscription access, in which case this revenue stream collapses. Validation through direct funder interviews is required before committing to this as a primary revenue source.

(10): **Settlement commission pricing band.** The exact commission percentage on infringer → patent-owner stablecoin transfers. The viable band is bounded **above** by what traditional correspondent-banking settlement already costs the infringer (typically 1–2% plus FX spread) and **below** by the marginal cost of the on-chain settlement itself (gas, custodian fees, stablecoin issuance / redemption fees). Pricing must sit comfortably inside that band — otherwise the infringer's cost advantage from using the platform disappears and the rail loses its primary appeal. Requires research into incumbent settlement-routing costs and infringer willingness-to-pay.

(11): **Bootstrapping, v1 entry-point scope, and go-to-market.** Which **patent owner entry point(s)** v1 supports (pre-litigation, active-litigation, post-judgment, or some combination) and in what order subsequent ones are added — each entry point implies a distinct tooling burden and a distinct risk profile for funders, so the choice materially changes scope and target customer. Within that: which side of the marketplace is the v1 customer (funders or patent owners), the supply channel for patent owners (patent attorneys, TTOs / university tech transfer, EUIPO / EPO SME programmes, direct), and what the first pilot case looks like.

## References

### Due diligence cost and funder thresholds

[1]: The **$50K–$500K range** is an industry estimate and is not directly published by funders. It is supported indirectly by (a) the scope of work funders require (technical patent analysis, infringement read, damages model, validity / IPR risk review, outside diligence counsel) and (b) the fact that funders fund only a low single-digit percentage of cases reviewed. See: *The Art and Science of Diligence in Funded Patent Litigation: A Guide*, Litigation Funding Blog, Feb 2025 — https://www.litigationfundingblog.com/post/the-art-and-science-of-diligence-in-funded-patent-litigation-a-guide . **To validate via direct funder interviews.**

[2]: Burford Capital, the largest commercial litigation funder, requires clients to need **at least $5M in funding with at least $50M in enforceable damages**. See: *The legal finance playbook: From basics to benefits*, Burford Capital — https://www.burfordcapital.com/insights-news-events/insights-research/legal-finance-playbook/

[3]: Funders apply a "**10× rule of thumb**" — damages should be roughly ten times the amount funded. See: *Getting US Patent Cases Funded*, Chambers Expert Focus — https://chambers.com/legal-trends/getting-us-patent-cases-funded

[4]: UK Legal Services Board: funders "carefully choose a minority of cases (only **3–5% of potential cases**)." See: *A review of litigation funding in England and Wales* — https://legalservicesboard.org.uk/research/a-review-of-litigation-funding

[5]: *Why 98% of Litigation Funding Opportunities Never Get Funded*, Wild Dog — https://wilddog.mu/why-98-of-litigation-funding-opportunities-never-get-funded/

[6]: Burford disclosed reviewing **more than 1,400 funding inquiries in 2018**, ultimately investing in far fewer. See: *Adding value beyond capital: During case review*, Burford Capital — https://www.burfordcapital.com/insights-news-events/insights-research/adding-value-beyond-capital-during-case-review/

### SME funding gap in Europe

[7]: epi (European Patent Institute): "concern over litigation costs and lack of capacity to enforce patent rights" is one of the main hurdles for SMEs and micro-entities; **no member state offers dedicated public funding** for patent litigation. The EPO is investigating financial support specifically for micro-entities. See: *Financing of Patent Litigation in the Member States*, epi Information, Issue 2/2025 — https://information.patentepi.org/issue-2-2025/financing-of-patent-litigation-in-the-member-states.html

[8]: The only targeted EU public support is the EUIPO **IP Scan Enforcement** service in 9 member states, capped at **€450–€810** (€1,350 in France) — orders of magnitude below patent litigation cost. See: https://www.euipo.europa.eu/en/sme-corner/sme-fund/2025/how-to-apply/ip-scan-enforcement

### Funder market and per-case underwriting

[9]: Diligence scope covered by funders today includes patent claim scope and prosecution history, infringement analysis of accused products, damages potential assessment, and litigation strategy. See: *The Art and Science of Diligence in Funded Patent Litigation*, Litigation Funding Blog — https://www.litigationfundingblog.com/post/the-art-and-science-of-diligence-in-funded-patent-litigation-a-guide

[10]: Westfleet Insider 2024 Litigation Finance Report: **patent litigation = 32% of new commercial commitments** in 2024; single-matter patent deals averaged ~$6.6M, portfolio deals ~$16.5M; total capital commitments fell 16% YoY. See: https://www.westfleetadvisors.com/wp-content/uploads/2025/03/WestfleetInsider-2024-Litigation-Finance-Report.pdf . US-level context on funder economics also available in **GAO-25-107214, *Information on Third-Party Funding of Patent Litigation*** — https://www.gao.gov/assets/gao-25-107214.pdf

### Group / retail litigation funding precedents

[11]: **Liti Capital SA** (Switzerland) — tokenized private equity for litigation finance. LITI tokens represent company shares under Swiss law; wLITI for DEX trading. See: https://liticapital.com/liti-tokens/ and https://liticapital.com/liti-capital-to-issue-new-asset-backed-equity-token/

[12]: **Ryval** (Roche Freedman) — proposed "stock market of litigation financing" hosting Initial Litigation Offerings (ILOs) under SEC Regulation Crowdfunding, up to $5M per 12-month period, open to non-accredited investors. See: *Why a New York law firm wants to create a stock market for litigation finance*, ABA Journal — https://www.abajournal.com/web/article/why-a-new-york-law-firm-wants-to-create-a-stock-market-for-litigation-finance

[13]: **Apothio ILO on Republic / Avalanche** — first publicly listed Initial Litigation Offering, $100 minimum investment, token-based recovery share. See: *Republic Lists First Initial Litigation Offering For Apothio Case*, Crowdfund Insider — https://www.crowdfundinsider.com/2021/10/182290-republic-lists-first-initial-litigation-offering-for-apothio-case/

[14]: **LexShares** — established litigation finance investment platform since 2014 (currently accredited investors only). See: https://www.lexshares.com/pages/investors

### UPC data access and growth

[15]: Official UPC Public APIs instructions (v2.3) — public REST APIs over the Case Management System, no authentication required, base URL `https://netservice-prod.apigee.net/upc/public/api/v4`. See: https://www.unifiedpatentcourt.org/sites/default/files/upc_documents/public_apis_instructions_v2.3.pdf

[16]: *Update on public APIs following launch of first phase of the new CMS roll-out*, Unified Patent Court news — https://www.unified-patent-court.org/en/news/update-public-apis-following-launch-first-phase-new-cms-roll-out

[17]: D Young & Co: **883 total UPC cases by 31 May 2025**, infringement activity +31.8% YoY in year two. See: *UP & UPC statistics and trends: a two-year check in*, June 2025 — https://www.dyoung.com/en/knowledgebank/articles/up-upc-statistics-jun2025

[18]: JUVE Patent: **+54% YoY infringement filings in 2025** (239 in 2025 vs 155 in 2024). See: *UPC received 50% more infringement cases in 2025* — https://www.juve-patent.com/legal-commentary/upc-received-50-more-infringement-cases-in-2025/

[19]: Clarivate: *The Unified Patent Court at two: What the data really says* — https://www.clarivate.com/intellectual-property/blog/the-unified-patent-court-at-two-what-the-data-really-says/

### DAO funding model precedents

[20]: **bio.xyz / BioDAO model** — community-owned per-vertical DAOs with dedicated treasuries that fund individual projects out of pooled funder capital, milestone-based capital release, and a two-layer governance model (strategic layer for major decisions, operations layer for day-to-day). Used as the architectural reference for DeLi's per-case DAO model, with infringement cases replacing biotech research projects as the funded unit. See: *BioDAOs concept docs* — https://docs.bio.xyz/bio/introduction/concepts/biodaos ; *Deal flow process* — https://docs.bio.xyz/bio/introduction/biodaos/deal-flow-process ; *BioDAO Litepaper* — https://biodaoxyz.gitbook.io/litepaper

### UPC procedural timeline

[21]: UPC first-instance proceedings target a **~12-month timeline** from Statement of Claim to first-instance decision: 3 months for Statement of Defence, alternating reply / rejoinder submissions over the written procedure, ~3 months interim procedure, and a decision within ~6 weeks of the oral hearing. Complex cases routinely extend to 12–14 months; Court of Appeal in Luxembourg adds further time. See: *Timeline of Infringement and Revocation Actions Before the UPC*, De Clercq & Partners — https://www.dcp-ip.com/en/press-news-insights/timeline-of-infringement-and-revocation-actions-before-the-unified-patent-court ; *Unified Patent Court Procedural Timeline*, McDermott — https://www.mcdermottlaw.com/insights/unified-patent-court-procedural-timeline/ ; *How does a case proceed through the UPC system?*, Kromann Reumert — https://kromannreumert.com/en/knowledge/articles/how-does-a-case-proceed-through-the-upc-system
