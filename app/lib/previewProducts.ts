import {homePreview} from '../data/homePreview';
import {SCRAPED_PRODUCTS} from '../data/scrapedProducts';

export const previewProducts = homePreview.map((item, index) => {
  const jeans = /jeans/i.test(item.title);
  const catalogProduct = SCRAPED_PRODUCTS.find(
    (s) => s.featuredImage?.url === item.image || s.title === item.title,
  );
  const secondaryImage = catalogProduct?.secondaryImage?.url || null;
  return {
    ...item,
    secondaryImage,
    id: String(index),
    price: jeans ? 1999 : 999,
    compareAtPrice: index % 3 === 0 ? (jeans ? 2499 : 1499) : null,
    sizes: jeans ? ['28', '30', '32', '34', '36'] : ['S', 'M', 'L', 'XL'],
    category: jeans ? 'Jeans' : 'Tees',
  };
});
export type PreviewLine = {productId: string; size: string; quantity: number};
export function validPreviewLines(value: unknown): PreviewLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((line): line is PreviewLine => {
      if (!line || typeof line !== 'object') return false;
      const item = line as Partial<PreviewLine>;
      const product = previewProducts.find((p) => p.id === item.productId);
      return (
        !!product &&
        typeof item.size === 'string' &&
        product.sizes.includes(item.size) &&
        Number.isInteger(item.quantity) &&
        Number(item.quantity) > 0 &&
        Number(item.quantity) <= 20
      );
    })
    .slice(0, 50);
}
export function previewTotal(lines: PreviewLine[]) {
  return lines.reduce(
    (sum, line) =>
      sum +
      (previewProducts.find((p) => p.id === line.productId)?.price || 0) *
        line.quantity,
    0,
  );
}
export const previewMoney = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
