import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {useDragScroll} from '~/lib/useDragScroll';

export function ProductCarousel({
  products,
  heading = 'Featured products',
  viewAllUrl = '/collections/all',
}: {
  products: RecommendedProductFragment[];
  heading?: string;
  viewAllUrl?: string;
}) {
  const {ref, isDragging, handlers} = useDragScroll<HTMLDivElement>();

  const items = products;
  if (!items.length) return null;

  return (
    <section className="t77h-carousel">
      <div className="t77h-carousel__head">
        <span className="t77h-bracket">{heading}</span>
        <span className="t77h-carousel__hint">Drag &rarr;</span>
      </div>

      <div
        ref={ref}
        className={`t77h-carousel__track ${isDragging ? 'is-dragging' : ''}`}
        {...handlers}
      >
        {items.map((product, idx) => {
          const image = product.featuredImage;
          const sku =
            product.variants?.nodes?.[0]?.sku || product.handle?.toUpperCase();
          return (
            <Link
              key={product.id}
              to={`/products/${product.handle}`}
              className="t77h-slide"
              draggable={false}
            >
              <div className="t77h-slide__media">
                {image?.url ? (
                  <Image
                    data={image}
                    sizes="(min-width: 768px) 30vw, 75vw"
                    alt={image.altText || product.title}
                    className="t77h-slide__img"
                    loading={idx < 3 ? 'eager' : 'lazy'}
                    draggable={false}
                  />
                ) : null}
              </div>
              <div className="t77h-slide__info">
                <div>
                  <span className="t77h-slide__name">{product.title}</span>
                  <span className="t77h-slide__meta">
                    {sku}
                    {' — '}
                    {product.priceRange?.minVariantPrice ? (
                      <Money
                        data={product.priceRange.minVariantPrice}
                        as="span"
                      />
                    ) : null}
                  </span>
                </div>
                <span className="t77h-slide__arrow" aria-hidden="true">
                  &rarr;
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="t77h-carousel__footer">
        <Link to={viewAllUrl} className="t77h-bracket">
          View all products
        </Link>
      </div>
    </section>
  );
}
