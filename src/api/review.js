import client from './client'

// The drill-submission review loop, shared by the Platform Evaluator console
// and the club-coach review queue. Shapes match
// backend/src/services/review.service.js.

export function getReviewQueue() {
  return client.get('/review/queue').then((res) => res.data.queue)
}

// Lifetime review totals for the signed-in reviewer:
// { pending, approved, rejected, released, xpCredited }.
export function getReviewStats() {
  return client.get('/review/stats').then((res) => res.data.stats)
}

// verdict: 'approved' | 'rejected'
// verifiedAttributes: optional { key: 0-100 } — evaluator only, sets the
// player's baseline card absolutely instead of stacking drill boosts.
export function reviewSubmission(submissionId, { verdict, feedback, verifiedAttributes } = {}) {
  return client
    .post(`/review/submissions/${submissionId}`, { verdict, feedback, verifiedAttributes })
    .then((res) => res.data)
}
