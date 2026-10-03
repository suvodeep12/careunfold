import type { Review } from '../../lib/analysis';

export default function ReviewerHistory({ review }: { review: Review }) {
  return <small>Reported author review total: {review.reviewerReviewCount ?? 'unknown'}. Review count before this entry and account age are unknown.</small>;
}
