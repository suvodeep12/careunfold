import type { analyze } from '../../lib/analysis';

export default function VerificationSummary({ result }: { result: ReturnType<typeof analyze> }) {
  return <section className="verification-summary" aria-label="Review verification">
    <h2>Verified experience rating</h2>
    <p><strong>Insufficient evidence</strong></p>
    <p className="coverage">{result.corroboratedReviews} independently corroborated · {result.unverifiedReviews} unverified reviews in this sample</p>
    <p className="boundary">Trust must be earned. Unverified reviews contribute no verified votes. Current imports and Maps captures do not independently corroborate experiences.</p>
    <p className="boundary">Unverified does not mean fake. No integrity penalty is assigned from missing verification, and reviews do not establish clinical quality.</p>
  </section>;
}
