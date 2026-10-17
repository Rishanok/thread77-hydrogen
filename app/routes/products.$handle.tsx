import {isSalePrice} from '~/lib/pricing';
import {isComingSoon, releaseDateLabel} from '~/lib/launch';
import {useState} from 'react';
import {Link, useLoaderData, useNavigate} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  Money,
} from '@shopify/hydrogen';
import {ShopTheLook} from '~/components/ShopTheLook';
import {AddToCartButton} from '~/components/AddToCartButton';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {useAside} from '~/components/Aside';

export const meta: Route.MetaFunction = ({data}) => {
  if (!data) return [{title: 'Product unavailable | Thread77'}];
  return [
    {title: `${data.product.seo.title || data.product.title} | Thread77`},
    {
      name: 'description',
      content: data.product.seo.description || data.product.description,
    },
    {tagName: 'link', rel: 'canonical', href: data.canonicalUrl},
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Product not found', {status: 404});
  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {handle, selectedOptions: getSelectedProductOptions(request)},
  });
  if (!product) throw new Response('Product not found', {status: 404});
  redirectIfHandleIsLocalized(request, {handle, data: product});
  return {
    product,
    canonicalUrl: new URL(`/products/${product.handle}`, request.url).href,
  };
}

export default function Product() {
  const {product} = useLoaderData<typeof loader>();
  return <ProductDetails key={product.id} product={product} />;
}

