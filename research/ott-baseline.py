"""Local exploratory benchmark; no model weights or review text are written."""
import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re
import unicodedata
import zipfile

SOURCE_HASH = 'e3a61b3709ccaca842aeec7f525e273988cf3b1bab35151712cf89759a6724fa'


def tokens(text):
    return Counter(re.findall(r"[a-z]+(?:'[a-z]+)?", text.casefold()))


def train(rows):
    counts = [Counter(), Counter()]
    documents = [0, 0]
    for row in rows:
        label = row['label']
        documents[label] += 1
        counts[label].update(row['tokens'])
    if not all(documents):
        raise ValueError('Both training classes are required')
    vocabulary = set(counts[0]) | set(counts[1])
    denominators = [sum(counts[c].values()) + len(vocabulary) for c in (0, 1)]
    priors = [math.log(n / sum(documents)) for n in documents]
    weights = [{w: math.log((counts[c][w] + 1) / denominators[c]) for w in vocabulary} for c in (0, 1)]
    return priors, weights


def predict(model, words):
    priors, weights = model
    scores = [priors[c] + sum(n * weights[c].get(w, 0) for w, n in words.items()) for c in (0, 1)]
    return int(scores[1] > scores[0])


def evaluate(rows):
    folds = []
    confusion = Counter()
    for fold in sorted({r['fold'] for r in rows}):
        training = [r for r in rows if r['fold'] != fold]
        testing = [r for r in rows if r['fold'] == fold]
        assert not {r['hotel'] for r in training} & {r['hotel'] for r in testing}
        assert not {r['normalized'] for r in training} & {r['normalized'] for r in testing}
        model = train(training)
        current = Counter((r['label'], predict(model, r['tokens'])) for r in testing)
        confusion.update(current)
        folds.append({'fold': fold, 'n': len(testing), 'accuracy': (current[0, 0] + current[1, 1]) / len(testing)})
    tn, fp, fn, tp = (confusion[k] for k in ((0, 0), (0, 1), (1, 0), (1, 1)))
    return {'n': len(rows), 'tn': tn, 'fp': fp, 'fn': fn, 'tp': tp,
            'accuracy': (tn + tp) / len(rows), 'fabrication_precision': tp / (tp + fp) if tp + fp else None,
            'fabrication_recall': tp / (tp + fn) if tp + fn else None,
            'web_review_false_positive_rate': fp / (fp + tn), 'folds': folds}


def load(path):
    if hashlib.sha256(path.read_bytes()).hexdigest() != SOURCE_HASH:
        raise ValueError('Corpus hash differs from the audited original release')
    rows = []
    with zipfile.ZipFile(path) as archive:
        for entry in archive.infolist():
            if not entry.filename.endswith('.txt'):
                continue
            parts = entry.filename.split('/')
            match = re.fullmatch(r'([td])_([a-z]+)_(\d+)\.txt', parts[-1])
            if len(parts) != 5 or not match or parts[3] not in {f'fold{i}' for i in range(1, 6)}:
                raise ValueError('Unexpected corpus schema')
            text = archive.read(entry).decode('utf-8')
            rows.append({'label': int(match[1] == 'd'), 'hotel': match[2], 'fold': parts[3],
                         'sentiment': parts[1], 'tokens': tokens(text),
                         'normalized': ' '.join(unicodedata.normalize('NFKC', text).casefold().split())})
    if len(rows) != 1600:
        raise ValueError('Unexpected corpus size')
    return rows


def self_test():
    model = train([{'label': 0, 'tokens': tokens('room room quiet')}, {'label': 1, 'tokens': tokens('amazing amazing perfect')}])
    assert predict(model, tokens('quiet room')) == 0
    assert predict(model, tokens('amazing perfect')) == 1
    assert predict(model, tokens('unknown')) == predict(model, Counter())
    print('Self-test passed')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--corpus', type=Path, default=Path('data/ott/op_spam_v1.4.zip'))
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        self_test()
    else:
        rows = load(args.corpus)
        # ponytail: fixed unigram baseline; no tuning or production authenticity claims.
        print(json.dumps({'source_sha256': SOURCE_HASH, 'model': 'unigram multinomial naive Bayes, alpha=1',
                          'evaluation': 'supplied hotel-disjoint five folds; training-only vocabulary',
                          'majority_baseline_accuracy': 0.5,
                          'pooled': evaluate(rows),
                          'positive': evaluate([r for r in rows if r['sentiment'] == 'positive_polarity']),
                          'negative': evaluate([r for r in rows if r['sentiment'] == 'negative_polarity'])}, indent=2))
