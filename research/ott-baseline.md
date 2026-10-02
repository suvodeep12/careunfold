# Local Ott text baseline

Run 2 October 2026. **Exploratory benchmark only; rejected for doctor penalties or authenticity claims.** No review text, model weights or per-review predictions are saved, uploaded or integrated into the extension. The experiment uses Python's standard library and the audited original corpus under its noncommercial research conditions; it does not resolve distribution rights for future models. See [original-source and license audit](ott-inspection.md).

## Method

Fixed multinomial naive Bayes, unigram word counts, Laplace smoothing alpha=1 and empirical training-class priors. Tokenization retains English alphabetic words with internal apostrophes; no pretrained model, feature selection, hyperparameter search or post-result tuning. This is a baseline for evaluating later candidates, not a proposed production architecture.

Each supplied fold is evaluated once, using the other four for training. The vocabulary is built from training text only. Runnable assertions prohibit hotel overlap and normalized exact-text overlap between train and test. All 1,600 rows receive an out-of-fold prediction. Duplicates stay within their original folds; repeated test entries still contribute separately to these descriptive metrics. Separate sentiment experiments train and test within that sentiment. The corpus has balanced classes, so an always-web-review baseline scores 50%.

The positive class means **commissioned fabrication**; the comparison class means **assumed truthful web review**. A false positive below means disagreement with that comparison label, not independently verified harm to a genuine reviewer.

## Results

| Experiment | Reviews | Accuracy | Fabrication precision | Fabrication recall | Web-review false positives |
|---|---:|---:|---:|---:|---:|
| Pooled sentiments | 1,600 | 85.19% | 85.50% | 84.75% | 115 / 800 (14.38%) |
| Positive sentiment only | 800 | 89.38% | 87.59% | 91.75% | 52 / 400 (13.00%) |
| Negative sentiment only | 800 | 83.88% | 81.73% | 87.25% | 78 / 400 (19.50%) |

Pooled confusion counts: 685 correctly predicted web reviews, 115 web reviews predicted fabricated, 122 commissioned fabrications predicted web reviews, and 678 correctly predicted commissioned fabrications. Pooled fold accuracy ranges from 80.00% to 89.06%. These are constructed-task measurements; balanced class prevalence does not match real listings and precision is not transferable to another prevalence.

## Decision

The model separates the constructed classes better than the constant baseline, but its comparison-label error is substantial. Acquisition source is confounded with class: paid crowdworkers versus mined web reviews. Hotel-disjoint evaluation cannot remove that confound. It also cannot establish generalization to doctors, Hindi/Hinglish, current AI writing, pressured genuine patients or real review campaigns. The web class itself lacks independent truth verification.

Do not expose these predictions as fraud probabilities or use them to remove votes, penalize doctors or estimate clinical quality. A neural model beating these figures would still need representative, independently justified target-domain labels and doctor-disjoint evaluation under [rating-validation.md](rating-validation.md). No such reference set exists in this project yet.

## Reproduce

Run from the repository root with the privately held audited ZIP at `data/ott/op_spam_v1.4.zip`:

```powershell
python research/ott-baseline.py --self-test
python research/ott-baseline.py
```

The script verifies the original ZIP hash, prints aggregate metrics only and retains trained parameters only in process memory. The self-test checks class separation and unseen-token handling. Original source authors: Myle Ott, Yejin Choi, Claire Cardie and Jeffrey T. Hancock ([2011 paper](https://aclanthology.org/P11-1032/)); Myle Ott, Claire Cardie and Jeffrey T. Hancock ([2013 paper](https://aclanthology.org/N13-1053/)). No downloaded code is executed.
