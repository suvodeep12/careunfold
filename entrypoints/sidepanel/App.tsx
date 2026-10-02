import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { analyze, MAX_FILE_BYTES, parseDataset, type Dataset, type Review } from '../../lib/analysis';
import { demo } from '../../lib/demo';

const stars = (value: number | null) => value === null ? '—' : value.toFixed(2);
function downloadExample() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(demo, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'careunfold-example.synthetic.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ReviewEntry({ review, weight = 1 }: { review: Review; weight?: number }) {
  return <li className="review-entry">
    <div className="entry-heading"><strong>{review.id}</strong><span>{review.rating}/5 · {weight === 1 ? '1 vote' : `${weight.toFixed(3)} vote`}</span></div>
    <p>{review.text || 'No written text supplied.'}</p>
    <small>{review.date ?? 'Date unknown'}{review.edited ? ' · edited (excluded from date pattern)' : ''}
      {review.translated ? ' · translated' : ''}{review.truncated ? ' · incomplete text' : ''}</small>
  </li>;
}

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(demo);
  const [combine, setCombine] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const result = useMemo(() => dataset ? analyze(dataset) : null, [dataset]);
  const shownRating = combine ? result?.adjustedRating ?? null : result?.originalRating ?? null;

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setError('');
    if (file.size > MAX_FILE_BYTES) { setError('This file exceeds 2 MB. Import a smaller JSON sample. Your current sample is unchanged.'); return; }
    setBusy(true);
    try {
      const raw: unknown = JSON.parse(await file.text());
      setDataset(parseDataset(raw));
      setCombine(true);
    } catch (failure) {
      const message = failure instanceof SyntaxError ? 'The file is not valid JSON. Check its syntax or download the example.'
        : failure instanceof Error ? failure.message : 'The file could not be read. Try another JSON file.';
      setError(message + ' Your current sample is unchanged.');
    } finally { setBusy(false); }
  }

  function loadDemo() { setDataset(demo); setCombine(true); setError(''); }
  function clear() { setDataset(null); setCombine(true); setError(''); }

  return <div className="app">
    <header className="toolbar">
      <a className="wordmark" href="#main" aria-label="CareUnfold, skip to results"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 3h10l4 4v14H5zM9 10h6M9 14h6M9 18h3" /></svg>CareUnfold<span className="prototype">prototype</span></a>
      <button className="primary small" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Reading…' : 'Import JSON'}</button>
      <input ref={input} className="visually-hidden" type="file" accept=".json,application/json" aria-label="Import review JSON file" disabled={busy} onChange={importFile} />
    </header>
    <main id="main">
      {error && <div className="error" role="alert"><strong>Import needs attention</strong><p>{error}</p></div>}
      {busy && <p role="status" className="status">Reading and checking your file on this device…</p>}
      {!dataset || !result ? <section className="empty">
        <h1>See what changes the rating.</h1>
        <p>Import a review sample to compare its average with a transparent adjustment for exact repeated wording.</p>
        <button className="primary" disabled={busy} onClick={() => input.current?.click()}>Import a JSON sample</button>
        <button className="secondary" disabled={busy} onClick={loadDemo}>Explore the synthetic example</button>
        <p className="muted">Up to 1,000 entries · 2 MB · processed locally</p>
      </section> : <>
        <div className={`source-note ${dataset.source === 'synthetic' ? 'synthetic' : ''}`}>
          <strong>{dataset.source === 'synthetic' ? 'Synthetic demonstration' : 'User-imported sample'}</strong>
          <span>{dataset.source === 'synthetic' ? 'Invented reviews and totals. No real clinic is assessed.' : 'Source details are supplied by the file and have not been verified.'}</span>
        </div>
        <section className="introduction">
          <h1>{dataset.name}</h1>
          <p className="coverage">{dataset.reviews.length} {dataset.totalReviews !== undefined ? `of ${dataset.totalReviews} declared reviews` : 'reviews supplied; total unknown'} · {dataset.sampling === 'complete' ? 'Declared complete sample' : dataset.sampling === 'selected' ? 'Selected sample' : 'Selection method unknown'}</p>
        </section>
        <section className="rating-sheet" aria-labelledby="rating-title">
          <h2 id="rating-title">{combine ? 'Adjusted sample rating' : 'Original sample average'}</h2>
          <div className="rating-comparison" aria-live="polite" aria-atomic="true">
            <div className="rating-main"><strong>{stars(shownRating)}</strong><span>out of 5</span></div>
            <div className="rating-original"><span>Original sample</span><strong>{stars(result.originalRating)}<small> / 5</small></strong></div>
          </div>
          <p className="rating-caption">{!dataset.reviews.length ? 'No ratings to calculate yet.' : combine && result.wordingGroups ? `${result.combinedEntries} entries combined into ${result.wordingGroups} ${result.wordingGroups === 1 ? 'vote' : 'votes'}; ${result.effectiveVotes} effective votes in total.` : 'Every supplied review has one vote.'}</p>
        </section>
        <div className="adjustment-control">
          <label><input type="checkbox" checked={combine} onChange={e => setCombine(e.target.checked)} />Combine exact wording matches</label>
          <p>One combined vote per matching group. All other entries keep one vote.</p>
        </div>
        <p className="boundary">This is a sample adjustment, not the clinic’s true rating or a measure of medical quality. Repeated wording can have legitimate explanations.</p>
        <section className="evidence" aria-labelledby="evidence-title">
          <div className="section-heading"><h2 id="evidence-title">Inspect the evidence</h2><span>{result.wordingGroups} wording {result.wordingGroups === 1 ? 'group' : 'groups'}</span></div>
          {!result.findings.length && <div className="no-pattern"><strong>No patterns met these rules.</strong><p>{dataset.reviews.length ? 'The adjusted average equals the original. This does not establish that the reviews are genuine.' : 'Import at least one rated review to calculate a sample average.'}</p></div>}
          {result.findings.map(f => <details key={`${f.kind}:${f.ids.join(',')}`} className="finding">
            <summary><strong>{f.kind === 'wording' ? 'Wording' : 'Dates'}: {f.title}</strong><svg aria-hidden="true" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg></summary>
            <div className="finding-body"><p>{f.explanation}</p>
              <p className="effect">{f.kind === 'wording' ? combine ? `Combined weight: 1 vote. The group’s mean star rating contributes to the adjusted average.` : 'Adjustment is off. These entries each have one vote.' : 'Context only. This date pattern does not change the rating.'}</p>
              <ul className="review-list">{f.ids.map(id => { const r = dataset.reviews.find(r => r.id === id)!; return <ReviewEntry key={id} review={r} weight={f.kind === 'wording' && combine ? 1 / f.ids.length : 1} />; })}</ul>
            </div>
          </details>)}
        </section>
        <details className="method"><summary>How this adjustment works</summary>
          <p>Matching uses the entire text after Unicode, case and whitespace normalization. A group must contain at least two entries with at least 40 characters each. Short praise and incomplete text are not combined.</p>
          <p>Original and translated texts are grouped separately. Translated matches may reflect translation rather than the original authors’ wording.</p>
          <p>Each group contributes its mean stars as one vote. Add those votes to all ungrouped stars, then divide by the number of effective votes. No entry is labeled fake.</p>
          <p>These prototype thresholds are not validated authenticity rules. This sample may differ from the rest of the listing; we do not calculate a listing-wide corrected rating.</p>
        </details>
        <details className="method"><summary>Sample limitations and reviewer context</summary>
          <dl className="context-list">
            <div><dt>Known reviewer totals</dt><dd>{result.knownCounts} of {dataset.reviews.length}</dd></div>
            <div><dt>One or two total reviews</dt><dd>{result.lowCounts} of {result.knownCounts} known</dd></div>
            <div><dt>Usable reported dates</dt><dd>{result.datedEntries} of {dataset.reviews.length}</dd></div>
            <div><dt>Empty / incomplete text</dt><dd>{result.emptyText} / {result.truncated}</dd></div>
            <div><dt>Translated / edited</dt><dd>{result.translated} / {result.edited}</dd></div>
          </dl>
          <p>Reviewer totals do not reveal account age. Small totals, positive stars, polished language and reported-date concentrations do not reduce weight.</p>
          <p>Dates are supplied by the import; we do not verify them. Four entries on the same reported day produce a context finding, not a fraud verdict.</p>
        </details>
        <details className="method"><summary>All {dataset.reviews.length} supplied reviews</summary><ul className="review-list">{dataset.reviews.map(r => <ReviewEntry key={r.id} review={r} />)}</ul><p>This list shows original votes. Adjusted weights appear inside wording groups above.</p></details>
        <div className="sample-actions"><button disabled={busy} onClick={loadDemo}>Load demo</button><button disabled={busy} onClick={clear}>Clear sample</button></div>
      </>}
      <footer>
        <p><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M4 7V5a4 4 0 0 1 8 0v2M3 7h10v7H3zM8 10v2" /></svg>Local only. No uploads, tracking or saved review data.</p>
        <p>Reloading clears imported data and restores the synthetic demo.</p>
        <button className="text-button" onClick={downloadExample}>Download example JSON</button>
      </footer>
    </main>
  </div>;
}
