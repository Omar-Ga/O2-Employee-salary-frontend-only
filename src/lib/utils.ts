export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // The image shows $, Plan says EGP. I'll stick to USD for the "International" look but maybe EGP if strictly following plan. Plan says "1000 EGP" example. Image says "$6,250". Image takes precedence for "inspiration". I'll use $ but maybe EGP in Arabic?
    // Let's use $ as per image.
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
