export function formatCurrency(centavos) {
  const pesos = Number(centavos || 0) / 100;

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(pesos);
}
