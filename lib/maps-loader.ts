import { mapsPlaceIdentity, readLoadedMapsReviews, type MapsReview } from './maps-dom';

export type MapsCapture = {
  reviews: MapsReview[];
  sort: 'newest-confirmed' | 'unknown';
  stopped: 'limit' | 'stalled' | 'timeout' | 'unavailable' | 'unsupported' | 'identity-changed';
  problem?: string;
};

export function parseMapsCapture(raw: unknown, limit: number): MapsCapture {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid review capture.');
  const value = raw as Record<string, unknown>;
  if (value.problem !== undefined && (typeof value.problem !== 'string' || !value.problem.trim() || value.problem.length > 180)) throw new Error('Invalid capture problem.');
  if (!Array.isArray(value.reviews) || value.reviews.length > limit || !['newest-confirmed', 'unknown'].includes(String(value.sort))
    || !['limit', 'stalled', 'timeout', 'unavailable', 'unsupported', 'identity-changed'].includes(String(value.stopped))) throw new Error('Invalid review capture metadata.');
  const ids = new Set<string>();
  const reviews = value.reviews.map((r: Record<string, unknown>): MapsReview => {
    if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !r.id.trim() || r.id.length > 500 || ids.has(r.id)
      || typeof r.text !== 'string' || r.text.length > 8000 || typeof r.rating !== 'number' || !Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5
      || (r.reportedDate !== undefined && (typeof r.reportedDate !== 'string' || r.reportedDate.length > 100))
      || (r.reviewerReviewCount !== undefined && (typeof r.reviewerReviewCount !== 'number' || !Number.isSafeInteger(r.reviewerReviewCount) || r.reviewerReviewCount < 1))
      || ['translated', 'truncated', 'edited'].some(key => r[key] !== null && typeof r[key] !== 'boolean')) throw new Error('Invalid captured review.');
    ids.add(r.id);
    return { id: r.id, text: r.text, rating: r.rating, reportedDate: r.reportedDate as string | undefined,
      reviewerReviewCount: r.reviewerReviewCount as number | undefined, translated: r.translated as boolean | null,
      truncated: r.truncated as boolean | null, edited: r.edited as boolean | null };
  });
  return { reviews, sort: value.sort as MapsCapture['sort'], stopped: value.stopped as MapsCapture['stopped'], ...(value.problem === undefined ? {} : { problem: value.problem as string }) };
}

function pause(ms: number, signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const finish = () => { signal.removeEventListener('abort', abort); resolve(); };
    const timer = setTimeout(finish, ms);
    const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(signal.reason); };
    signal.addEventListener('abort', abort, { once: true });
  });
}

