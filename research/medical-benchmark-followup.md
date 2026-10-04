# Physician-review benchmark follow-up

Checked 3 October 2026. Read the existing product, feasibility, dataset, enforcement, independent-patient and Ott-baseline audits first. Four bounded discovery queries, followed by primary-paper inspection. No outreach, account creation, raw patient-data download, model training or hosted inference. This follow-up concerns authenticity labels, not clinical quality or a patient-experience reference rating.

## Decision

**A stronger Indian physician-review label methodology exists in published research, but no usable free public benchmark was established.** Stop at the access/licence gate. Do not manufacture genuine labels from the complement of suspicious entries, or describe the user's review judgments as independent truth.

## Strongest relevant lead: forensic labels from an Indian platform

[Shukla et al., *Catch Me If You Can*, arXiv 2304.09948](https://arxiv.org/pdf/2304.09948), sections 3–3.2, describe an unnamed Indian doctor-search platform and a security vulnerability permitting doctor/staff reviews without patient knowledge. The authors report labeling exploit-associated reviews using platform credentials, cookies and session evidence, rather than writing style. After removing short, junk and duplicate entries, their corpus contains 38,048 reviews: 8,418 exploit-associated and 29,630 remaining reviews labeled authentic. They report cold-start partitions without shared doctors, reviewers or clinics.

This is a materially stronger positive-label basis than sparse profiles or polished language. Nevertheless, the assumption that all remaining reviews are genuine does not rule out other manipulation mechanisms. Independent raw-evidence verification was not available in this audit. The inspected paper and [arXiv record](https://arxiv.org/abs/2304.09948) did not establish a downloadable corpus or dataset reuse licence; targeted discovery found no author-owned public release. The anonymous platform must not be identified as Practo by inference. This historical exploit task does not establish current Maps/Practo detector accuracy, AI-assisted genuine-review eligibility, or a numeric integrity penalty.

## Controlled physician fabrication leads

| Primary source | Label basis and comparison | Access and suitability gate |
|---|---|---|
| [Li et al., 2014, *Towards a General Rule for Identifying Deceptive Opinion Spam*](https://www.cs.cmu.edu/~hovy/papers/14ACL-deceptive-opinions.pdf), sections 3 and 5 | Doctor subset: 200 commissioned positive reviews from crowdworkers; 32 positive fabricated self-reviews solicited from 15 doctors; 200 comparison customer reviews, collected using the authors' matching approach. Controlled fabrication provenance is distinct from stylistic annotation. Comparison experiences are not independently corroborated in the inspected description. | Footnote 1 says dataset available by request from the first author. No no-contact download or dataset licence verified. Doctor subset has no negative sentiment comparison. Their hotel-trained unigram SVM achieved only 0.55 accuracy on doctors, illustrating domain transfer risk; this is a reported experiment, not a reproduced result. |
| [Zhao et al., 2024, *How to detect fake online physician reviews*](https://journals.sagepub.com/doi/10.1177/20552076241277171), Methods / Dataset construction | Chinese Haodf corpus combines 4,000 crawled platform reviews with 400 commissioned fabrications: 100 by practicing physicians and 300 by general users. Authors screen fabricated texts for length, detail and relevance. Published comparison reviews are called true without separately demonstrated encounter verification. | No free corpus link, dataset licence or doctor-disjoint release established in the inspected Methods. Article availability is not dataset permission. China's platform, language, controlled-writing selection and assumed comparison labels do not validate Indian Google reviews. Publisher page access later became unreliable; do not infer uninspected supplement contents or leakage safeguards. |

## Consequence for the current work

The Indian forensic study changes the evidence requirement from a vague search for labels to a concrete example of stronger provenance: review-level manipulation linkage using independently recorded platform events. It does not provide this project with those events or a cleared corpus. Controlled physician-writing tasks could support narrow experiments only after legitimate free access, licensing, comparison-label quality and doctor/author-held-out evaluation are established.

The user's 20 assessments remain subjective judgments, useful for documenting preferences or checking agreement. Using those same writing-style and profile-count judgments to train and evaluate a detector would measure imitation of the judgments, not authenticity. No model, exclusion threshold, verified rating or integrity penalty is unlocked by this bounded pass.

## Targeted follow-up, 4 October

[Author-owned access checks](forensic-benchmark-access.md) establish the Indian paper's publication-status report, paper licence and bounded coauthor repository inventory, without locating a licensed corpus. [The Chinese study's readable full-text audit](physician-model-evaluation-audit.md) resolves article access and identifies unresolved resampling/partition safeguards and possible construction shortcuts. The next gate is source-specific corpus access and permission, followed by original-example and entity-held-out evaluation; repeated broad catalogue searches are not the current next action. No outreach, training or rating changes were made.
