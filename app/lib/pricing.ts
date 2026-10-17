type Price = {amount: string; currencyCode: string};
export function isSalePrice(price?: Price | null, compareAt?: Price | null) {
  if (!price || !compareAt || price.currencyCode !== compareAt.currencyCode)
    return false;
  const current = Number(price.amount);
  const original = Number(compareAt.amount);
  return (
    Number.isFinite(current) &&
    Number.isFinite(original) &&
    current >= 0 &&
    original > current
  );
}