function ProductDetails({
  product,
}: {
  product: Awaited<ReturnType<typeof loader>>['product'];
}) {
  const {open} = useAside();
  const navigate = useNavigate();
  const comingSoon = isComingSoon(product);
  const releaseDate = releaseDateLabel(product.releaseDate?.value);
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );
  useSelectedOptionInUrlParam(selectedVariant?.selectedOptions || []);
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const priceAmount = selectedVariant?.price?.amount
    ? Number(selectedVariant.price.amount)
    : 0;
  const emiAmount = Math.round(priceAmount / 3);

  const handleBuyNow = () => {
    if (!selectedVariant || !selectedVariant.availableForSale) return;
    const variantNumericId = selectedVariant.id.split('/').pop();
    void navigate(`/cart/${variantNumericId}:${quantity}`);
  };

  return (
    <div className="t77-pdp">
      <nav className="t77-pdp-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/collections/all">Collection</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.title}</span>
      </nav>

      <div className="t77-pdp-layout">
        {/* Left: Full-Height Vertical Lookbook Gallery */}
        <div className="t77-pdp-gallery">
          {product.images.nodes.length > 0 ? (
            product.images.nodes.map((img, index) => (
              <div key={img.id || img.url} className="t77-pdp-gallery-item">
                <img
                  src={img.url}
                  alt={img.altText || `${product.title} view ${index + 1}`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))
          ) : (
            <div className="t77-pdp-gallery-item">
              <div style={{width: '100%', height: '100%', background: '#fafafa'}} />
            </div>
          )}
        </div>

        {/* Right: Sticky Control Panel */}
        <div className="t77-pdp-panel">
          <div className="t77-pdp-header">
            <h1>{product.title}</h1>
            <div className="t77-pdp-price">
              {selectedVariant?.price ? (
                <Money data={selectedVariant.price} />
              ) : null}
              {selectedVariant?.compareAtPrice &&
                isSalePrice(selectedVariant.price, selectedVariant.compareAtPrice) && (
                  <s style={{marginLeft: '10px', color: '#888', fontWeight: 400}}>
                    <Money data={selectedVariant.compareAtPrice} />
                  </s>
                )}
            </div>
          </div>

          {/* EMI Badge Strip */}
          {priceAmount > 0 && (
            <div className="t77-pdp-emi-strip">
              <span className="t77-pdp-emi-badge">NEW</span>
              <span className="t77-pdp-emi-text">
                or <strong>₹{emiAmount}/month</strong> (3 months) No Cost EMI on UPI
              </span>
              <button
                type="button"
                className="t77-pdp-emi-btn"
                onClick={handleBuyNow}
              >
                Buy On EMI
              </button>
            </div>
          )}

          {/* Options: Color & Size */}
          {productOptions.map((option) => {
            const isSize = /size/i.test(option.name);
            const isColor = /colou?r/i.test(option.name);
            const currentSelectedValue =
              selectedVariant?.selectedOptions.find((o) => o.name === option.name)
                ?.value || option.optionValues[0]?.name;

            return (
              <div className="t77-pdp-option-section" key={option.name}>
                <div className="t77-pdp-option-label-row">
                  <span>
                    {isSize ? 'SIZE' : option.name}: <strong>{currentSelectedValue}</strong>
                  </span>
                  {isSize && (
                    <button
                      type="button"
                      className="t77-pdp-size-guide-btn"
                      onClick={() => setIsSizeGuideOpen(true)}
                    >
                      Size Guide
                    </button>
                  )}
                </div>

                <div className="t77-pdp-sizes-grid">
                  {option.optionValues.map((val) => {
                    const isSelected = val.selected;
                    const isAvailable = val.available;

                    return (
                      <button
                        key={val.name}
                        type="button"
                        disabled={!val.exists}
                        className={`t77-pdp-size-btn ${isSelected ? 'is-selected' : ''} ${!isAvailable && !comingSoon ? 'is-sold-out' : ''}`}
                        onClick={() => {
                          if (!isSelected) {
                            void navigate(`?${val.variantUriQuery}`, {
                              replace: true,
                              preventScrollReset: true,
                            });
                          }
                        }}
                        title={!isAvailable && !comingSoon ? `${val.name} — Sold Out` : val.name}
                      >
                        {val.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Quantity Stepper & Add to Cart */}
          <div className="t77-pdp-actions-row">
            <div className="t77-pdp-stepper">
              <button
                type="button"
                className="t77-pdp-stepper-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="t77-pdp-stepper-value">{quantity}</span>
              <button
                type="button"
                className="t77-pdp-stepper-btn"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <AddToCartButton
              disabled={comingSoon || !selectedVariant?.availableForSale}
              onSuccess={() => open('cart')}
              className="t77-pdp-add-btn"
              lines={
                selectedVariant
                  ? [
                      {
                        merchandiseId: selectedVariant.id,
                        quantity,
                        selectedVariant,
                      },
                    ]
                  : []
              }
            >
              {comingSoon
                ? 'Coming soon'
                : selectedVariant?.availableForSale
                  ? selectedVariant.price
                    ? `Add to Cart — ${new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: selectedVariant.price.currencyCode || 'INR',
                        maximumFractionDigits: 0,
                      }).format(Number(selectedVariant.price.amount) * quantity)}`
                    : 'Add to Cart'
                  : 'Sold out'}
            </AddToCartButton>
          </div>

          {/* Direct Buy Now Button */}
          {selectedVariant?.availableForSale && !comingSoon && (
            <button
              type="button"
              className="t77-pdp-buy-now-btn"
              onClick={handleBuyNow}
            >
              Buy it now
            </button>
          )}

          {/* Accordion Drawers */}
          <div className="t77-pdp-accordions">
            <details className="t77-pdp-accordion-item" open>
              <summary className="t77-pdp-accordion-trigger">
                <span>Description</span>
                <span className="t77-pdp-accordion-chevron">⌵</span>
              </summary>
              <div className="t77-pdp-accordion-content">
                {product.descriptionHtml ? (
                  <div
                    dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
                  />
                ) : (
                  <p>
                    {product.description ||
                      'Elevated relaxed streetwear silhouette crafted with premium heavyweight cotton. Designed for comfort and effortless everyday layering.'}
                  </p>
                )}
              </div>
            </details>

            <details className="t77-pdp-accordion-item">
              <summary className="t77-pdp-accordion-trigger">
                <span>Care Product</span>
                <span className="t77-pdp-accordion-chevron">⌵</span>
              </summary>
              <div className="t77-pdp-accordion-content">
                <p>
                  {product.care?.value ||
                    'Machine wash cold with like colors. Turn inside out before washing to protect denim tone. Do not bleach. Air dry or tumble dry low.'}
                </p>
                {product.fabric?.value && (
                  <p style={{marginTop: '8px'}}>
                    <strong>Fabric:</strong> {product.fabric.value}
                  </p>
                )}
                {product.fit?.value && (
                  <p style={{marginTop: '4px'}}>
                    <strong>Fit:</strong> {product.fit.value}
                  </p>
                )}
              </div>
            </details>

            <details className="t77-pdp-accordion-item">
              <summary className="t77-pdp-accordion-trigger">
                <span>Shipping and Returns</span>
                <span className="t77-pdp-accordion-chevron">⌵</span>
              </summary>
              <div className="t77-pdp-accordion-content">
                <p>
                  Dispatched within 24-48 business hours. Standard pan-India delivery arrives in 3-5 working days. Express shipping available at checkout.
                </p>
                <p style={{marginTop: '8px'}}>
                  Hassle-free 7-day exchange and returns on all unworn items with tags attached.
                </p>
              </div>
            </details>
          </div>

          {/* Social Share Strip */}
          <div className="t77-pdp-share-strip">
            <span className="t77-pdp-share-label">SHARE:</span>
            <div className="t77-pdp-share-icons">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(product.title + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="t77-pdp-share-btn"
                title="Share on WhatsApp"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(product.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="t77-pdp-share-btn"
                title="Share on X"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <button
                type="button"
                className="t77-pdp-share-btn"
                title={copied ? 'Copied!' : 'Copy link'}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    void navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
              >
                {copied ? '✓' : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sizing Modal */}
      {isSizeGuideOpen && (
        <div
          className="t77-size-guide-overlay"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="t77-size-guide-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                }}
              >
                Size Guide
              </h3>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>
            <p
              style={{
                fontSize: '0.8rem',
                color: '#666',
                marginTop: '6px',
                marginBottom: '16px',
              }}
            >
              Measurements in inches. Regular relaxed streetwear fit.
            </p>
            <table className="t77-size-guide-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Waist</th>
                  <th>Length</th>
                  <th>Rise</th>
                  <th>Thigh</th>
                  <th>Hem</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>28</td><td>29"</td><td>41"</td><td>11.5"</td><td>23"</td><td>19"</td></tr>
                <tr><td>30</td><td>31"</td><td>42"</td><td>12.0"</td><td>24"</td><td>20"</td></tr>
                <tr><td>32</td><td>33"</td><td>42"</td><td>12.5"</td><td>25"</td><td>21"</td></tr>
                <tr><td>34</td><td>35"</td><td>43"</td><td>13.0"</td><td>26"</td><td>22"</td></tr>
                <tr><td>36</td><td>37"</td><td>43"</td><td>13.5"</td><td>27"</td><td>22.5"</td></tr>
              </tbody>
            </table>
            {product.sizeGuide?.value && (
              <div
                style={{
                  marginTop: '16px',
                  fontSize: '0.82rem',
                  color: '#444',
                }}
              >
                <strong>Model Note: </strong>
                {product.sizeGuide.value}
              </div>
            )}
          </div>
        </div>
      )}

      <ShopTheLook product={product} />

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    availableForSale
    launchStatus: metafield(namespace: "custom", key: "launch_status") { value }
    releaseDate: metafield(namespace: "custom", key: "release_date") { value }
    id
    title
    vendor
    handle
    descriptionHtml
    images(first: 30) {
      nodes { id url altText width height }
    }
    lookLayout: metafield(namespace: "custom", key: "shop_the_look_layout") { value }
    lookProducts: metafield(namespace: "custom", key: "shop_the_look") {
      references(first: 12) {
        nodes {
          ... on Product {
            id title handle availableForSale
            launchStatus: metafield(namespace: "custom", key: "launch_status") { value }
            featuredImage { id url altText width height }
            variants(first: 100) {
              nodes { id title availableForSale price { amount currencyCode } }
              pageInfo { hasNextPage }
            }
          }
        }
      }
    }
    fabric: metafield(namespace: "custom", key: "fabric") { value }
    fit: metafield(namespace: "custom", key: "fit") { value }
    care: metafield(namespace: "custom", key: "care") { value }
    sizeGuide: metafield(namespace: "custom", key: "size_guide") { value }
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
