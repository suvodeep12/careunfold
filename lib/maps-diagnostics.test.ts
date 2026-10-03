/// <reference types="node" />
import { expect, it } from 'vitest';
import { parseHTML } from 'linkedom';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createMapsDiagnostics, diagnosticReview } from './maps-diagnostics';

it('mirrors only aggregate evidence, preserves unknowns, escapes input and removes session data', () => {
  const place = { key: '0x1:0x2', name: '<img src=x onerror=alert(1)> Invented clinic', url: 'https://www.google.com/maps/place/Invented/data=!1s0x1:0x2', totalReviews: 125, rating: 4.6 };
  const row = diagnosticReview(place, { reviews: [{ id: 'private-id', text: 'PRIVATE REVIEW TEXT', rating: 5, reviewerReviewCount: 1, translated: null, truncated: false, edited: null }], sort: 'newest-confirmed', stopped: 'stalled', problem: 'No progress: 1 captured rating.' }, undefined, '2026-10-03T05:20:00.000Z');
  const serialized = JSON.stringify(row);
  for (const privateValue of ['PRIVATE REVIEW TEXT', 'private-id', 'reviewerReviewCount', place.url]) expect(serialized).not.toContain(privateValue);
  expect(row).toMatchObject({ captured: 1, original: 5, filtered: 5, excluded: 0 });
  const { document } = parseHTML('<html><body></body></html>');
  const mirror = createMapsDiagnostics(document);
  mirror.update({ kind: 'diagnostics', event: 'listings', places: [place], keepKeys: [] });
  mirror.update({ kind: 'diagnostics', event: 'review', row });
  const host = document.querySelector('#careunfold-diagnostics')!;
  const root = host.shadowRoot!;
  expect(root.querySelector('img')).toBeNull();
  expect(root.querySelector('tbody')!.textContent).toContain('1 captured / 125 listed');
  expect(root.querySelector('tbody')!.textContent).toContain('Stop stalled');
  mirror.update({ kind: 'diagnostics', event: 'listings', places: [place], keepKeys: [place.key] });
  expect(root.querySelector('tbody')!.textContent).toContain('1 captured');
  mirror.update({ kind: 'diagnostics', event: 'listings', places: [{ ...place, totalReviews: undefined }], keepKeys: [] });
  expect(root.querySelector('tbody')!.textContent).toContain('Waiting captured / unknown listed');
  expect(root.querySelector('tbody')!.textContent).not.toContain('Stop stalled');
  mirror.update({ kind: 'diagnostics', event: 'review', row: { ...row, name: 'Invented clinic — synthetic testing', totalReviews: 125 } });
  mirror.update({ kind: 'diagnostics', event: 'status', status: 'Synthetic demonstration. No real provider is assessed.' });
  if (process.env.CAREUNFOLD_PREVIEW_FIXTURE === '1') {
    root.querySelector('details')!.setAttribute('open', '');
    mkdirSync('.impeccable/review', { recursive: true });
    writeFileSync('.impeccable/review/diagnostics.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic diagnostic mirror</title><body>${host.outerHTML.replace('</aside>', `<template shadowrootmode="open">${root.innerHTML}</template></aside>`)}</body></html>`);
  }
  mirror.dispose();
  expect(document.querySelector('#careunfold-diagnostics')).toBeNull();
});
