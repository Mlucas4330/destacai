export function formatDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export function scoreColor(score: number): string {
  if (score >= 70) return 'text-success-text'
  if (score >= 40) return 'text-warn'
  return 'text-danger'
}
