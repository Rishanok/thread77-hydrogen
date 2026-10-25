import {isSalePrice} from '~/lib/pricing';
import {productState} from '~/lib/launch';
import {useState} from 'react';
import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from '~/components/Aside';

export function ProductCard({
  product,
  loading = 'lazy',
  badge,
  preferListingImage = false,
}: {
  product:
    CollectionItemFragment | ProductItemFragment | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
  badge?: string;
  preferListingImage?: boolean;
}) {
  const {open} = useAside();
  const state = productState(product);
  const minPrice = product.priceRange.minVariantPrice;
  const saleVariant = product.variants?.nodes.find(
    (variant) =>
      'compareAtPrice' in variant &&
      Number(variant.price.amount) === Number(minPrice.amount) &&
      isSalePrice(variant.price, variant.compareAtPrice),
  );
  const compareAt =
    saleVariant && 'compareAtPrice' in saleVariant
      ? saleVariant.compareAtPrice
      : null;
  const statusBadge =
    state === 'coming_soon'
      ? 'Coming soon'
      : state === 'sold_out'
        ? 'Sold out'
        : compareAt
          ? 'Sale'
          : badge;
  const variantUrl = useVariantUrl(product.handle);
  const productImages = (product as any).images?.nodes;
  const listingImage = preferListingImage
    ? productImages?.find((img: any) => /\blisting\b/i.test(img?.altText ?? ''))
    : null;
  const image = listingImage ?? product.featuredImage ?? productImages?.[0] ?? null;
  const secondImage =
    (productImages &&
      productImages.find((img: any) => img?.url && img.url !== image?.url)) ||
    productImages?.[1] ||
    (product as any).secondaryImage ||
    null;
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const variants = product.variants?.nodes || [];

  return (
    <div className="t77-card" key={product.id}>
      <div className="t77-card__image-container">
        {statusBadge && (
          <span
            className={`t77-card__badge ${state === 'coming_soon' ? 't77-card__badge--coming-soon' : ''}`}
          >
            {statusBadge}
          </span>
        )}

        <Link
          to={variantUrl}
          prefetch="intent"
          className="t77-card__media-link"
        >
          {image ? (
            <Image
              alt={image.altText || product.title}
              aspectRatio="1/1.30"
              data={image}
              loading={loading}
              className="t77-card__image t77-card__image--front"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          ) : (
            <div
              className="t77-card__image-placeholder"
              aria-label={`No product image available for ${product.title}`}
            >
              <span>THREAD77</span>
              <small>Product image coming soon</small>
            </div>
          )}

          {secondImage?.url ? (
            <Image
              alt={secondImage.altText || product.title}
              aspectRatio="1/1.30"
              data={secondImage}
              loading="lazy"
              className="t77-card__image t77-card__image--back"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          ) : null}
        </Link>

        {/* Floating Quick Add '+' Button */}
        {state === 'available' && (
          <button
            type="button"
            className={`t77-card__quick-add-btn ${showQuickAdd ? 'is-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowQuickAdd(!showQuickAdd);
            }}
            aria-label={`Quick add ${product.title} to bag`}
            title="Quick Add"
          >
            {showQuickAdd ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            )}
          </button>
        )}

        {/* Quick Add Slide-Up Size Selector Tray */}
        {state === 'available' && showQuickAdd && (
          <div className="t77-card__quick-tray">
            <div className="t77-quick-tray__header">
              <span className="t77-quick-tray__title">SELECT OPTION</span>
              <button
                type="button"
                className="t77-quick-tray__close"
                onClick={() => setShowQuickAdd(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="t77-quick-tray__sizes">
              {variants.map((variant) => (
                <AddToCartButton
                  key={variant.id}
                  disabled={!variant.availableForSale}
                  lines={[{merchandiseId: variant.id, quantity: 1}]}
                  className="t77-quick-tray__size-btn"
                  onSuccess={() => {
                    setShowQuickAdd(false);
                    open('cart');
                  }}
                >
                  {variant.title === 'Default Title'
                    ? 'Add to bag'
                    : variant.title}
                  {!variant.availableForSale ? ' — Sold out' : ''}
                </AddToCartButton>
              ))}
              <Link to={variantUrl}>View all options</Link>
            </div>
          </div>
        )}
      </div>

      <div className="t77-card__info">
        <Link
          to={variantUrl}
          prefetch="intent"
          className="t77-card__title-link"
        >
          <h3 className="t77-card__title">{product.title}</h3>
        </Link>
        <div className="t77-card__price">
          {state === 'coming_soon' &&
          Number(product.priceRange.minVariantPrice.amount) === 0 ? (
            <span>Price at launch</span>
          ) : (
            <>
              <Money data={minPrice} />
              {compareAt && (
                <s className="t77-card__compare-price">
                  <Money data={compareAt} />
                </s>
              )}
            </>
          )}
        </div>
        {state === 'coming_soon' && (
          <span className="t77-card__launch-note">Preview the next drop</span>
        )}
      </div>
    </div>
  );
}
