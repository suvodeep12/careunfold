# Mendeley deceptive-review workbook inspection

Checked 2 October 2026. **Reject this release as independent truth labels for Indian doctor fraud detection.** It is useful for auditing a published heuristic, but cannot establish fabricated patient experiences or calibrate doctor-integrity penalties. No model trained, accounts contacted, or browser automation used.

## Original release and acquisition

Asiri and Alotaibi's [Deceptive Reviews Dataset v2](https://data.mendeley.com/datasets/y2s4973hsg/2), DOI `10.17632/y2s4973hsg.2`, was published 2 July 2025. The author record describes English Google Maps restaurant reviews from New York and offers **CC BY 4.0**. This uploader-declared license does not establish all underlying third-party rights or permission for live Maps collection; see [feasibility.md](feasibility.md).

The public page initially supplied metadata but an empty server-rendered file list. Its published page bundle exposes the anonymous file-list route. Inspection of that route returned one completed workbook, without authentication:

- [Version-2 file metadata](https://data.mendeley.com/public-api/datasets/y2s4973hsg/files?folder_id=root&version=2&%24start=0&%24limit=1000), requested with `Accept: application/vnd.mendeley-public-dataset.1+json`.
- [Original workbook download](https://data.mendeley.com/public-files/datasets/y2s4973hsg/files/7b56ca78-dca5-4f4b-8ff8-bfd0cb0294fb/file_downloaded).
- File: `reviews_dataset.xlsx`; file ID `7b56ca78-dca5-4f4b-8ff8-bfd0cb0294fb`; **2,990,667 bytes**.
- Downloaded SHA256 equals the metadata hash: `2e57b7b6b07f8074c8bccf47f9fdbcfa1ee786e5ce71e0de00209c9a879ad9c6`.

Raw workbook, acquisition metadata and local inspection script remain under ignored `data/mendeley/`. No review text or reviewer names are reproduced here. Python standard-library ZIP/XML parsing read the workbook's values without running macros, downloaded JavaScript or spreadsheet formulas. No new dependency installed.

## Actual workbook

One sheet, `Sheet1`, dimension `A1:M21477`: one header and **21,476 nonempty data rows**, 13 columns. The archive has no additional annotation sheet, codebook or business table. Zero formula cells observed in the sheet.

Exact column names: `text`, `PM Ratio`, `FPSP Ratio`, `Review Length`, `RW Ratio`, `Sentiment`, `Generalization`, `Passive Voice`, `Total reviewer reviews`, `Account type`, `Useful votes ` (trailing space), `Attached Medias`, `label`.

| Inspection | Result |
|---|---:|
| Label `0` | 12,583 rows |
| Label `1` | 8,893 rows |
| Missing or whitespace-only values | 0 in every column |
| Numeric parsing failures outside `text` | 0 |
| Exact duplicate-text groups / participating rows / excess rows | 64 / 143 / 79 |
| Normalized duplicate-text groups / participating rows / excess rows | 97 / 246 / 149 |
| Normalized duplicate-text groups with both labels | 49 |
| Completely identical full-row duplicates, excess rows | 0 |

Normalization means Unicode NFKC, case folding and whitespace collapsing. Excess rows count occurrences beyond the first in each group. Mixed labels for matching text are consistent with labels depending on metadata; they are not proof of label error or fraud. Group matching text before evaluation to avoid text leakage across partitions.

The three metadata columns `Account type`, `Useful votes ` and `Attached Medias` contain binary values only. `Total reviewer reviews` ranges from 0 to 2,343; `Review Length` from 3 to 772. The workbook contains **no reviewer IDs, business IDs/names, posting dates, review URLs, star ratings, receipts, admission records or platform fraud findings**. Account history size is available, but reviewer-network, business-disjoint and time-disjoint evaluation cannot be established from these fields. Absence of blanks does not prove source completeness or accuracy.

## What its labels mean

The [original paper](https://rgnpublications.com/journals/index.php/cma/article/download/3310/1852/12558), sections 7.3–8, defines `DI = sum(I1..I11)` and `label = 1 if DI > mean(DI), otherwise 0`. Indicators concern punctuation, pronouns, length, repetition, sentiment, generality, passive voice, reviewer activity, Local Guide status, likes and media. Validation manually checks a subset against these rules, rather than verifies experiences. Labels `0`/`1` mean author-assigned truthful/deceptive; workbook counts match the paper.

The paper reports 98.245% Random Forest accuracy and acknowledges restricted English/US/restaurant scope; that model result was not reproduced. **Our interpretation:** predicting these labels measures agreement with the heuristic rather than independently verified fabrication.

A separate deterministic reconstruction from workbook features, without text or training, used this explicit rule:

```text
DI = [PM > mean(PM)] + [FPSP < mean(FPSP)] + [length < mean(length)]
   + [RW > mean(RW)] + [abs(sentiment) > 0.6] + [generality > mean(generality)]
   + [passive > mean(passive)] + [reviewer_count < mean(reviewer_count)]
   + [account_type == 1] + [useful_votes < 1] + [media < 1]
prediction = [DI > mean(DI)]
```

Brackets denote a Boolean converted to 0/1. Means were computed from this workbook, not fitted to labels. The resulting mean DI was **6.124185136897001**. Predictions matched **21,416 / 21,476 labels (99.72%)**, leaving **60 mismatches**. This verifies near-deterministic feature-to-label recovery, not complete reconstruction or fraud accuracy. No thresholds were tuned to eliminate mismatches; their cause remains unverified. The paper's sentiment-table negative-range inequality conflicts with its prose; this reconstruction follows the prose's strong-negative/strong-positive interpretation.

## Decision for CareUnfold

Keep the file as an optional exploratory heuristic benchmark, with labels explicitly named as author-assigned indicators. Do not train or validate an Indian-doctor authenticity detector against it as ground truth, import its thresholds into production, or use its headline accuracy to justify rating penalties. This inspection resolves the candidate's schema and accessibility; it leaves the independent Indian-healthcare validation requirement unmet.

Local reproduction: `python data/mendeley/inspect.py` prints aggregate counts and writes ignored `metrics.json`; it never prints review text. Source hash and aggregate output were checked in this pass.
