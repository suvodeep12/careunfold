import { expect, it, vi } from 'vitest';
import { parseHTML } from 'linkedom';
import { collectMapsReviews, parseMapsCapture } from './maps-loader';

const url = 'https://www.google.com/maps/place/Invented/data=!1s0x1:0x2';
function page() {
  const { document } = parseHTML(`<html><body><div role="main"><button role="tab" aria-label="Reviews for Invented" aria-selected="true"></button><button aria-label="Sort reviews"></button><div role="menu"><div role="menuitemradio">Newest</div></div></div><div aria-live="polite"></div></body></html>`);
  document.querySelector('[role="menuitemradio"]')!.addEventListener('click', () => {
    document.querySelector('[aria-live]')!.textContent = 'The reviews are now sorted from newest to oldest.';
  });
  return document;
}
const card = (id: string) => `<div class="jftiEf" data-review-id="${id}"><span class="kvMYJc" role="img" aria-label="5 stars"></span><div class="MyEned"><span class="wiI7pd">Invented review for loader testing.</span></div></div>`;

it('validates capture messages and preserves unknown flags at the analysis boundary', () => {
  const review = { id: 'test', text: 'Invented review', rating: 4, translated: null, truncated: false, edited: null };
  const capture = { reviews: [review], sort: 'newest-confirmed', stopped: 'limit' };
  expect(parseMapsCapture(capture, 1).reviews[0]!.translated).toBeNull();
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

it('reports missing review entries and preserves cancellation', async () => {
  vi.useFakeTimers();
  try {
    const capture = collectMapsReviews(page(), () => url, '0x1:0x2', 2, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(11_000);
    expect(await capture).toEqual({ reviews: [], sort: 'newest-confirmed', stopped: 'unavailable' });
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
