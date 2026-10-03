import { analyze } from './analysis';
import type { MapsPlace } from './maps-dom';
import type { MapsCapture } from './maps-loader';

type Place = Pick<MapsPlace, 'key' | 'name' | 'rating' | 'totalReviews'>;
export type DiagnosticRow = Place & { captured?: number; original?: number | null; filtered?: number | null; excluded?: number; sort?: MapsCapture['sort']; stopped?: MapsCapture['stopped']; problem?: string; capturedAt?: string };
export type DiagnosticEvent =
  | { kind: 'diagnostics'; event: 'listings'; places: Place[]; keepKeys: string[] }
  | { kind: 'diagnostics'; event: 'review'; row: DiagnosticRow }
  | { kind: 'diagnostics'; event: 'status'; status: string };

export function diagnosticPlace(place: MapsPlace): Place {
  return { key: place.key, name: place.name, rating: place.rating, totalReviews: place.totalReviews };
}

export function diagnosticReview(place: MapsPlace, capture: MapsCapture | null, error?: string, capturedAt?: string): DiagnosticRow {
  const result = analyze({ name: place.name, source: 'google-maps', sampling: 'selected', reviews: capture?.reviews ?? [] });
  return { ...diagnosticPlace(place), captured: capture?.reviews.length, original: result.originalRating,
    filtered: result.filteredRating, excluded: result.exclusions.length, sort: capture?.sort,
    stopped: capture?.stopped, problem: capture?.problem ?? error, capturedAt };
}

// Only opt-in aggregate diagnostics enter the page. Never mirror review text or author data.
export function createMapsDiagnostics(doc: Document) {
  const host = doc.createElement('aside');
  host.id = 'careunfold-diagnostics';
  host.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483647;max-width:calc(100vw - 32px);width:560px';
  const root = host.attachShadow({ mode: 'open' });
  const style = doc.createElement('style');
  style.textContent = `:host{color:#172b45;font:14px/1.55 "Segoe UI",sans-serif}*{box-sizing:border-box}details{background:#fff;border:1px solid #d8e0eb;border-radius:12px}summary{cursor:pointer;padding:12px 16px;font-weight:600}summary:focus-visible{outline:3px solid #154fba;outline-offset:2px}summary:hover{background:#edf3ff}section{padding:0 16px 16px;max-height:55vh;overflow:auto}p{margin:8px 0}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}th,td{text-align:left;padding:8px 0;border-bottom:1px solid #d8e0eb;vertical-align:top}th{font-weight:600}td:first-child{width:38%;padding-right:12px}small{display:block;font-size:12px;color:#43556d;overflow-wrap:anywhere}::selection{background:#c5d8ff;color:#112d5d}`;
  const details = doc.createElement('details');
  const summary = doc.createElement('summary');
  summary.textContent = 'CareUnfold testing diagnostics';
  const section = doc.createElement('section');
  const note = doc.createElement('p');
  note.textContent = 'Read-only testing view. Visible to this page. Sample calculations are unverified; they are not true ratings or medical-quality scores.';
  const status = doc.createElement('p');
  status.setAttribute('role', 'status');
  status.textContent = 'Waiting for loaded results.';
  const table = doc.createElement('table');
  const caption = doc.createElement('caption');
  caption.textContent = 'Current session capture results';
  const head = doc.createElement('thead');
  const tr = doc.createElement('tr');
  for (const label of ['Listing', 'Capture and sample calculations']) {
    const th = doc.createElement('th'); th.scope = 'col'; th.textContent = label; tr.append(th);
  }
  head.append(tr);
  const body = doc.createElement('tbody');
  table.append(caption, head, body); section.append(note, status, table); details.append(summary, section); root.append(style, details); doc.body.append(host);
  let rows: DiagnosticRow[] = [];
  const rating = (value: number | null | undefined) => value == null ? 'unavailable' : value.toFixed(2);
  return {
    update(message: DiagnosticEvent) {
      if (message.event === 'status') { status.textContent = message.status; return; }
      if (message.event === 'listings') rows = message.places.map(place => message.keepKeys.includes(place.key) ? { ...rows.find(row => row.key === place.key), ...place } : place);
      else rows = rows.map(row => row.key === message.row.key ? message.row : row);
      body.replaceChildren();
      for (const row of rows) {
        const line = doc.createElement('tr');
        const name = doc.createElement('td'); name.textContent = row.name;
        const values = doc.createElement('td');
        const add = (text: string) => { const item = doc.createElement('small'); item.textContent = text; values.append(item); };
        add(`${row.captured ?? 'Waiting'} captured / ${row.totalReviews ?? 'unknown'} listed`);
        add(`Google ${rating(row.rating)} · Original sample ${rating(row.original)} · Filtered sample ${rating(row.filtered)}`);
        add(`${row.excluded ?? 'unknown'} excluded · Sort ${row.sort ?? 'unknown'} · Stop ${row.stopped ?? 'pending'}`);
        if (row.problem) add(row.problem);
        if (row.capturedAt) add(`Captured at ${row.capturedAt}`);
        line.append(name, values); body.append(line);
      }
    },
    dispose() { rows = []; host.remove(); },
  };
}
