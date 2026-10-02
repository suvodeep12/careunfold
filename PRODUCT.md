# CareUnfold

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Confirmed: WXT, TypeScript and React; Manifest V3 desktop extension. Local JSON import, no backend. User chose code-first implementation with working-screen review.

## Users
People choosing doctors and clinics in India, initially on desktop Chrome/Edge.

## Product Purpose
Help people choosing doctors in India compare evidence. The approved long-term direction separates estimated patient experience from verified registration, specialty and clinical-outcome evidence where available. Reviews alone cannot establish clinical quality or guarantee a correct choice. The first prototype inspects observable review patterns using synthetic demonstrations and imported reviews only.

The requested final integration targets are Google Maps and/or Practo. The prototype is a milestone toward that goal, not proof of true doctor ratings or correct medical decisions. Platform access, metric semantics and real-world validation remain required work.

User confirmed automatic multi-doctor comparison on Google Maps search results, limited to results already loaded by the user. Once a permitted live-access route is established, the comparison should refresh when the loaded results change, without requiring a per-search analysis button. Do not auto-scroll or load additional search results. Keep each doctor's evidence and review sample separate; show original ratings, sample adjustments, coverage and insufficient-evidence states. A loaded search result does not imply that its reviews are loaded or available for analysis. Batch comparison does not establish a true rating or clinical-quality ranking.

## Capabilities and Constraints
No live Maps access in this release. User approved a revised sample rating: exact normalized duplicate-text groups receive one combined vote (the group's mean stars); other entries retain one vote. Display original average and affected entries. This is a sensitivity scenario, not a true clinic rating. No fraud probability, claim of purchased reviews, AI-authorship verdict, or inference about medical competence. Missing reviewer counts stay unknown. Repeated language and date concentration need alternative explanations. Imports remain in memory and are cleared on reload; no telemetry or upload. JSON schema is an implementation decision to document explicitly.

## Evidence on Hand
Research in research/ describes observational pilot listings and the GMR–PL audit. Neither supplies Indian-clinic truth labels. Demo content must be clearly synthetic and must not name real doctors.

## Product Principles
Evidence before verdicts; transparent sample coverage; privacy by default; legible uncertainty; independently validate before scoring authenticity.

## Open Decisions
The product name is CareUnfold: revealing the evidence behind care decisions. Initial exact-name web searches on 2026-10-01 returned no results; trademark and domain clearance remain unverified. Distribution, permitted live-access route and representative validation set remain undecided. User clarified a revised star rating and approved the transparent duplicate-text adjustment; that numerical comparison leads the interface.
