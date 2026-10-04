# Indian physician forensic benchmark: public-access audit

Checked 4 October 2026. Bounded follow-up to [medical-benchmark-followup.md](medical-benchmark-followup.md) after reading the existing dataset audits. Two exact-title/author discovery queries, then author-owned publication pages, the arXiv paper and a coauthor's public GitHub inventory. No outreach, signup, raw review acquisition, training or private APIs.

## Decision

**No freely downloadable, data-licensed Indian physician authenticity benchmark was established.** The strongest lead still fails the access gate. This is a bounded negative finding, not proof that no release exists.

## Verified access and publication evidence

| Primary source | Observed result |
|---|---|
| [arXiv record, 2304.09948](https://arxiv.org/abs/2304.09948) and [35-page PDF](https://arxiv.org/pdf/2304.09948) | The record has one version, submitted 19 April 2023. The inspected record/PDF provides no corpus, code repository, supplement or dataset-specific reuse licence. The record's paper-licence link resolves to [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/); this does not establish dataset permission. |
| [First author's CV](https://adshukla.com/cv.pdf), page 2 | Lists this exact title as a working paper under minor revision at Information Systems Frontier. The CV is an author status report; it does not prove current acceptance or identify a downloadable supplement. |
| [First author's research page](https://adshukla.com/research) | Lists a separate 2025 physician-fraud paper, *The Illusion of Trust and the Paradox of Disclosure*, [DOI 10.1108/INTR-01-2024-0042](https://doi.org/10.1108/INTR-01-2024-0042). No code/data link is visible on the author page. Publisher access failed in this audit, so supplement contents and whether the corpus is the same remain unverified. |
| [Coauthor Laksh Agarwal's GitHub](https://github.com/lakshagarwal) and [public repository API](https://api.github.com/users/lakshagarwal/repos?per_page=100) | All six returned public repositories were inspected by name/description/licence: CyberneticSabotage, DenyAndConquer, Infinity-For-Reddit, lakshagarwal, openai-cookbook, QuizApps. None identifies this paper or a physician-review corpus. No relevant released code was available for implementation-level leakage inspection. |

## Label and evaluation audit

The paper's sections 3.1–3.2 describe an unnamed Indian platform's approximately year-long authentication vulnerability. Fraud labels link reviews to the exploit using platform cookies, credentials and sessions; the remaining reviews are labeled genuine. This positive-label provenance is stronger than stylistic suspicion, but the complement assumption does not exclude other fraud. The published preprocessing removes duplicates and reviews shorter than 50 characters. Standard evaluation may share reviewers, doctors and clinics across partitions; the cold-start evaluation explicitly separates all three. These are paper-reported safeguards, not independently reproduced file checks. [Paper, sections 3.1–3.2 and 5.2](https://arxiv.org/pdf/2304.09948).

Historical exploit classification does not establish current Maps/Practo accuracy, eligibility of genuine AI-polished reviews, or an integrity-penalty formula. No raw forensic events, anonymized corpus, splitting code or pretrained weights were inspected. Do not infer the unnamed platform from an author's employment history.

## What changed and next gate

Compared with the previous audit, this pass verifies author-owned publication status, a related published paper, the paper's specific licence, and the complete bounded public repository inventory. It narrows the next action to **a legitimate author/publisher release or explicitly authorized access-and-licence inquiry**, rather than repeating broad dataset searches. No inquiry was sent.

Before any training, require a downloadable or expressly provided corpus, dataset-use permission, review-level label provenance, doctor/reviewer/clinic partition identifiers, and a target-domain evaluation plan. A corpus alone would not validate a true patient-experience rating or medical competence. Until those gates are satisfied, no model or numeric fraud penalty is unlocked by this audit.
