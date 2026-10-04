import { expect, it, vi } from 'vitest';
import { parseHTML } from 'linkedom';
import { collectMapsReviews, parseMapsCapture } from './maps-loader';

const url = 'https://www.google.com/maps/place/Invented/data=!1s0x1:0x2';
function page() {
  const { document } = parseHTML(`<html><body><div role="main"><button role="tab" aria-label="Reviews for Invented" aria-selected="true"></button><button aria-label="Sort reviews"></button><div role="menu"><div role="menuitemradio" aria-checked="true">Newest</div></div></div><div aria-live="polite"></div></body></html>`);
  document.querySelector('[role="menuitemradio"]')!.addEventListener('click', () => {
    document.querySelector('[aria-live]')!.textContent = 'The reviews are now sorted from newest to oldest.';
  });
  return document;
}
const card = (id: string) => `<div class="jftiEf" data-review-id="${id}"><span class="kvMYJc" role="img" aria-label="5 stars"></span><div class="MyEned"><span class="wiI7pd">Invented review for loader testing.</span></div></div>`;

it('does not capture prior-sort cards while the announcement precedes their replacement', async () => {
  vi.useFakeTimers();
  try {
    const doc = page();
    doc.querySelector('[role="menuitemradio"]')!.setAttribute('aria-checked', 'false');
    const list = doc.createElement('div');
    list.innerHTML = card('old-a') + card('old-b');
    doc.querySelector('[role="main"]')!.append(list);
    doc.querySelector('[role="menuitemradio"]')!.addEventListener('click', () => {
      setTimeout(() => { list.innerHTML = card('new-a') + card('new-b'); }, 500);
    });
    const capture = collectMapsReviews(doc, () => url, '0x1:0x2', 2, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(6000);
    expect(await capture).toMatchObject({ sort: 'newest-confirmed', stopped: 'limit', reviews: [{ id: 'new-a' }, { id: 'new-b' }] });
  } finally { vi.useRealTimers(); }
});

it('returns no sample when a changed sort is announced but its old cards remain', async () => {
  vi.useFakeTimers();
  try {
    const doc = page();
    doc.querySelector('[role="menuitemradio"]')!.setAttribute('aria-checked', 'false');
    doc.querySelector('[role="main"]')!.insertAdjacentHTML('beforeend', card('old'));
    const capture = collectMapsReviews(doc, () => url, '0x1:0x2', 1, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(6000);
    expect(await capture).toMatchObject({ reviews: [], sort: 'unknown', stopped: 'unsupported', problem: 'The review list did not refresh after Newest was selected within 5 seconds.' });
  } finally { vi.useRealTimers(); }
});

it.each(['cancel', 'navigate'])('preserves %s while waiting for the sorted list to refresh', async action => {
  vi.useFakeTimers();
  try {
    const doc = page();
    doc.querySelector('[role="menuitemradio"]')!.setAttribute('aria-checked', 'false');
    doc.querySelector('[role="main"]')!.insertAdjacentHTML('beforeend', card('old'));
    let current = url;
    const controller = new AbortController();
    const capture = collectMapsReviews(doc, () => current, '0x1:0x2', 1, controller.signal);
    if (action === 'cancel') {
      const rejected = expect(capture).rejects.toThrow('Stop during sorting');
      controller.abort(new Error('Stop during sorting'));
      await rejected;
    } else {
      current = 'https://www.google.com/maps/place/Other/data=!1s0x3:0x4';
      await vi.advanceTimersByTimeAsync(250);
      expect(await capture).toMatchObject({ reviews: [], sort: 'unknown', stopped: 'identity-changed' });
    }
  } finally { vi.useRealTimers(); }
});

it('validates capture messages and preserves unknown flags at the analysis boundary', () => {
  const review = { id: 'test', text: 'Invented review', rating: 4, translated: null, truncated: false, edited: null };
  const capture = { reviews: [review], sort: 'newest-confirmed', stopped: 'limit' };
  expect(parseMapsCapture(capture, 1).reviews[0]!.translated).toBeNull();
  expect(parseMapsCapture({ ...capture, problem: 'Review controls did not appear.' }, 1).problem).toBe('Review controls did not appear.');
  for (const problem of [42, '', 'x'.repeat(181)]) expect(() => parseMapsCapture({ ...capture, problem }, 1)).toThrow();
  for (const bad of [null, { ...capture, sort: 'verified-real' }, { ...capture, reviews: [review, review] }, { ...capture, reviews: [{ ...review, rating: '5' }] }, { ...capture, reviews: [{ ...review, translated: undefined }] }]) expect(() => parseMapsCapture(bad, 2)).toThrow();
  expect(() => parseMapsCapture(capture, 0)).toThrow();
});

it('uses an explicit limit and reads full-review cards only after sort confirmation', async () => {
  const doc = page();
  doc.querySelector('[role="main"]')!.insertAdjacentHTML('beforeend', card('a') + card('b') + card('c'));
  doc.body.insertAdjacentHTML('beforeend', card('unrelated'));
  const captured = await collectMapsReviews(doc, () => url, '0x1:0x2', 2, new AbortController().signal);
  expect(captured.sort).toBe('newest-confirmed');
  expect(captured.stopped).toBe('limit');
  expect(captured.reviews.map(r => r.id)).toEqual(['a', 'b']);
  await expect(collectMapsReviews(doc, () => url, '0x1:0x2', 0, new AbortController().signal)).rejects.toThrow('limit');
});

it.each([{ limit: 2, stopped: 'limit' }, { limit: 3, stopped: 'stalled' }])('traverses tall reviews, then stops at $stopped', async ({ limit, stopped }) => {
  vi.useFakeTimers();
  try {
    const doc = page();
    const scroller = doc.createElement('div');
    scroller.innerHTML = card('first');
    doc.querySelector('[role="main"]')!.append(scroller);
    let top = 0;
    Object.defineProperties(scroller, {
      clientHeight: { value: 200 },
      scrollHeight: { value: 4200 },
      scrollTop: {
        get: () => top,
        set: (value: number) => {
          top = Math.min(value, 4000);
          if (top === 4000 && !scroller.querySelector('[data-review-id="next"]')) scroller.insertAdjacentHTML('beforeend', card('next'));
        },
      },
    });
    const capture = collectMapsReviews(doc, () => url, '0x1:0x2', limit, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(await capture).toMatchObject({ stopped, reviews: [{ id: 'first' }, { id: 'next' }] });
  } finally { vi.useRealTimers(); }
});

it('reports missing review entries and preserves cancellation', async () => {
  vi.useFakeTimers();
  try {
    const capture = collectMapsReviews(page(), () => url, '0x1:0x2', 2, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(11_000);
    expect(await capture).toEqual({ reviews: [], sort: 'newest-confirmed', stopped: 'unavailable', problem: 'No review cards appeared within 10 seconds.' });
    const controller = new AbortController();
    const aborted = expect(collectMapsReviews(page(), () => url, '0x1:0x2', 2, controller.signal)).rejects.toThrow('Stop requested');
    controller.abort(new Error('Stop requested'));
    await aborted;
  } finally { vi.useRealTimers(); }
});

it('discards the sample if a page changes to another listing during loading', async () => {
  vi.useFakeTimers();
  try {
    let current = url;
    const doc = page();
    doc.querySelector('[role="main"]')!.insertAdjacentHTML('beforeend', card('a'));
    const capture = collectMapsReviews(doc, () => current, '0x1:0x2', 2, new AbortController().signal);
    current = 'https://www.google.com/maps/place/Other/data=!1s0x3:0x4';
    await vi.advanceTimersByTimeAsync(1000);
    expect(await capture).toEqual({ reviews: [], sort: 'newest-confirmed', stopped: 'identity-changed' });
  } finally { vi.useRealTimers(); }
});

it('waits for Maps to render review controls after document load', async () => {
  vi.useFakeTimers();
  try {
    const { document } = parseHTML('<html><body><div role="main"></div></body></html>');
    const capture = collectMapsReviews(document, () => url, '0x1:0x2', 1, new AbortController().signal);
    setTimeout(() => {
      document.body.innerHTML = page().body.innerHTML;
      document.querySelector('[role="menuitemradio"]')!.addEventListener('click', () => {
        document.querySelector('[aria-live]')!.textContent = 'The reviews are now sorted from newest to oldest.';
      });
      document.querySelector('[role="main"]')!.insertAdjacentHTML('beforeend', card('delayed'));
    }, 500);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await capture).toMatchObject({ sort: 'newest-confirmed', stopped: 'limit', reviews: [{ id: 'delayed' }] });
  } finally { vi.useRealTimers(); }
});

it('bounds the wait for missing controls and allows cancellation during that wait', async () => {
  vi.useFakeTimers();
  try {
    const { document } = parseHTML('<html><body></body></html>');
    const missing = collectMapsReviews(document, () => url, '0x1:0x2', 1, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await missing).toMatchObject({ sort: 'unknown', stopped: 'unsupported', reviews: [], problem: 'The Reviews tab did not appear within 10 seconds.' });
    const controller = new AbortController();
    const aborted = expect(collectMapsReviews(document, () => url, '0x1:0x2', 1, controller.signal)).rejects.toThrow('Stop while loading');
    controller.abort(new Error('Stop while loading'));
    await aborted;
  } finally { vi.useRealTimers(); }
});

it.each([false, true])('retries an ignored Reviews click after readiness (control replaced: %s)', async replaced => {
  vi.useFakeTimers();
  try {
    const doc = page();
    const tab = doc.querySelector('[role="tab"]')!;
    tab.setAttribute('aria-selected', 'false');
    let ready = false;
    let clicks = 0;
    const select = () => {
      clicks++;
      if (ready) doc.querySelector('[role="tab"]')!.setAttribute('aria-selected', 'true');
    };
    tab.addEventListener('click', select);
    doc.querySelector('[role="main"]')!.insertAdjacentHTML('beforeend', card('ready'));
    const capture = collectMapsReviews(doc, () => url, '0x1:0x2', 1, new AbortController().signal);
    setTimeout(() => {
      ready = true;
      if (replaced) {
        const next = tab.cloneNode(true);
        next.addEventListener('click', select);
        tab.replaceWith(next);
      }
    }, 500);
    await vi.advanceTimersByTimeAsync(11_000);
    expect(await capture).toMatchObject({ sort: 'newest-confirmed', stopped: 'limit', reviews: [{ id: 'ready' }] });
    expect(clicks).toBe(2);
  } finally { vi.useRealTimers(); }
});

it.each([false, true])('reports scroll geometry at a partial-sample stall (container present: %s)', async present => {
  vi.useFakeTimers();
  try {
    const doc = page();
    const wrapper = doc.createElement('div');
    wrapper.innerHTML = Array.from({ length: 19 }, (_, i) => card(String(i))).join('');
    Object.defineProperties(wrapper, {
      clientHeight: { value: 200 }, scrollHeight: { value: present ? 1200 : 200 },
      scrollTop: { get: () => present ? 1000 : 0, set: () => {} },
    });
    const main = doc.querySelector('[role="main"]')!;
    Object.defineProperties(main, { clientHeight: { value: 200 }, scrollHeight: { value: 200 } });
    main.append(wrapper);
    const pending = collectMapsReviews(doc, () => url, '0x1:0x2', 100, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(11_000);
    const result = await pending;
    expect(result).toMatchObject({ sort: 'newest-confirmed', stopped: 'stalled', reviews: expect.any(Array) });
    expect(result.reviews).toHaveLength(19);
    expect(result.problem).toBe(`No progress for 10 seconds: 19 captured ratings, 19 rendered cards. ${present ? 'Scroll position 1000 of 1000 pixels.' : 'No scrollable review ancestor found.'}`);
    expect(parseMapsCapture(result, 100).problem).toBe(result.problem);
  } finally { vi.useRealTimers(); }
});

it.each([
  ['tab', 'The Reviews tab was unavailable or did not become selected within 10 seconds.'],
  ['sort', 'The review sorting control did not appear within 10 seconds.'],
  ['newest', 'The Newest sorting option did not appear within 5 seconds.'],
  ['confirmation', 'Newest sorting was not confirmed within 5 seconds.'],
  ['ratings', 'Review cards appeared, but no supported ratings were readable.'],
])('identifies the failed %s step without inferring why it failed', async (step, problem) => {
  vi.useFakeTimers();
  try {
    const doc = page();
    if (step === 'tab') doc.querySelector('[role="tab"]')!.setAttribute('aria-selected', 'false');
    if (step === 'sort') doc.querySelector('[aria-label="Sort reviews"]')!.remove();
    if (step === 'newest') doc.querySelector('[role="menuitemradio"]')!.remove();
    if (step === 'confirmation') {
      const newest = doc.querySelector('[role="menuitemradio"]')!;
      newest.replaceWith(newest.cloneNode(true));
    }
    if (step === 'ratings') doc.querySelector('[role="main"]')!.insertAdjacentHTML('beforeend', '<div class="jftiEf" data-review-id="unsupported"><span class="kvMYJc" role="img" aria-label="Unknown rating"></span></div>');
    const capture = collectMapsReviews(doc, () => url, '0x1:0x2', 1, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(25_000);
    expect(await capture).toMatchObject({ reviews: [], problem });
  } finally { vi.useRealTimers(); }
});
