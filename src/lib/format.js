// ₦ + thousand separators, no decimals (all prices are whole Naira).
// Deterministic formatting — does not depend on the browser's locale.
export function formatNaira(n) {
  const num = Math.round(Number(n) || 0);
  return '₦' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}