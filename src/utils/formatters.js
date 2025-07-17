export const formatCurrencyES = (value) => {
  const number = typeof value === 'number' ? value : parseFloat(value || 0);
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(number)
    .replace(/\u00A0/, ' ');
};

export const formatNumberES = (value) => {
  const number = typeof value === 'number' ? value : parseFloat(value || 0);
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};
