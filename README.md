# DeLi

**Collective, milestone-staged financing for patent enforcement — one on-chain entity per case.**

DeLi orchestrates the three parties in a patent enforcement case — the **patent owner**, the **funder**, and the **infringer** — around a single case, each with a workflow tailored to what they need to decide, fund, or resolve. The goal is to make enforcement workable for the cases the existing market ignores: small and mid-size patent holders whose cases never reach a traditional litigation funder.

The first version targets the **Unified Patent Court (UPC)**, the easiest jurisdiction to integrate against.

![Hero banner — three parties around a case node](image/dark01.png#gh-dark-mode-only)
![Hero banner — three parties around a case node](image/light01.png#gh-light-mode-only)

---

## The problem

When a patent owner has a real infringement case, the blocker is money to pursue it. Traditional litigation funders spend **$50K–$500K on due diligence per case** and, to cover that cost, only fund cases with **expected profit above ~$2M** — ending up funding just **3–5% of the cases they review**. Everything below that threshold structurally never gets funded today.

In Europe the gap is stark: **no member state offers dedicated public funding** for patent litigation, and the only targeted EU support (EUIPO IP Scan Enforcement) is capped at **€450–€810** — orders of magnitude below real litigation cost.

DeLi is aimed squarely at that underserved segment.

![The funding gap — litigation-finance case selection funnel](image/dark02.png#gh-dark-mode-only)
![The funding gap — litigation-finance case selection funnel](image/light02.png#gh-light-mode-only)

---

## The three parties

**Patent owner** — gets access to **staged collective financing**, with funds unlocked at key case milestones. Built specifically for owners who cannot get funded through traditional litigation finance.

**Funder** — gets a platform that **aggregates structured case information** to cut per-case due-diligence cost, plus a mechanism for **group litigation funding** that lets ordinary investors participate collectively rather than restricting finance to a few professional funds. (Patent cases were ~32% of new commercial litigation-finance commitments in 2024, so small per-deal savings compound.)

**Infringer** — gets a structured **path to settle or take a voluntary license** before being sued, **lower-commission cross-border payment via blockchain rails**, and a verifiable **good-faith response receipt**: a timestamped, independently auditable record of timely engagement usable in court as mitigation evidence.

![Three-party interaction map](image/dark03.png#gh-dark-mode-only)
![Three-party interaction map](image/light03.png#gh-light-mode-only)

---

## How it works

### One on-chain entity per case

DeLi's architecture follows the **bio.xyz / BioDAO pattern**: instead of a single monolithic fund, **each infringement case is its own on-chain entity** — its own treasury, its own funder set, its own dedicated legal wrapper. The platform sits above these per-case entities and gives them a uniform interface.

For every accepted case, the platform spins up a dedicated **case-DAO**:

- A separate on-chain treasury holding the capital committed to *this* case.
- A separate **legal wrapper** (SPV, segregated cell, foundation, association, or hybrid).
- Funder commitments bound to **this case's economics only** — no cross-case exposure.

Standardization lives at the **platform layer** (same UI, same milestone schema, same vendor integrations); flexibility lives at the **case-DAO layer** (each case's funders vote on case-specific non-standard decisions).

![Platform vs. per-case architecture](image/dark04.png#gh-dark-mode-only)
![Platform vs. per-case architecture](image/light04.png#gh-light-mode-only)

### Three entry points

A patent owner can enter at different moments in the case lifecycle. Each defines a **different risk/return profile** for that case-DAO and a **different set of integrated tools** the platform must provide.

1. **Pre-litigation (P)** — infringement suspected but not yet filed. Tools: detection, evidence gathering, patent-strength analysis, claim charts, damages modeling, formal notice. *Highest uncertainty, lowest entry cost, longest horizon.*
2. **Active-litigation (L)** — a UPC action is already underway; capital is needed to continue prosecution. Tools: procedural document support, UPC-CMS integration. *Medium uncertainty.*
3. **Post-judgment (A)** — a favorable first-instance judgment exists; capital is needed to collect. Tools: enforcement, asset tracing, cross-border recognition. *Lowest uncertainty, highest ROI, constrained by recoverability.*

![Lifecycle entry points](image/dark05.png#gh-dark-mode-only)
![Lifecycle entry points](image/light05.png#gh-light-mode-only)

### AI-assisted case dashboard

Regardless of entry point, every accepted case is surfaced to prospective funders through a **single unified information panel**. It combines **owner-authorized data** (claim charts, evidence, damages estimates) with **public sources** (patent register, prosecution history, UPC opt-out status, parallel proceedings, defendant filings, prior case law), processed by a **patent-case-tuned AI model** into a structured summary across the funder's standard evaluation axes — patent strength, infringement-read confidence, damages range, defendant recoverability, procedural risk, timeline — each with explicit confidence indicators.

It **does not replace** the funder's own due diligence; it gives them structured material to start from and shortens the back-and-forth with the owner.

![Funder case dashboard mockup](image/dark06.png#gh-dark-mode-only)
![Funder case dashboard mockup](image/light06.png#gh-light-mode-only)

### Milestone-gated capital & exit checkpoints

The case-DAO releases capital to the patent owner (and operational vendors) only as **predefined milestones** are reached. Default mode is automatic, milestone-driven release without per-tranche votes; **non-standard decisions** — accepting a below-threshold settlement, switching counsel, materially changing strategy — escalate to **on-DAO governance** by that case's funders.

The lifecycle also includes designated **exit checkpoints** where an individual funder can exit and crystallize a loss (e.g. after DD but before filing, or after an unfavorable preliminary ruling) — the principle being that a funder should be able to *stop the bleed at known checkpoints* rather than be locked in for the full case.

![Milestone capital release and exit checkpoints](image/dark08.png#gh-dark-mode-only)
![Milestone capital release and exit checkpoints](image/light08.png#gh-light-mode-only)

### Confidentiality layer (ZK)

Patent enforcement defaults to confidentiality: settlement amounts are NDA-covered, an infringer should not be publicly tagged before any court finding, and license terms are commercial secrets. A naive public-ledger implementation would expose all of that. DeLi combines **ZK confidential transfers** with an **off-chain confidential layer**:

- **Settlement & license payments** move as ZK-confidential stablecoin transfers — the ledger sees only a commitment that a transfer happened.
- **Infringer & licensee identity** stays off-chain under KYC; on-chain artifacts are commitments and hashes, not raw identifiers.
- **Funder identity** is KYC'd off-chain and pseudonymous on-chain, with **selective disclosure** of provable properties (e.g. accredited status).
- **Case substance** stays off-chain in confidential storage; only **hashes anchored on-chain** for tamper-evidence and operational metadata sit on the ledger.

![On-chain / off-chain confidentiality split](image/dark09.png#gh-dark-mode-only)
![On-chain / off-chain confidentiality split](image/light09.png#gh-light-mode-only)

---

## How DeLi makes money

1. **Founder's share in each case-DAO** — the platform holds a stake in every case-DAO it spins up and earns alongside funders when a case resolves profitably. *The platform earns when funders earn.*
2. **Subscription to structured case data** — funders pay for access to standardized case data before deciding whether to join a case-DAO, capturing value even from cases they evaluate and skip.
3. **Markup on external integrations** — notices, expert engagement, filings, translation, payment rails all run through the platform at a small markup; scales with case *activity*, not outcome.
4. **Settlement commission** — a commission on the infringer → patent-owner stablecoin transfer when a case settles through the platform.

![Four revenue streams](image/dark10.png#gh-dark-mode-only)
![Four revenue streams](image/light10.png#gh-light-mode-only)

---

## Why per-case instead of a shared treasury

A single pooled treasury was considered and rejected for four reasons:

- **Case duration** — a UPC action targets ~12 months at first instance and far longer end-to-end; per-case accounting is the only honest way to track P&L and ownership over that horizon.
- **Separation of concerns** — each case has its own funders, counsel, evidence, and confidentiality regime; per-case wrappers contain each case's risk inside its own legal and on-chain boundary.
- **Wide spread in deal sizes** — funding needs vary by more than an order of magnitude; per-case DAOs let each case raise exactly what it needs.
- **Flexibility vs. standard flow** — keeps ~80% of the workflow standardized at the platform layer while preserving the ~20% of decisions that genuinely belong to each case's funders.

---

## Initial scope: UPC

v1 focuses on the **Unified Patent Court** because it is the easiest jurisdiction to integrate with: UPC publishes **public APIs over its Case Management System without authentication**, and volume is growing fast — **883 cases by May 2025**, infringement filings up **+31.8% YoY** in year two and **+54% YoY** into 2025. Other jurisdictions are out of scope for v1.

---

## What's built so far

The current implementation (in [`core/`](./core)) is an early on-chain MVP of the per-case primitives:

- **Patent NFT** — represents verified IP ownership as the on-chain anchor for a case (KYC / ownership-proof gating is stubbed for now).
- **Per-case license token** — an on-chain token bound to a specific patent, carrying **dynamic case metadata** that tracks the case through its full lifecycle, from *detection & monitoring* through *pre-suit notice*, the UPC *written and oral procedure*, *judgment*, and on to *enforcement* and *settlement execution*.
- **Campaign / funding** — deploys a per-case fundraising campaign and seeds a market for its license token.
- **Trading & routing** — lets participants swap into a case's license token through that market.

This covers the case-as-on-chain-entity and milestone-aware foundations described above. The confidentiality layer, AI case dashboard, governance/exit mechanics, and UPC integration are upstream of the open research areas and not yet implemented.

![Current MVP building blocks](image/dark07.png#gh-dark-mode-only)
![Current MVP building blocks](image/light07.png#gh-light-mode-only)

---

## Open research areas

Several decisions are upstream of detailed design and still open, including: platform/legal-entity and wrapper form; KYC/KYB model; the group-funding participation structure; full case-lifecycle and milestone mechanics; money flow, custody and cross-border settlement rails; infringer settlement/licensing flow; UPC integration depth; the technical and confidentiality stack; funder subscription willingness-to-pay; settlement-commission pricing; and v1 entry-point scope and go-to-market.

---

*DeLi — making patent enforcement workable for the cases the market leaves behind.*
