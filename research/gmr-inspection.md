# GMR–PL file inspection

Completed 1 October 2026. **Decision: retain this dataset for exploratory research; reject it as the basis for a production fraud classifier or an Indian-clinic accuracy claim.**

## Acquisition and reproducibility

Downloaded the original [author's Kaggle release](https://www.kaggle.com/datasets/pawegryka/gmr-pl-fake-reviews-dataset) through `https://www.kaggle.com/api/v1/datasets/download/pawegryka/gmr-pl-fake-reviews-dataset`. The archive is saved locally at `data/gmr-pl/source.zip`, excluded from Git. The live card was observed declaring CC BY 4.0 during the preceding discovery pass; the archive contains no separate license file. Upstream review rights and live Maps access remain unresolved.

Archive: 2,365,978 bytes; SHA-256 `b10b637208dc5b368aee12e65d9a59b8fbc53764a152e1ab3d8e8461346cef69`. Four CSV/JSON files, 16,199,484 uncompressed bytes. Archive CRC checks passed. No extraction or execution of downloaded code occurred.

Reproduce with `python research/inspect_gmr.py`. Python 3.11.15 was used; no packages installed. The script runs a small synthetic self-check before auditing the archive. It writes aggregate results to [gmr-inspection.json](gmr-inspection.json), including individual file hashes and actual CSV schemas. No review text or account identifiers are exported into the report.

## Verified findings

| Check | Result | Consequence |
|---|---|---|
| Counts and labels | 605 accounts; 17,979 reviews; 15,543 labeled real and 2,436 labeled fake | Matches the published final counts. These are dataset labels, not newly verified fraud judgments. |
| Join integrity | Unique account/review IDs; zero orphan reviews; zero account/review label disagreements; 162 accounts have no review rows | Review labels fully inherit account labels. Evaluation must separate accounts across partitions. |
| CSV versus JSON | Ordered IDs, row counts and labels agree | Other fields were not exhaustively compared between formats. |
| Business identity | Released review schema has no business ID, name or URL | Correction to the initial structural recommendation: direct reviewer–business network evaluation is unavailable. Approximate coordinates are not safe substitutes for business identities. |
| Medical coverage | 437 rows: 246 labeled real, 191 labeled fake | Small category subset, not established coverage of Indian doctors or clinics. |
| Nonempty normalized duplicates | 287 groups, 2,022 rows; 143 groups cross accounts and 12 cross labels | Repeated text occurs on both label sides. Counts include short phrases; no semantic or intent analysis performed. |

## Dataset shortcuts

Every labeled-fake review has a null photo field; only 15 labeled-real reviews do. The rule “null photo field means fake” therefore agrees with **17,964 / 17,979 labels (99.9166%)**. This is a full-corpus descriptive calculation, not held-out model accuracy. Null differs from an empty photo list: the result suggests a collection/missingness artifact; it does not establish why it occurred or mean real reviews require photos.

Deletion metadata is similarly skewed: 245 of 319 labeled-fake accounts are marked deleted, versus 1 of 286 labeled-real accounts. Deleted does not prove banned. All labeled-fake review dates end by June 2021; labeled-real records extend into February 2023. Truncation and missing-field flags also differ between classes. A high score can learn acquisition history rather than deception.

The account totals include 36 labeled-real accounts with one or two total reviews. None of the labeled-fake accounts has a recorded total of one or two; 131 fake-labeled totals are missing. This corpus cannot validate the proposed one/two-review warning rule for Indian clinics.

## What now works

The local audit reproducibly checks archive integrity, CSV/JSON IDs and labels, joins, star values, parseable dates, duplicate text, missingness and category coverage. A synthetic check verifies cross-account/cross-label duplicates and rejects an orphan review. Successful checks do not validate authenticity labels, timestamp accuracy or commercial rights.

## Recommended next step

Define the extension's first output as **review-pattern evidence with explicit sample coverage and uncertainty**. Prototype repeated wording and temporal concentration using controlled fixtures. Use GMR–PL only as an exploratory stress test, excluding acquisition-derived shortcuts. Before fraud probabilities or reliability scores, obtain an independently assessed Indian-clinic evaluation set through a permitted data source. The live review-access feasibility question remains open; do not silently turn this research archive into permission to scrape Maps.
