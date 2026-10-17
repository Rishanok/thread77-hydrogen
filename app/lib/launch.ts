/** Blank launch status preserves normal Shopify inventory behavior. */
export function isComingSoon(product: {
  title?: string;
  launchStatus?: {value: string} | null;
}) {
  return product.launchStatus?.value.trim().toLowerCase() === 'coming_soon';
}

export function productState(product: {
  launchStatus?: {value: string} | null;
  availableForSale: boolean;
}): 'coming_soon' | 'available' | 'sold_out' {
  if (isComingSoon(product)) return 'coming_soon';
  return product.availableForSale ? 'available' : 'sold_out';
}

export type LaunchVariant = {
  __typename: 'ProductVariant';
  id: string;
  availableForSale: boolean;
  product: {title: string; launchStatus?: {value: string} | null};
};

export function purchaseBlockReason(ids: string[], variants: LaunchVariant[]) {
  for (const id of ids) {
    const variant = variants.find((item) => item.id === id);
    if (!variant)
      return 'This product option is no longer available. Please remove it from your bag.';
    if (isComingSoon(variant.product))
      return `${variant.product.title} is coming soon and cannot be purchased yet.`;
    if (!variant.availableForSale)
      return `${variant.product.title} is sold out in this option.`;
  }
  return null;
}

/** A release date is display-only; inventory and launch status control purchasing. */
export function releaseDateLabel(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    return null;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
