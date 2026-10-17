import {ProductCard} from './ProductCard';
import type {RecommendedProductFragment} from 'storefrontapi.generated';

export function CompleteTheLook({
  products = [],
  currentHandle,
}: {
  products?: RecommendedProductFragment[];
  currentHandle?: string;
}) {
  const items = products.filter((product) => product.handle !== currentHandle);
  if (!items.length) return null;
  return (
    <section className="t77-complete-look-section">
      <h2>Complete the look</h2>
      <div className="t77-complete-look-grid">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
