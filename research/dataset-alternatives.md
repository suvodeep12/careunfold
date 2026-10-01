# Original-source dataset alternatives

Checked 1 October 2026. Scope: author/publisher sources outside Kaggle. No raw review files downloaded and no authors contacted.

## Decision

The clearest accessible candidate found is **Asiri and Alotaibi's Deceptive Reviews Dataset v2**, published on Mendeley Data. Use it only for exploratory text experiments after inspecting its labeling protocol and schema. It does **not** provide independent proof of review fraud, Indian clinic coverage, or clearance for a production Google Maps extension. Its authors explicitly describe labels derived from deception indicators. [Dataset](https://data.mendeley.com/datasets/y2s4973hsg/2)

For behavioral experiments, the original **YelpNYC** dataset is more structurally suitable, but its current author page requires email access and displays no data-specific license. Acquisition and commercial-use permission remain unresolved. [Author page](https://shebuti.com/yelpnyc-dataset/)

## Candidates

| Dataset | Labels and fields | Access and rights | Fit for this product |
|---|---|---|---|
| Asiri/Alotaibi, Mendeley v2 (2025) | English Google Maps restaurant reviews from New York; predefined deception-indicator labels. Search-indexed repository metadata lists `reviews_dataset.xlsx`, 2.85 MB. Exact row count and user/business/date columns remain unverified. | Author-published repository declares **CC BY 4.0**; file listing verified through the repository's [version comparison](https://data.mendeley.com/datasets/compare/y2s4973hsg). | Exploratory text benchmark only; could reward the same writing-style assumptions we need to test. No clinical or India validation. |
| YelpCHI | 67,395 reviews; 38,063 reviewers; 201 Chicago hotels/restaurants. User/business information, timestamp, rating, text. Labels mean recommended versus filtered. | Current author page says obtain labeled data by email. No public dataset license observed. | Smallest useful historical behavioral benchmark; proxy-label limitations apply. [Source](https://shebuti.com/yelpchi-dataset/) |
| YelpNYC | 359,052 reviews; 160,225 reviewers; 923 NYC restaurants. Same metadata/text fields and recommendation-status labels. | Email acquisition; no public dataset license observed. | Strong structural match for reviewer overlap, timing, and text evidence; wrong platform/domain/geography. [Source](https://shebuti.com/yelpnyc-dataset/) |
| YelpZip | 608,598 reviews; 260,277 reviewers; 5,044 US restaurants. Same metadata/text fields and proxy labels. | Email acquisition; no public dataset license observed. | Adds scale rather than better fraud truth; unnecessary first acquisition. [Source](https://shebuti.com/yelpzip-dataset/) |
| Ott Deceptive Opinion Spam | Positive study: 400 paid, deliberately fabricated reviews plus 400 assumed truthful hotel reviews; negative study adds 400 fabricated negative reviews and a comparison set. US hotel text, with hotel/class grouping; no useful reviewer network or posting history established. | Papers accessible; legacy author dataset landing page returned 404, Cornell route failed. Original dataset-specific license not verified. | Historical text baseline, not real campaign ground truth or modern AI/India validation. [2011 paper](https://aclanthology.org/P11-1032/), [2013 paper](https://aclanthology.org/N13-1053/) |

## Critical distinctions

**Yelp filtered does not mean proven fake.** Yelp explicitly says many unrecommended reviews are real customer reviews with insufficient reviewer information. A model trained on these labels can reproduce platform preferences about account activity, rather than detect fabricated experiences. Keep evaluation labels named `recommended` and `filtered`. [Yelp's explanation](https://www.yelp-support.com/article/Why-would-a-review-not-be-recommended?l=en_GB)

**An explicit upload license is stronger than an unlabeled mirror, but not complete rights clearance.** CC BY 4.0 allows commercial adaptation with attribution and change disclosure, while giving no warranties and leaving other necessary rights unresolved. It does not establish the uploader's rights in third-party review content or permission for live Maps collection. Code licenses and paper licenses are not dataset licenses. [License deed](https://creativecommons.org/licenses/by/4.0/)

**Campaign research is available, but not an immediately cleared training set.** OneReview (2019) combines cross-platform change points with crowd labels for 5,655 reviews and subsequently investigates campaigns. This is evidence-informed annotation and model output, not receipts proving every fraudulent experience. No downloadable, data-licensed campaign corpus was established in this pass; the paper's CC BY license applies to the paper. [Author-hosted paper](https://sites.cs.ucsb.edu/~vigna/publications/2019_WWW_Dataset.pdf)

## Next work

Inspect the Mendeley workbook's schema and accompanying labeling instructions under its declared license; measure text duplication and label distribution without treating its labels as fact. Require clinic-specific independent evaluation before exposing fraud judgments. None of these datasets resolves production review access.
