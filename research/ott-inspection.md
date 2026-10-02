# Ott deceptive-opinion-spam corpus inspection

Checked 2 October 2026. **Original release acquired; suitable only as a conditional, noncommercial offline text benchmark.** It does not establish Indian-doctor authenticity, integrity or correct ratings. No model trained, downloaded code executed, authors contacted, payment made or browser UI used.

## Original source and rights

The author's [current website](https://myleott.com/) links his [GitHub profile](https://github.com/myleott). The [public repository inventory](https://api.github.com/users/myleott/repos?per_page=100) returned five repositories and no corpus repository; `myleott/op_spam` returned 404. The legacy `op-spam.html` landing page also returned 404, but the author-hosted [original v1.4 ZIP](https://myleott.com/op_spam_v1.4.zip) downloaded anonymously. This resolves the earlier failed landing-page route without relying on a mirror.

Downloaded size: **1,172,634 bytes**. SHA256: `e3a61b3709ccaca842aeec7f525e273988cf3b1bab35151712cf89759a6724fa`. This is our recorded acquisition hash, not verification against an independently published author checksum.

The ZIP's `README.md` and `LICENSE` both expressly license the corpus under **CC BY-NC-SA 3.0 Unported** and request citation of the relevant 2011/2013 papers. This is dataset-specific evidence, independent of paper or code licensing. Attribution, noncommercial use and ShareAlike conditions apply; the license supplies no warranties or complete underlying-rights clearance. A free download or free extension does not by itself resolve the noncommercial condition or obligations for distributing trained artifacts. This pass does not determine whether a trained model is an adaptation; do not silently ship corpus-derived weights. [Official license deed](https://creativecommons.org/licenses/by-nc-sa/3.0/).

## Label acquisition

The [2011 paper, sections 3.1–3.2](https://aclanthology.org/P11-1032.pdf) reports 400 paid Mechanical Turk submissions: US workers with at least 90% approval were instructed to impersonate satisfied customers and fabricate positive hotel reviews. One submission per worker was allowed; accepted submissions earned $1. This provides commissioned-fabrication provenance rather than labels derived from linguistic indicators. The comparison class comprises 400 selected five-star English TripAdvisor reviews. First-time reviewers and short reviews were excluded; lengths were matched to the fabricated class. These filtering assumptions do not independently prove that every comparison experience occurred.

The [2013 paper, sections 2.1–2.2](https://aclanthology.org/N13-1053.pdf) adds 400 similarly commissioned negative reviews, with workers instructed to attack a competitor's hotel. It adds 400 selected one-/two-star reviews from Expedia, Hotels.com, Orbitz, Priceline, TripAdvisor and Yelp. The authors explicitly acknowledge that web-mined reviews are not gold-standard truthful. Sampling balances classes per hotel and matches lengths. Published classifier results describe this constructed hotel task, not fraud prevalence or calibrated authenticity probabilities on Google Maps.

Use label names **commissioned fabrication** and **assumed truthful web review** in future experiments. Keep sentiment and acquisition source explicit; neither class contains independently verified patient experiences or evidence of real hotel misconduct.

## Actual archive and split information

Standard-library ZIP parsing inspected all files without extracting or printing review text. There are **1,629 archive entries**, including directories, **1,600 UTF-8 review text files**, and two non-review files (`README.md`, `LICENSE`). Local aggregate inspection found:

| Check | Result |
|---|---:|
| Positive / negative commissioned fabrication | 400 / 400 |
| Positive assumed truthful TripAdvisor / negative assumed truthful web | 400 / 400 |
| Hotels | 20 |
| Reviews per sentiment, class and hotel | 20 |
| Fold directories | 5, each containing 320 reviews across all four cells |
| Blank reviews | 0 |
| Exact / NFKC-casefold-whitespace duplicate groups | 4 / 4 |
| Duplicate participating / excess rows | 8 / 4 |
| Mixed-class / cross-fold / cross-sentiment duplicate groups | 0 / 0 / 0 |

All duplicates belong to the negative assumed-truthful class. These observations do not establish fraud or explain their origin.

Paths encode `sentiment/source_class/fold`; filenames encode class, hotel and a uniqueness counter. **The counter is not a writer ID.** Every hotel occurs in exactly one fold, consistently across sentiment and class. The supplied folds therefore support hotel-disjoint evaluation; the papers describe holding out four hotels and tuning within training folds. [2011 section 5](https://aclanthology.org/P11-1032.pdf), [2013 section 3.2](https://aclanthology.org/N13-1053.pdf).

The released files contain text rather than structured author IDs, timestamps, URLs, per-review stars or reviewer histories. The negative web folder combines six sites without per-file platform labels. Worker uniqueness is a study-level statement; writer disjointness across the two studies cannot be checked from this release. Source is confounded with class (Mechanical Turk versus web), and platform-disjoint negative evaluation cannot be reconstructed. Do not infer independent writer/source splits or a real-world class prevalence from balanced counts.

## Decision and reproduction

Retain as an optional **noncommercial exploratory benchmark** for a locally evaluated text baseline, with hotel folds and duplicate grouping preserved. It offers better fabrication provenance than the Mendeley heuristic labels, but no permission or validation to label Indian doctor reviews fake, penalize providers, infer clinical competence or claim a true rating. Modern AI writing, Hindi/Hinglish, genuine templates and adversarial negative campaigns remain outside verified coverage. Target-domain independent evidence is still required by [rating-validation.md](rating-validation.md).

The ZIP, locally written inspection script and aggregate JSON remain under ignored `data/ott/`. Run `python data/ott/inspect.py` to reproduce counts/hash without printing reviews. No raw review text is tracked or included in this note.
