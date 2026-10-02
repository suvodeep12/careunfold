export type Review = {
  id: string;
  text: string;
  rating: number;
  date?: string;
  reportedDate?: string;
  reviewerReviewCount?: number;
  translated: boolean | null;
  truncated: boolean | null;
  edited: boolean | null;
};
export type Dataset = {
  name: string;
  source: 'synthetic' | 'user-import' | 'google-maps';
  sampling: 'complete' | 'selected' | 'unknown';
  totalReviews?: number;
  reviews: Review[];
};
export type Finding = { kind: 'wording' | 'dates'; title: string; explanation: string; ids: string[] };
const MAX_REVIEWS = 1000;
export const MAX_FILE_BYTES = 2_000_000;
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const fail = (message: string): never => { throw new Error(message); };

export function parseDataset(raw: unknown): Dataset {
  if (!record(raw)) return fail('The JSON must contain a dataset object. Download the example to see the format.');
  if (typeof raw.name !== 'string' || !raw.name.trim() || raw.name.length > 160) return fail('Add a dataset name between 1 and 160 characters.');
  if (raw.source !== 'synthetic' && raw.source !== 'user-import') return fail('Set source to synthetic or user-import.');
  if (!['complete', 'selected', 'unknown'].includes(String(raw.sampling))) return fail('Set sampling to complete, selected, or unknown.');
  if (!Array.isArray(raw.reviews) || raw.reviews.length > MAX_REVIEWS) return fail('reviews must be an array with at most 1,000 entries.');
  if (raw.totalReviews !== undefined && (!integer(raw.totalReviews) || raw.totalReviews < raw.reviews.length)) return fail('totalReviews must be a whole number at least as large as the imported sample.');
  if (raw.sampling === 'complete' && raw.totalReviews !== raw.reviews.length) return fail('A complete sample must declare totalReviews equal to its number of entries.');
  const ids = new Set<string>();
  const reviews = raw.reviews.map((v, index): Review => {
    const at = `Review ${index + 1}: `;
    if (!record(v)) return fail(at + 'use an object.');
    if (typeof v.id !== 'string' || !v.id.trim() || v.id.length > 100 || ids.has(v.id)) return fail(at + 'provide a unique id between 1 and 100 characters.');
    ids.add(v.id);
    if (typeof v.text !== 'string' || v.text.length > 8000) return fail(at + 'text must be a string of at most 8,000 characters.');
    if (!integer(v.rating) || v.rating < 1 || v.rating > 5) return fail(at + 'rating must be a whole number from 1 to 5.');
    if (v.date !== undefined) {
      if (typeof v.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return fail(at + 'date must be YYYY-MM-DD; omit unknown or relative dates.');
      const parsed = new Date(v.date + 'T00:00:00Z');
      if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== v.date) return fail(at + 'date is not a real calendar date.');
    }
    if (v.reviewerReviewCount !== undefined && (!integer(v.reviewerReviewCount) || v.reviewerReviewCount < 1)) return fail(at + 'reviewerReviewCount must be a positive whole number; omit unknown counts.');
    for (const key of ['translated', 'truncated', 'edited']) {
      if (typeof v[key] !== 'boolean' && v[key] !== null) return fail(at + `set ${key} to true, false, or null for unknown.`);
    }
    // Only explicit schema fields enter the application; imported extras are discarded.
    return { id: v.id, text: v.text, rating: v.rating, date: v.date as string | undefined,
      reviewerReviewCount: v.reviewerReviewCount as number | undefined,
      translated: v.translated as boolean | null, truncated: v.truncated as boolean | null, edited: v.edited as boolean | null };
  });
  return { name: raw.name.trim(), source: raw.source, sampling: raw.sampling as Dataset['sampling'],
    totalReviews: raw.totalReviews as number | undefined, reviews };
}

export function normalize(text: string): string {
  return text.normalize('NFKC').toLocaleLowerCase('en-IN').replace(/\s+/gu, ' ').trim();
}

export function analyze(dataset: Dataset) {
  const words = new Map<string, Review[]>();
  const dates = new Map<string, Review[]>();
  for (const r of dataset.reviews) {
    const normalized = normalize(r.text);
    // Prototype threshold: exact normalized text, >=40 Unicode characters. No semantic/AI inference.
    if (r.truncated === false && [...normalized].length >= 40) {
      const key = `${r.translated === null ? 'unknown' : r.translated ? 'translated' : 'original'}:${normalized}`;
      const group = words.get(key) ?? [];
      group.push(r);
      words.set(key, group);
    }
    // Edited entries cannot establish the original publication day.
    if (r.date && r.edited === false) {
      const group = dates.get(r.date) ?? [];
      group.push(r);
      dates.set(r.date, group);
    }
  }
  const findings: Finding[] = [];
  for (const group of words.values()) if (group.length >= 2) findings.push({
    kind: 'wording', title: `${group.length} entries share the same wording`, ids: group.map(r => r.id),
    explanation: `The full displayed text matches after case, whitespace and Unicode normalization.${group[0]!.translated === null ? ' Translation status is unknown; these entries are kept separate from known original and translated texts.' : group[0]!.translated ? ' These are translated texts; translation may create similarities.' : ''} A shared template, translation or common experience can also explain a match.`,
  });
  for (const [date, group] of dates) if (group.length >= 4) findings.push({
    kind: 'dates', title: `${group.length} entries share a reported date`, ids: group.map(r => r.id),
    explanation: `These entries report ${date}. Edited entries are excluded. This is a concentration in this sample; without a historical baseline it does not establish an unusual posting rate.`,
  });
  const knownCounts = dataset.reviews.filter(r => r.reviewerReviewCount !== undefined);
  const wordingGroups = [...words.values()].filter(group => group.length >= 2);
  const groupedIds = new Set(wordingGroups.flatMap(group => group.map(r => r.id)));
  const independent = dataset.reviews.filter(r => !groupedIds.has(r.id));
  const originalTotal = dataset.reviews.reduce((sum, r) => sum + r.rating, 0);
  const adjustedTotal = independent.reduce((sum, r) => sum + r.rating, 0)
    + wordingGroups.reduce((sum, group) => sum + group.reduce((stars, r) => stars + r.rating, 0) / group.length, 0);
  const effectiveVotes = independent.length + wordingGroups.length;
  return {
    findings,
    // Current acquisition routes supply no independently corroborated patient experiences.
    // Imported verification flags and linguistic patterns cannot grant verified votes.
    verifiedExperienceRating: null,
    corroboratedReviews: 0,
    unverifiedReviews: dataset.reviews.length,
    originalRating: dataset.reviews.length ? originalTotal / dataset.reviews.length : null,
    adjustedRating: effectiveVotes ? adjustedTotal / effectiveVotes : null,
    effectiveVotes,
    combinedEntries: groupedIds.size,
    wordingGroups: wordingGroups.length,
    knownCounts: knownCounts.length,
    lowCounts: knownCounts.filter(r => r.reviewerReviewCount! <= 2).length,
    datedEntries: dataset.reviews.filter(r => r.date && r.edited === false).length,
    emptyText: dataset.reviews.filter(r => !r.text.trim()).length,
    translated: dataset.reviews.filter(r => r.translated).length,
    truncated: dataset.reviews.filter(r => r.truncated).length,
    edited: dataset.reviews.filter(r => r.edited).length,
  };
}
