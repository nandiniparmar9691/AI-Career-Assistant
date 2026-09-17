export const scoreLabel = (score) => {
  const num = Math.round(Number(score))
  if (!Number.isFinite(num) || num < 0) return 'Not Available'
  if (num <= 39) return 'Needs Significant Practice'
  if (num <= 59) return 'Needs Improvement'
  if (num <= 74) return 'Developing'
  if (num <= 89) return 'Strong'
  return 'Excellent'
}