# CareUnfold

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Confirmed: WXT, TypeScript and React; Manifest V3 desktop extension. Local JSON import, no backend. User chose code-first implementation with working-screen review.

## Users
People choosing doctors and clinics in India, initially on desktop Chrome/Edge.

## Product Purpose
Help people choosing doctors in India compare evidence. The approved long-term direction separates estimated patient experience from verified registration, specialty and clinical-outcome evidence where available. Reviews alone cannot establish clinical quality or guarantee a correct choice. The first prototype inspects observable review patterns using synthetic demonstrations, imported reviews and explicitly enabled local Maps sessions.

The requested final integration targets are Google Maps and/or Practo. The prototype is a milestone toward that goal, not proof of true doctor ratings or correct medical decisions. Platform access, metric semantics and real-world validation remain required work.

User confirmed automatic multi-doctor comparison on Google Maps search results, limited to results already loaded by the user. Once a permitted live-access route is established, the comparison should refresh when the loaded results change, without requiring a per-search analysis button. Do not auto-scroll or load additional search results. Keep each doctor's evidence and review sample separate; show original ratings, sample adjustments, coverage and insufficient-evidence states. A loaded search result does not imply that its reviews are loaded or available for analysis. Batch comparison does not establish a true rating or clinical-quality ranking.

User requires everything to be completely free, including no paid service dependency for the extension long term. Do not adopt chargeable data services, hosted infrastructure, model APIs, tooling or distribution paths. Free credits or capped cloud-scraper tiers do not satisfy the long-term requirement. The selected technical route is local browser observation using native extension APIs and computation on the user's device. User approved reusing one temporary background tab to automatically load review pages for already-loaded doctors. Before starting a session, the user must select either up to 100 newest reviews or an attempt to load all available reviews. No depth is selected by default; both choices remain subject to collection deadlines and missing evidence. This browser-workflow approval does not resolve platform content rights or establish complete review coverage.

DOM parsers, review-page loading logic, the sequential owned-tab batch function and background session messaging are implemented with runnable regression checks. The unlisted result observer watches the explicitly selected source tab and never scrolls search results. It retains completed results only for unchanged listing metadata during that session, cancels obsolete batches and serializes cleanup before a new batch. Closing the panel/source tab or removing site access stops the session. Page reloads disconnect the observer and require reconnection. The manifest declares `scripting` plus optional Google host access; the Google Maps view requests site access only after the user selects a review depth and enables a session. It displays separate listing, captured-sample and adjusted-sample ratings, coverage, capture time and supporting entries. Signed-in installed Edge 0.2.3 testing captured multiple real listings, including 100-review samples; some listings stalled earlier. See research/edge-panel-verification.md for scope and instrumentation limitations. Version 0.2.4 corrects a regression-tested early stall during traversal of long loaded reviews; its installed live retest remains pending.

## Capabilities and Constraints
Live Maps collection has partial installed verification, not complete coverage or accuracy validation. User approved a revised sample rating: exact normalized duplicate-text groups receive one combined vote (the group's mean stars); other entries retain one vote. Display original average and affected entries. This is a sensitivity scenario, not a true clinic rating. No fraud probability, claim of purchased reviews, AI-authorship verdict, or inference about medical competence. Missing reviewer counts stay unknown. Repeated language and date concentration need alternative explanations. Imports remain in memory and are cleared on reload; no telemetry or upload. JSON schema is an implementation decision to document explicitly.

The requested final product must scrutinize integrity, negatively affect ratings for fake reviews, and minimize user friction. On 2 October the user specified: "the presence of fake reviews is enough to penalize a doctor." Clinic involvement is therefore not a prerequisite for the requested penalty. What establishes a review as fake, whether suspected reviews qualify, the numerical penalty and validation remain unresolved; no integrity penalty is implemented. Do not silently turn the presence-based policy into approval for a suspicion-based penalty or a claim that the doctor arranged the reviews. Preserve the requested goal while distinguishing patient-experience evidence, listing trust, attributed misconduct and clinical competence.

The user authorized ML, neural networks or AI to help identify fake reviews. This does not authorize uploading reviews, adding a paid service, treating generated language as proof of fabrication, or claiming a calibrated detector without independent validation. Keep any model work local and free within the existing acquisition/privacy boundaries. A local standard-library text baseline has been evaluated on the original Ott hotel corpus, retaining parameters only in process memory. It is not integrated or approved for doctor scoring: its pooled held-hotel experiment misclassified 115 of 800 assumed-truthful web reviews. See research/ott-baseline.md. The inspected candidate datasets do not supply independent Indian-doctor fraud truth.

Version 0.2.5 adds the user-approved `www.google.co.in` Maps domain alongside `www.google.com`. The same two-origin allowlist governs page validation, listing identities, manifest optional access, startup and revocation checks. Enable requests both optional origins from its user gesture before reading the source tab URL. Preserve each supported listing's origin and require Maps paths; do not use a wildcard for all Google country domains. Browser observation found 11 rendered cards on the user's India page. URL/message and component regressions pass; installed India-domain collection remains unverified pending reload and site access.

## Evidence on Hand
Version 0.2.7 reports the specific failed collection step for missing or unselected review controls, missing or unconfirmed newest sorting, and absent or unreadable review ratings. These diagnostics are local, bounded text displayed beside the listing; no retry, new permission, persistence or scoring rule is added. Regression checks and synthetic browser preview verification pass. Installed collection with the new diagnostics remains unverified.

Version 0.2.6 prefers the displayed search-card title over the accessible link label, which can append visited status. A regression verifies that changing only visited status leaves the parsed listing unchanged when the displayed title is available. This prevents visited metadata from invalidating the batch fingerprint; it does not establish the reason for the user's missing collection tab or verify installed collection. Panel status is pending.

Research in research/ describes observational pilot listings and the GMR–PL audit. Neither supplies Indian-clinic truth labels. Demo content must be clearly synthetic and must not name real doctors.

## Product Principles
Evidence before verdicts; transparent sample coverage; privacy by default; legible uncertainty; independently validate before scoring authenticity.

## Open Decisions
The product name is CareUnfold: revealing the evidence behind care decisions. Initial exact-name web searches on 2026-10-01 returned no results; trademark and domain clearance remain unverified. Distribution, permitted live-access route and representative validation set remain undecided. User clarified a revised star rating and approved the transparent duplicate-text adjustment; that numerical comparison leads the interface.

Independent validation recruitment remains undecided: on 2 October 2026 the user answered "not sure" about helping recruit consenting patients. That answer does not authorize recruitment or collecting patient information. Existing public-source research may inform the study, but no independent doctor-level reference sample has been established.
