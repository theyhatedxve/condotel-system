// Format a database date using the shared date display and empty-value fallback.
export function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}
