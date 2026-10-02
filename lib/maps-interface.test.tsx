/// <reference types="node" />
import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseHTML } from 'linkedom';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { Listing } from '../entrypoints/sidepanel/MapsComparison';
import App from '../entrypoints/sidepanel/App';
import StrictFilter from '../entrypoints/sidepanel/StrictFilter';
import { analyze, type Dataset } from './analysis';
import type { MapsCapture } from './maps-loader';

vi.mock('wxt/browser', () => ({ browser: {} }));

it('separates the requested suspicion filter from verified status and the duplicate sensitivity scenario', () => {
  const { document } = parseHTML(renderToStaticMarkup(<App />));
  expect(document.querySelector('[aria-label="Review verification"]')!.textContent).toContain('Insufficient evidence');
  expect(document.querySelector('.sample-calculations')!.hasAttribute('open')).toBe(false);
  expect(document.querySelector('.sample-calculations summary')!.textContent).toBe('Unverified sample calculations');
  const strict = document.querySelector('[aria-label="Strict review filter"]')!;
  expect(strict.textContent).toContain('4.17 / 5');
  expect(strict.textContent).toContain('6 of 12 sample reviews included · 6 excluded');
  expect(strict.textContent).toContain('Original sample: 4.58 / 5');
  expect(strict.querySelector('input')!.hasAttribute('checked')).toBe(true);
  expect(strict.textContent).toContain('not proven fake');
});

it('shows insufficient evidence and original escaped text when the strict filter excludes everything', () => {
  const sample: Dataset = { name: 'Invented', source: 'synthetic', sampling: 'selected', reviews: ['a', 'b'].map(id => ({ id, text: '<script>alert(1)</script> Synthetic repeated full original review text.', rating: 5, translated: false, truncated: false, edited: false })) };
  const { document } = parseHTML(renderToStaticMarkup(<StrictFilter reviews={sample.reviews} result={analyze(sample)} />));
  expect(document.querySelector('.filter-result')!.textContent).toContain('Insufficient evidence');
  expect(document.querySelector('.filter-result')!.textContent).toContain('0 of 2 sample reviews included · 2 excluded');
  expect(document.querySelector('script')).toBeNull();
  expect(document.querySelector('.review-entry p')!.textContent).toContain('<script>alert(1)</script>');
});

it('keeps Google aggregates separate from sample calculations and unavailable evidence', () => {
  const place = { key: '0x1:0x2', name: 'Invented clinic', url: 'https://www.google.com/maps/place/Invented/data=!1s0x1:0x2', rating: 4.8, totalReviews: 120 };
  const capture: MapsCapture = { sort: 'newest-confirmed', stopped: 'limit', reviews: [5, 5, 1].map((rating, i) => ({ id: String(i), rating, text: i < 2 ? 'Synthetic repeated text for testing the sample adjustment only.' : 'Different synthetic experience.', translated: null, truncated: false, edited: null })) };
  const ready = renderToStaticMarkup(<Listing row={{ place, capture }} />);
  expect(ready).toContain('4.80');
  expect(ready).toContain('3.67');
  expect(ready).toContain('3.00');
  expect(ready).toContain('translation status unknown');
  expect(ready).toContain('not the doctor');
  const { document } = parseHTML(ready);
  expect(document.querySelector('[aria-label="Review verification"]')!.textContent).toContain('Insufficient evidence');
  expect(document.querySelector('[aria-label="Review verification"]')!.textContent).toContain('0 independently corroborated');
  expect(document.querySelector('details')!.hasAttribute('open')).toBe(false);
  expect([...document.querySelectorAll('summary')].some(summary => summary.textContent!.includes('Unverified sample calculations'))).toBe(true);
  expect(document.querySelector('[aria-label="Strict review filter"]')!.textContent).toContain('Estimated filtered sample rating');
  expect(document.querySelector('.filter-result')!.textContent).toContain('1.00 / 5');
  expect(document.querySelector('.filter-result')!.textContent).toContain('1 of 3 sample reviews included · 2 excluded');
  expect(document.querySelector('[aria-label="Strict review filter"]')!.textContent).toContain('Translation status is unknown');
  const unavailable: MapsCapture = { reviews: [], sort: 'newest-confirmed', stopped: 'unavailable', problem: 'No review cards appeared within 10 seconds.' };
  const missing = renderToStaticMarkup(<Listing row={{ place, capture: unavailable }} />);
  expect(missing).toContain('No adjusted rating is calculated');
  expect(missing).not.toContain('0.00');
  expect(missing).toContain('No review cards appeared within 10 seconds.');
  expect(missing).toContain('Open this listing to inspect its reviews manually.');
  if (process.env.CAREUNFOLD_PREVIEW_FIXTURE === '1') {
    const stylesheet = readdirSync('.output/chrome-mv3/assets').find(file => file.endsWith('.css'))!;
    const html = renderToStaticMarkup(<div className="app"><main><div className="source-note synthetic"><strong>Synthetic verification fixture</strong><span>Invented clinics and reviews. No real provider is assessed.</span></div><ol className="maps-list"><Listing row={{ place: { ...place, name: 'Invented clinic — waiting' } }} /><Listing row={{ place: { ...place, name: 'Invented clinic — captured sample' }, capture }} /><Listing row={{ place: { ...place, name: 'Invented clinic — unavailable reviews' }, capture: unavailable }} /></ol></main></div>);
    mkdirSync('.impeccable/review', { recursive: true });
    writeFileSync('.impeccable/review/maps-states.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="http://127.0.0.1:8767/.output/chrome-mv3/assets/${stylesheet}"><title>Synthetic comparison verification</title>${html}</html>`);
  }
});
