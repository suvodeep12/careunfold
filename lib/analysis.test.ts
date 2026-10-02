import { describe, expect, it } from 'vitest';
import { analyze, parseDataset, type Dataset, type Review } from './analysis';
const review = (id: string, extra: Partial<Review> = {}): Review => ({ id, text: 'The consultation was helpful and my questions were answered.', rating: 5, translated: false, truncated: false, edited: false, ...extra });
const dataset = (reviews: Review[]): Dataset => ({ name: 'Synthetic test', source: 'synthetic', sampling: 'selected', reviews });
describe('review evidence boundaries', () => {
  it('groups exact normalized text, but separates translations and skips truncated text', () => {
    const input = dataset([review('a'), review('b', { text: '  THE CONSULTATION WAS HELPFUL AND MY QUESTIONS WERE ANSWERED. ' }), review('c', { translated: true }), review('d', { truncated: true })]);
    expect(analyze(input).findings[0]!.ids).toEqual(['a', 'b']);
    expect(analyze(dataset([review('x', { text: 'Good doctor' }), review('y', { text: 'Good doctor' })])).findings).toEqual([]);
  });
  it('requires four unedited dates and never treats missing counts as zero', () => {
    const rows = Array.from({ length: 4 }, (_, i) => review(String(i), { text: '', date: '2026-09-10', reviewerReviewCount: i === 0 ? 1 : undefined }));
    expect(analyze(dataset(rows)).findings).toHaveLength(1);
    expect(analyze(dataset(rows)).knownCounts).toBe(1);
    expect(analyze(dataset(rows)).lowCounts).toBe(1);
    rows[0]!.edited = true;
    expect(analyze(dataset(rows)).findings).toHaveLength(0);
  });
  it('rejects invalid imports and inconsistent complete coverage', () => {
    for (const bad of [null, { ...dataset([]), sampling: 'complete' }, dataset([review('a'), review('a')]), dataset([review('a', { date: '2026-02-30' })]), dataset([review('a', { rating: 6 })]), dataset([review('a', { reviewerReviewCount: 0 })]), dataset([review('a', { translated: undefined as unknown as boolean })])]) expect(() => parseDataset(bad)).toThrow();
    expect(parseDataset({ ...dataset([]), sampling: 'complete', totalReviews: 0 }).reviews).toEqual([]);
  });
  it('preserves Hindi text, ignores unknown fields and does not interpret markup', () => {
    const input = { ...dataset([review('a', { text: '<script>alert(1)</script> डॉक्टर ने ध्यान से बात सुनी।' })]), fakeProbability: 1 };
    expect(parseDataset(input)).not.toHaveProperty('fakeProbability');
    expect(parseDataset(input).reviews[0]!.text).toContain('<script>');
  });
  it('combines mixed-star duplicates into one mean vote, preserving other votes', () => {
    const r = analyze(dataset([review('a', { rating: 5 }), review('b', { rating: 1 }), review('c', { text: 'Different experience', rating: 5 })]));
    expect(r.originalRating).toBeCloseTo(11 / 3);
    expect(r.adjustedRating).toBe(4);
    expect(r.effectiveVotes).toBe(2);
    expect(analyze(dataset([])).adjustedRating).toBeNull();
    const unique = analyze(dataset([review('a', { text: '' }), review('b', { text: 'Good doctor', rating: 3 })]));
    expect(unique.originalRating).toBe(unique.adjustedRating);
  });
  it('preserves unknown flags without silently treating them as original, complete or unedited', () => {
    const rows = [review('a', { translated: null }), review('b', { translated: null }), review('c'), review('d', { truncated: null }), review('e', { date: '2026-09-10', edited: null })];
    const result = analyze(parseDataset(dataset(rows)));
    expect(result.findings.find(f => f.ids.includes('a'))!.ids).toEqual(['a', 'b']);
    expect(result.findings.find(f => f.ids.includes('a'))!.explanation).toContain('unknown');
    expect(result.findings.some(f => f.ids.includes('d'))).toBe(false);
    expect(result.datedEntries).toBe(0);
  });
});
