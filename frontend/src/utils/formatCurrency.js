// Convert centavos to a Philippine peso display value using the existing number-format
// rules.
export function formatCurrency(centavos) {
  const pesos = Number(centavos || 0) / 100;

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(pesos);
}
