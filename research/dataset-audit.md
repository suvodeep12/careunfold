# Review dataset audit

Checked 1 October 2026. Audience: desktop extension users choosing doctors and clinics in India. Discovery is followed by a completed [GMR–PL file inspection](gmr-inspection.md). The raw archive was downloaded locally; no model trained or fraud accuracy established.

## Recommendation

**GMR–PL was the strongest first candidate to inspect, but its released files have substantial limitations.** They omit business identities and contain a photo-field shortcut matching 99.92% of labels. Retain it for exploratory stress tests; reject it as a production training foundation. See the [completed inspection](gmr-inspection.md).

Do not choose a model or publish a fake-review percentage before inspecting the actual files and obtaining independent target-domain evaluation. The missing asset is reliable labels for Indian clinic reviews, not a newer model.

## Main candidate: GMR–PL

The paper reports 605 accounts and 17,979 reviews, including 2,436 labeled fake. It covers Poland and reviews dated 2013–2023. Seeds were traced from fake-review vendors; account groups were expanded using shared reviewed places. Genuine accounts were initially presumed genuine from geographically sampled listings. Seven experts assessed 442 accounts; disputed cases received further review. Review labels inherit account labels rather than verify each experience. Dates are approximate, especially older entries. [Original paper](https://www.mdpi.com/2076-3417/13/10/6331)

The live Kaggle card declares CC BY 4.0, describes anonymized data, and lists accounts/reviews in CSV and JSON, 16.2 MB total. The account preview exposes ID, deletion/private flags, label, Local Guide level, name score and review count. Downloaded schemas and joins are now checked; the actual release omits business identities present in the paper's schema. [Author's dataset](https://www.kaggle.com/datasets/pawegryka/gmr-pl-fake-reviews-dataset)

My evaluation requirements: prevent account/business overlap across evaluation partitions; report reviewer-group leakage explicitly; exclude label-derived metadata and country-specific name scores; do not infer ban from deletion. Network-based labeling can make evaluation on network features circular. These are proposed safeguards, not completed checks.

## Additional research candidates

| Candidate | Verified evidence | Decision |
|---|---|---|
| [Flowerly/modern-fake-reviews](https://huggingface.co/datasets/Flowerly/modern-fake-reviews) | Card declares CC BY 4.0, 40,424 English product reviews, balanced human-source/modern-generated classes, text/category/rating fields and generation provenance. Card explicitly says machine-generated does not necessarily mean deceptive. | Optional cross-generator text robustness benchmark. Neither clinic data nor fraud truth; do not accept its own performance claims as independently reproduced. |
| [AI-generated Google Reviews, ICWSM 2026](https://zenodo.org/records/18162470) | Primary paper describes approximately 78k generated reviews plus external generators. Live Zenodo record says research only and files restricted, despite paper's description of open availability. | Modern Google-style research adjunct, but access unresolved. Paper license is not dataset clearance. [Paper](https://ojs.aaai.org/index.php/ICWSM/article/view/42791) |
| [Asiri/Alotaibi Mendeley v2](https://data.mendeley.com/datasets/y2s4973hsg/2) | 2025 author release; English NYC restaurant Google Maps reviews; CC BY 4.0; labels based on predefined deception indicators. | Lower priority: heuristic labels risk rewarding the assumptions under investigation. |
| [YelpNYC](https://shebuti.com/yelpnyc-dataset/) | Reviewer/business/date/rating/text structure; current author page requests email acquisition; dataset license not established. Recommendation status supplies proxy labels. | Historical behavioral reference. Yelp explicitly says many unrecommended reviews are genuine. [Yelp](https://www.yelp-support.com/article/Why-would-a-review-not-be-recommended?l=en_GB) |

See [dataset-alternatives.md](dataset-alternatives.md) for Ott, YelpCHI/Zip and original-source details.

## Requested discovery services

| Service | What this pass established |
|---|---|
| Kaggle / Hugging Face | Relevant research artifacts above; repository availability does not establish label reliability. |
| [Tathya / Tathyakosh](https://www.tathyakosh.in/) | User completed login; signed-in catalogue searches verified. `reviews`: 530 results, first page largely systematic/literature reviews. `fake reviews`: one unrelated fake-news committee report. `Google Maps`: 2,121 broad results, including unrelated mapping; first page did not establish a review corpus. `Practo`: zero results. `patient feedback`: one QPL research table, checked at its original source and rejected for this task. These are bounded searches, not an exhaustive catalogue audit. |
| [Google Dataset Search](https://datasetsearch.research.google.com/) | Live search “Google Maps fake reviews” returned four results: aggregate moderation disclosures, product/location reviews, a trust report and Ahmedabad hotel reviews. “India doctor reviews” returned 16 business-data results from one provider; selected result variables include rating and review count, not fraud labels. No suitable independently labeled Indian-clinic set established in these searches. Index is incomplete; this is not proof no such set exists. |
| [DataONE](https://www.dataone.org/about/) / [GBIF](https://www.gbif.org/what-is-gbif) | Earth/environmental discovery and biodiversity infrastructure, respectively. Low priority for this task; no suitable review corpus established. |
| [DBpedia](https://www.dbpedia.org/about/) / “Data Catalog” | DBpedia is structured Wikimedia knowledge, potentially entity enrichment rather than review labels. “Data Catalog” identity remains ambiguous; URL requested. |

## Rights and validation boundaries

### Tathya follow-up after login

The sole `patient feedback` result was [Patient feedback on QPL](https://www.tathyakosh.in/datasets/HLT-25709). Its catalogue header says CC0 1.0, while its source note says CC BY 4.0. The [original Figshare record](https://plos.figshare.com/articles/dataset/_p_Patient_feedback_on_QPL_p_/30935883) confirms **CC BY 4.0** and a 9.5 kB `Table 6.xls`. The visible table contains aggregate agreement counts, percentages and statistical tests about a Question Prompt List for oncology consultations in Meghalaya. It supplies neither online review text nor fraud labels. No download needed to reject its suitability. Tathya's quality score and healthcare category do not substitute for original-source verification.

**Follow-up outcome:** no stronger candidate established through these signed-in searches. Keep GMR–PL as the first behavioral research candidate; the Indian-clinic validation gap remains.

CC BY describes the uploader's offered permissions and attribution obligations. It does not establish every third-party right, remove privacy obligations, or authorize a live Google Maps collection method. The existing [feasibility audit](feasibility.md) addresses access constraints separately. No candidate has been established here as a commercially cleared, independently labeled Indian-clinic benchmark.

The credible product direction remains explainable evidence of unusual review patterns, sample coverage and uncertainty. Low review counts, positive ratings or polished English alone must not become proof of fraud. Synthetic fixtures can verify our code's detection of constructed patterns; they cannot measure accuracy on real clinics.

## Next bounded experiment

Completed: actual schemas, row counts, IDs/joins, missingness, normalized duplicate text, label distributions and file hashes. The [inspection](gmr-inspection.md) identifies acquisition shortcuts and missing business identities. Next: define a bounded evidence prototype and independent target-domain evaluation. Live-access permission remains a separate requirement.
