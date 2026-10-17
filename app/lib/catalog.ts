import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';

export function catalogOptions(request: Request) {
  const params = new URL(request.url).searchParams;
  const sort = params.get('sort') || 'newest';
  const sortKey = sort.startsWith('price-')
    ? ('PRICE' as const)
    : sort === 'title'
      ? ('TITLE' as const)
      : ('CREATED_AT' as const);
  const reverse = sort === 'price-desc' || sortKey === 'CREATED_AT';
  const available = params.get('available') === 'true';
  const price = (key: string) => {
    const raw = params.get(key);
    if (!raw?.trim()) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  };
  let min = price('min');
  let max = price('max');
  if (min !== undefined && max !== undefined && min > max)
    [min, max] = [max, min];
  const filters: ProductFilter[] = [];
  if (available) filters.push({available: true});
  if (min !== undefined || max !== undefined) filters.push({price: {min, max}});
  // Facet choices are supplied by Shopify; accept only supported scalar fields.
  for (const input of params.getAll('filter').slice(0, 20)) {
    try {
      const value = JSON.parse(input) as ProductFilter;
      if (
        value.variantOption &&
        typeof value.variantOption.name === 'string' &&
        typeof value.variantOption.value === 'string'
      ) {
        filters.push({variantOption: value.variantOption});
      } else if (typeof value.productType === 'string')
        filters.push({productType: value.productType});
      else if (typeof value.productVendor === 'string')
        filters.push({productVendor: value.productVendor});
      else if (typeof value.tag === 'string') filters.push({tag: value.tag});
    } catch {
      /* Ignore malformed query parameters. */
    }
  }
  const query = [
    available ? 'available_for_sale:true' : '',
    min !== undefined ? `variants.price:>=${min}` : '',
    max !== undefined ? `variants.price:<=${max}` : '',
  ]
    .filter(Boolean)
    .join(' AND ');
  return {sortKey, reverse, filters, query};
}
