import { useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import { analyze, type Dataset } from '../../lib/analysis';
import { isMapsPage, MAPS_SITE, parseLoadedPlaces, type MapsPlace } from '../../lib/maps-dom';
import type { MapsCapture } from '../../lib/maps-loader';

type Row = { place: MapsPlace; capture?: MapsCapture | null; error?: string; capturedAt?: string };
const stars = (n: number | null | undefined) => n == null ? '—' : n.toFixed(2);

export function Listing({ row }: { row: Row }) {
  const { place, capture } = row;
  const sample: Dataset = { name: place.name, source: 'google-maps', sampling: 'selected', reviews: capture?.reviews ?? [] };
  const result = analyze(sample);
  return <li className="maps-listing">
    <h2><a href={place.url} target="_blank" rel="noreferrer">{place.name}</a></h2>
    <dl className="maps-ratings">
      <div><dt>Google listing</dt><dd>{stars(place.rating)}<small> / 5</small></dd></div>
      <div><dt>Captured sample</dt><dd>{stars(result.originalRating)}<small> / 5</small></dd></div>
      <div><dt>Adjusted sample</dt><dd>{stars(result.adjustedRating)}<small> / 5</small></dd></div>
    </dl>
    <p className="coverage">{capture ? `${capture.reviews.length} captured ratings` : row.error ? 'No sample available' : 'Waiting for reviews'}{place.totalReviews !== undefined ? ` · ${place.totalReviews} Google-listed reviews` : ' · listing total unknown'}</p>
    {row.error && <p className="boundary">{row.error}</p>}
    {capture && <>
      <p className="boundary">{!capture.reviews.length ? 'Reviews unavailable in this page session. No adjusted rating is calculated.' : `${result.effectiveVotes} effective votes; ${result.combinedEntries} entries in ${result.wordingGroups} exact-wording groups. This is a selected sample sensitivity scenario, not the doctor’s true rating or clinical quality.`}</p>
      <p className="coverage">{capture.sort === 'newest-confirmed' ? 'Newest sort confirmed' : 'Sort unknown'} · {capture.stopped === 'limit' ? 'Review limit reached' : capture.stopped === 'stalled' ? 'Loading stalled; coverage may be incomplete' : capture.stopped === 'timeout' ? 'Time limit reached; coverage incomplete' : capture.stopped === 'identity-changed' ? 'Listing changed; sample discarded' : capture.stopped === 'unsupported' ? 'Page layout or sort unsupported' : 'Reviews not accessible'}{row.capturedAt ? ` · ${new Date(row.capturedAt).toLocaleTimeString()}` : ''}</p>
      {!!capture.reviews.length && <details className="method"><summary>Evidence and all {capture.reviews.length} captured ratings</summary>
        <p>Exact full displayed texts of at least 40 characters share one mean-star vote. Known original, translated and unknown translation statuses stay separate. Incomplete or unknown-completeness text keeps its original vote. Other reviews each retain one vote.</p>
        {result.findings.map(f => <p key={f.ids.join(',')}>{f.title}. {f.explanation} Supporting sample entries: {f.ids.map(id => capture.reviews.findIndex(r => r.id === id) + 1).join(', ')}.</p>)}
        {!result.wordingGroups && <p>No exact-wording groups met the rule. An unchanged average does not establish authenticity.</p>}
        <ul className="review-list">{capture.reviews.map((review, index) => <li key={review.id} className="review-entry"><div className="entry-heading"><strong>Sample entry {index + 1}</strong><span>{review.rating}/5</span></div><p>{review.text || 'Rating without written text.'}</p><small>{review.reportedDate ?? 'Date unknown'} · {review.translated === null ? 'translation status unknown' : review.translated ? 'translated' : 'original'} · {review.truncated === null ? 'text completeness unknown' : review.truncated ? 'incomplete text' : 'complete displayed text'} · {review.edited === null ? 'edit status unknown' : review.edited ? 'edited' : 'not edited'}</small></li>)}</ul>
      </details>}
    </>}
  </li>;
}

export default function MapsComparison() {
  const installed = location.protocol === 'chrome-extension:';
  const [depth, setDepth] = useState('');
  const [status, setStatus] = useState('Choose a review limit, then enable a session on your Maps search tab.');
  const [error, setError] = useState('');
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const port = useRef<ReturnType<typeof browser.runtime.connect> | null>(null);
  const startup = useRef(0);
  function connectPanel() {
    if (port.current) return port.current;
    const connection = browser.runtime.connect({ name: 'careunfold:panel' });
    port.current = connection;
    connection.onMessage.addListener(message => {
      if (message?.kind === 'listings') {
        try {
          const places = parseLoadedPlaces(message.places);
          setRows(old => places.map(place => message.keepKeys?.includes(place.key) ? { ...old.find(r => r.place.key === place.key), place } : { place }));
          setStatus(places.length ? `${places.length} loaded listings. Review evidence is being checked separately.` : 'No supported search cards loaded. Search for doctors in your source Maps tab.');
        } catch { setError('The loaded results could not be read. Stop and reconnect on a Maps search.'); }
      } else if (message?.kind === 'review') {
        setRows(old => old.map(row => row.place.key === message.place?.key ? { ...row, capture: message.capture, error: message.error, capturedAt: message.capturedAt } : row));
      } else if (message?.kind === 'watching') {
        setStarting(false); setActive(true); setStatus('Watching already-loaded results. Search results will never be scrolled automatically.');
      } else if (message?.kind === 'loading') setStatus(`Loading reviews for ${message.count} listings, one at a time…`);
      else if (message?.kind === 'idle') setStatus(message.count ? 'Current batch finished. Watching for changes to loaded results.' : 'No supported search cards loaded. Search for doctors in your source Maps tab.');
      else if (message?.kind === 'stopped') { setStarting(false); setActive(false); setStatus(message.message); }
      else if (message?.kind === 'problem') { setStarting(false); setActive(false); setError(message.message); }
    });
    connection.onDisconnect.addListener(() => {
      if (port.current !== connection) return;
      startup.current++;
      port.current = null; setStarting(false); setActive(false); setStatus('The extension session disconnected. Enable a new session to reconnect.');
    });
    return connection;
  }
  useEffect(() => {
    if (!installed) return;
    connectPanel();
    return () => { startup.current++; const connection = port.current; port.current = null; connection?.disconnect(); };
  }, [installed]);

  async function start() {
    setError('');
    if (!installed) { setError('Live Maps sessions need the installed extension. This browser preview can show the interface only.'); return; }
    if (!depth) return;
    const attempt = ++startup.current;
    setStarting(true);
    try {
      const connection = connectPanel();
      // Request from this button's user gesture, before other asynchronous work.
      const allowed = await browser.permissions.request({ origins: [MAPS_SITE] });
      if (attempt !== startup.current) return;
      if (!allowed) throw new Error('Site access was declined. Enable it to read your Maps search.');
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (attempt !== startup.current) return;
      if (tab?.id === undefined || !isMapsPage(tab.url ?? '')) throw new Error('Open a Google Maps search tab, then enable this session there.');
      connection.postMessage({ kind: 'start', sourceTabId: tab.id, limit: depth === '100' ? 100 : Number.MAX_SAFE_INTEGER });
    } catch (failure) { if (attempt === startup.current) { setStarting(false); setError(failure instanceof Error ? failure.message : 'Maps could not start.'); } }
  }
  function stop() { startup.current++; port.current?.postMessage({ kind: 'stop' }); setActive(false); setStarting(false); }
  return <section className="maps-comparison" aria-labelledby="maps-title">
    <h1 id="maps-title">Compare loaded doctors</h1>
    <p className="boundary">Google’s listing rating and your captured sample are different measures. The adjustment checks exact repeated wording; it cannot establish genuine reviews or medical competence.</p>
    <label className="maps-depth" htmlFor="review-depth">Review limit per listing<select id="review-depth" value={depth} disabled={active || starting} onChange={event => setDepth(event.target.value)}><option value="">Choose a review limit</option><option value="100">Up to 100 newest reviews</option><option value="all">Attempt all available reviews</option></select></label>
    <p className="coverage">A stalled page or 90-second collection deadline can leave either option incomplete. No completeness is inferred.</p>
    <div className="maps-actions"><button className="primary" disabled={!depth || active || starting} onClick={start}>{starting ? 'Connecting…' : 'Enable on this Maps tab'}</button><button disabled={!active && !starting} onClick={stop}>Stop</button></div>
    <p className="boundary">Requires optional Google site access. Chrome grants access to the Google origin; CareUnfold reads Maps paths only. One temporary review tab is reused. Closing this panel stops collection; reloading Maps requires reconnection.</p>
    {!installed && <p className="source-note">Browser preview only. Live collection requires the installed extension.</p>}
    {error && <div className="error" role="alert"><strong>Maps needs attention</strong><p>{error}</p></div>}
    <p className="status maps-status" role="status">{status}</p>
    <ol className="maps-list">{rows.map(row => <Listing key={row.place.key} row={row} />)}</ol>
  </section>;
}
