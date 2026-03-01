import i18next from 'i18next';

export const formatCurrency = (amount: number) => {
  const locale = i18next.language.startsWith('ar') ? 'ar-EG' : 'en-EG';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const getCurrencySymbol = () => {
  const locale = i18next.language.startsWith('ar') ? 'ar-EG' : 'en-EG';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
  }).formatToParts(0).find(p => p.type === 'currency')?.value || 'EGP';
}