// The caller supplies an explicit review limit; there is no implicit production default.
// Only the owned review tab is changed. Search feeds are never scrolled.
export async function collectMapsReviews(
  doc: Document, currentUrl: () => string, expectedKey: string, limit: number, signal: AbortSignal,
): Promise<MapsCapture> {
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Provide a positive whole review limit.');
  const result: MapsCapture = { reviews: [], sort: 'unknown', stopped: 'unavailable' };
  const samePlace = () => mapsPlaceIdentity(currentUrl())?.key === expectedKey;
  if (!samePlace()) return { ...result, stopped: 'identity-changed' };
  signal.throwIfAborted();
  // Native load completion can precede Maps rendering its listing controls.
  const findTab = () => doc.querySelector<HTMLButtonElement>('[role="main"] button[role="tab"][aria-label^="Reviews for "]');
  let tab = findTab();
  const controlsBy = Date.now() + 10_000;
  while (!tab && Date.now() < controlsBy) {
    await pause(250, signal);
    if (!samePlace()) return { ...result, stopped: 'identity-changed' };
    tab = findTab();
  }
  if (!tab) return { ...result, stopped: 'unsupported', problem: 'The Reviews tab did not appear within 10 seconds.' };
  // Wait for a selected full-review tab rather than treating overview previews as history.
  const readyBy = Date.now() + 10_000;
  let lastClick = -Infinity;
  while (Date.now() < readyBy) {
    signal.throwIfAborted();
    if (!samePlace()) return { ...result, stopped: 'identity-changed' };
    tab = findTab() ?? tab;
    // Maps can render a control before its handlers are ready or replace it during startup.
    // Retry only an unselected, connected control within the existing bounded wait.
    if (tab.isConnected && !tab.disabled && tab.getAttribute('aria-selected') !== 'true' && Date.now() - lastClick >= 1000) {
      lastClick = Date.now();
      tab.click();
    }
    if (tab.isConnected && tab.getAttribute('aria-selected') === 'true' && tab.closest('[role="main"]')?.querySelector('button[aria-label="Sort reviews"]')) break;
    await pause(250, signal);
  }
  if (!tab.isConnected || tab.getAttribute('aria-selected') !== 'true') return { ...result, problem: 'The Reviews tab was unavailable or did not become selected within 10 seconds.' };
  const main = tab.closest<HTMLElement>('[role="main"]');
  const sort = main?.querySelector<HTMLButtonElement>('button[aria-label="Sort reviews"]');
  if (!main || !sort) return { ...result, stopped: 'unsupported', problem: 'The review sorting control did not appear within 10 seconds.' };
  sort.click();
  const sortBy = Date.now() + 5000;
  let newest: HTMLElement | undefined;
  while (Date.now() < sortBy && !newest) {
    signal.throwIfAborted();
    if (!samePlace()) return { ...result, stopped: 'identity-changed' };
    newest = [...doc.querySelectorAll<HTMLElement>('[role="menuitemradio"]')].find(e => e.textContent?.trim() === 'Newest');
    if (!newest) await pause(250, signal);
  }
  if (!newest) return { ...result, stopped: 'unsupported', problem: 'The Newest sorting option did not appear within 5 seconds.' };
  newest.click();
  const confirmedBy = Date.now() + 5000;
  while (Date.now() < confirmedBy) {
    signal.throwIfAborted();
    if (!samePlace()) return { ...result, stopped: 'identity-changed' };
    const confirmed = [...doc.querySelectorAll('[aria-live]')].some(e => e.textContent?.trim() === 'The reviews are now sorted from newest to oldest.');
    if (confirmed) { result.sort = 'newest-confirmed'; break; }
    await pause(250, signal);
  }
  // A clicked control alone does not prove which sort produced the sample.
  if (result.sort === 'unknown') return { ...result, stopped: 'unsupported', problem: 'Newest sorting was not confirmed within 5 seconds.' };

  const reviews = new Map<string, MapsReview>();
  const stopBy = Date.now() + 90_000;
  let lastProgress = Date.now();
  // ponytail: DOM layouts/locales can change; fail closed and add observed adapters when needed.
  while (Date.now() < stopBy) {
    signal.throwIfAborted();
    if (!samePlace() || !main.isConnected || tab.getAttribute('aria-selected') !== 'true') return { ...result, reviews: [], stopped: 'identity-changed' };
    // Expand patient text only; owner replies and translation controls are left alone.
    for (const button of main.querySelectorAll<HTMLButtonElement>('.jftiEf .MyEned button[aria-expanded="false"][aria-label="See more"]')) button.click();
    for (const review of readLoadedMapsReviews(main)) {
      const old = reviews.get(review.id);
      if (!old && reviews.size >= limit) break;
      if (!old || old.text !== review.text || old.truncated !== review.truncated) lastProgress = Date.now();
      reviews.set(review.id, review);
    }
    result.reviews = [...reviews.values()];
    if (reviews.size >= limit) return { ...result, stopped: 'limit' };
    const card = main.querySelector<HTMLElement>('.jftiEf[data-review-id]');
    // Scroll only a review card's scrollable ancestor inside this main panel.
    let scroller = card?.parentElement;
    while (scroller && main.contains(scroller) && scroller.scrollHeight <= scroller.clientHeight) scroller = scroller.parentElement;
    if (Date.now() - lastProgress >= 10_000) return reviews.size ? { ...result, stopped: 'stalled',
      problem: `No progress for 10 seconds: ${reviews.size} captured ratings, ${main.querySelectorAll('.jftiEf[data-review-id]').length} rendered cards. ${scroller && main.contains(scroller) ? `Scroll position ${Math.round(scroller.scrollTop)} of ${Math.max(0, Math.round(scroller.scrollHeight - scroller.clientHeight))} pixels.` : 'No scrollable review ancestor found.'}` }
      : { ...result, stopped: 'unavailable', problem: card
        ? 'Review cards appeared, but no supported ratings were readable.' : 'No review cards appeared within 10 seconds.' };
    if (scroller && main.contains(scroller)) {
      const before = scroller.scrollTop;
      scroller.scrollTop += Math.max(scroller.clientHeight - 40, 200);
      // Traversing loaded text is progress toward the next pagination boundary.
      if (scroller.scrollTop > before) lastProgress = Date.now();
    }
    await pause(750, signal);
  }
  return { ...result, stopped: 'timeout' };
}
