import React from 'react';
import {Link} from 'react-router';
import {ProductCard} from './ProductCard';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';

export function ProductGrid({
  products,
  heading = 'NEW ARRIVALS',
  subheading = "Shop thread77's newest drop of the season.",
  viewAllUrl = '/collections/all',
}: {
  products?: RecommendedProductsQuery['products']['nodes'];
  heading?: string;
  subheading?: string;
  viewAllUrl?: string;
}) {
  const displayProducts = products?.slice(0, 8) || [];

  return (
    <section className="t77-product-grid-section" id="new-arrivals">
      <div className="t77-grid-header">
        <div>
          <h2 className="t77-grid-title">{heading}</h2>
          <p className="t77-grid-subtitle">{subheading}</p>
        </div>
        <Link to={viewAllUrl} className="t77-grid-viewall">
          VIEW ALL
        </Link>
      </div>

      <div className="t77-grid-container">
        {displayProducts.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            loading={idx < 4 ? 'eager' : 'lazy'}
          />
        ))}
      </div>
    </section>
  );
}
