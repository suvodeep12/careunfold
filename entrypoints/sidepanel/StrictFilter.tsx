import { useState } from 'react';
import type { analyze, Review } from '../../lib/analysis';

export default function StrictFilter({ reviews, result }: { reviews: Review[]; result: ReturnType<typeof analyze> }) {
  const [enabled, setEnabled] = useState(true);
  const excluded = new Map(result.exclusions.map(entry => [entry.id, entry.reasons]));
  const numbers = new Map(reviews.map((review, index) => [review.id, index + 1]));
  const visible = enabled ? reviews.filter(review => !excluded.has(review.id)) : reviews;
  const rating = enabled ? result.filteredRating : result.originalRating;
  return <section className="strict-filter" aria-label="Strict review filter">
    <h2>{enabled ? 'Estimated filtered sample rating' : 'Original sample rating'}</h2>
    <div className="filter-result" aria-live="polite" aria-atomic="true">
      <p><strong>{rating === null ? 'Insufficient evidence' : `${rating.toFixed(2)} / 5`}</strong></p>
      <p className="coverage">{visible.length} of {reviews.length} sample reviews included · {enabled ? result.exclusions.length : 0} excluded</p>
      <p className="coverage">Original sample: {result.originalRating === null ? 'unavailable' : `${result.originalRating.toFixed(2)} / 5`}</p>
    </div>
    <div className="adjustment-control"><label><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />Exclude suspected fake reviews</label></div>
    <p className="boundary">Unvalidated suspicion filter. Genuine reviews may be excluded; retained reviews are still unverified. This is not a true Google listing rating or clinical-quality score. Google’s reviews are unchanged.</p>
    <details className="method"><summary>Exclusion rules and rating formula</summary>
      <p>Exclude all entries in a group of at least two matching full displayed texts, each at least 40 Unicode characters after case, whitespace and Unicode normalization. Known original and unknown translation statuses stay in separate groups. Unknown translation status is stated in the reason; translation may explain the match. Known translated texts and incomplete or unknown-completeness texts do not qualify.</p>
      <p>Also exclude entries whose author has 1–2 total reviews when at least four sample entries share an exact known publication date with known unedited status. Relative Maps dates cannot establish a publication day; this rule needs exact imported dates.</p>
      <p>Rules apply equally to positive and negative reviews. Stars, AI-like prose, sparse history or date concentration alone do not trigger exclusion. Unknown evidence stays unknown.</p>
      <p>Filtered rating = sum of retained stars ÷ retained reviews. No retained reviews means insufficient evidence. Removing negative reviews can raise the estimate. Shared templates, coordinated review requests or other legitimate explanations can also produce these patterns.</p>
    </details>
    <details className="method"><summary>{visible.length} {enabled ? 'retained' : 'original'} sample reviews</summary>
      {!visible.length && <p>{reviews.length ? 'All reviews are excluded by this scenario. Turn off the filter to inspect the original sample.' : 'No reviews have been captured or imported.'}</p>}
      <ul className="review-list">{visible.map(review => <li className="review-entry" key={review.id}><div className="entry-heading"><strong>Sample entry {numbers.get(review.id)}</strong><span>{review.rating}/5</span></div><p>{review.text || 'Rating without written text.'}</p><small>Unverified · {review.date ?? review.reportedDate ?? 'Date unknown'}</small></li>)}</ul>
    </details>
    <details className="method"><summary>{result.exclusions.length} suspected reviews · reasons and originals</summary>
      {!result.exclusions.length && <p>No reviews met the strict rules. This does not establish authenticity.</p>}
      <ul className="review-list">{reviews.filter(review => excluded.has(review.id)).map(review => <li className="review-entry" key={review.id}><div className="entry-heading"><strong>Sample entry {numbers.get(review.id)}</strong><span>{review.rating}/5</span></div><p>{review.text || 'Rating without written text.'}</p><small>{enabled ? 'Excluded on suspicion' : 'Included: filter off'} · not proven fake</small><ul>{excluded.get(review.id)!.map(reason => <li key={reason}>{reason}</li>)}</ul></li>)}</ul>
    </details>
  </section>;
}
