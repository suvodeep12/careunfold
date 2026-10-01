import { parseDataset } from './analysis';

const shared = 'The doctor listened patiently, explained the treatment clearly and answered all my questions. The clinic staff were very helpful.';
export const demo = parseDataset({
  name: 'Example clinic in Noida', source: 'synthetic', sampling: 'selected', totalReviews: 120,
  reviews: [
    ...Array.from({ length: 6 }, (_, i) => ({ id: `demo-${i + 1}`, text: shared, rating: 5, date: '2026-09-14', reviewerReviewCount: i < 4 ? 1 : 8, translated: false, truncated: false, edited: false })),
    { id: 'demo-7', text: 'Doctor explained the tests. Waited about 25 minutes even with an appointment.', rating: 4, date: '2026-09-08', reviewerReviewCount: 14 },
    { id: 'demo-8', text: 'Good doctor', rating: 5, date: '2026-09-05', reviewerReviewCount: 1 },
    { id: 'demo-9', text: 'डॉक्टर ने ध्यान से मेरी बात सुनी और दवा के बारे में समझाया।', rating: 5, date: '2026-08-28', reviewerReviewCount: 3 },
    { id: 'demo-10', text: 'Had to wait for an hour. Nobody told us the doctor was running late.', rating: 1, date: '2026-08-19', reviewerReviewCount: 1 },
    { id: 'demo-11', text: '', rating: 5 },
    { id: 'demo-12', text: 'My follow-up questions were answered clearly. Reception helped me reschedule.', rating: 5, date: '2026-08-12', reviewerReviewCount: 22, edited: true },
  ].map(r => ({ translated: false, truncated: false, edited: false, ...r })),
});
