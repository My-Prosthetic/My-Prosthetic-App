export const formatCurrency = (amount: number, currency: string) => {
  const hasCents = amount % 1 !== 0;

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
};