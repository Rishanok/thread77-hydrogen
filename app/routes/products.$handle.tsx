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
import {isSalePrice} from '~/lib/pricing';
import {isComingSoon, releaseDateLabel} from '~/lib/launch';
import {ShopTheLook} from '~/components/ShopTheLook';
import {AddToCartButton} from '~/components/AddToCartButton';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {useAside} from '~/components/Aside';
import {
  ProductGallery,
  ProductHeading,
  ProductIcon,
  ProductInformation,
  ProductPurchase,
  ProductShare,
  ProductSizeGuide,
} from '~/components/ProductExperience';

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
  const [quantity, setQuantity] = useState(1);
  const comingSoon = isComingSoon(product);
  const releaseDate = releaseDateLabel(product.releaseDate?.value);
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );
  useSelectedOptionInUrlParam(selectedVariant?.selectedOptions || []);
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  }).filter(
    (option) =>
      !(
        option.name === 'Title' &&
        option.optionValues[0]?.name === 'Default Title'
      ),
  );
  const onSale = isSalePrice(
    selectedVariant?.price,
    selectedVariant?.compareAtPrice,
  );
  const price = selectedVariant?.price ? (
    <Money data={selectedVariant.price} />
  ) : null;
  const salePercent =
    onSale && selectedVariant?.compareAtPrice
      ? Math.round(
          (1 -
            Number(selectedVariant.price.amount) /
              Number(selectedVariant.compareAtPrice.amount)) *
            100,
        )
      : undefined;
  const selection = selectedVariant?.selectedOptions
    .filter((option) => option.value !== 'Default Title')
    .map((option) => option.value)
    .join(' / ');
  const addButton = (
    <AddToCartButton
      disabled={
        comingSoon ||
        !selectedVariant?.availableForSale ||
        selectedVariant?.isOptimistic
      }
      onSuccess={() => open('cart')}
      onChooseOption={
        productOptions.length
          ? () => {
              const option =
                document.querySelector<HTMLElement>(
                  '.t77-pdp-option-section .is-selected',
                ) ||
                document.querySelector<HTMLElement>(
                  '.t77-pdp-option-section .t77-pdp-size-btn:not([disabled]):not(.is-sold-out)',
                );
              option?.scrollIntoView({
                block: 'center',
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                  .matches
                  ? 'auto'
                  : 'smooth',
              });
              option?.focus({preventScroll: true});
            }
          : undefined
      }
      className="t77-pdp-add-btn"
      lines={
        selectedVariant
          ? [{merchandiseId: selectedVariant.id, quantity, selectedVariant}]
          : []
      }
    >
      <ProductIcon name="bag" />
      {comingSoon
        ? 'Coming soon'
        : selectedVariant?.availableForSale
          ? 'Add to bag'
          : 'Sold out'}
      <ProductIcon name="arrow" />
    </AddToCartButton>
  );

  return (
    <div className="t77-pdp">
      <nav className="t77-pdp-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/collections/all">Shop all</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.title}</span>
      </nav>
      <div className="t77-pdp-layout">
        <ProductGallery
          images={product.images.nodes}
          title={product.title}
          selectedImage={selectedVariant?.image?.url}
        />
        <div className="t77-pdp-panel">
          <ProductHeading
            title={product.title}
            price={price}
            compareAtPrice={
              onSale && selectedVariant?.compareAtPrice ? (
                <Money data={selectedVariant.compareAtPrice} />
              ) : null
            }
            salePercent={salePercent}
          />
          {(product.fit?.value || product.fabric?.value) && (
            <div className="t77-pdp-facts">
              {product.fit?.value && <span>{product.fit.value}</span>}
              {product.fabric?.value && <span>{product.fabric.value}</span>}
            </div>
          )}
          {productOptions.map((option) => (
            <div className="t77-pdp-option-section" key={option.name}>
              <div className="t77-pdp-option-label-row">
                <span>
                  {option.name}{' '}
                  <strong>
                    {
                      selectedVariant?.selectedOptions.find(
                        (item) => item.name === option.name,
                      )?.value
                    }
                  </strong>
                </span>
                {/size/i.test(option.name) && (
                  <ProductSizeGuide note={product.sizeGuide?.value} />
                )}
              </div>
              <div
                className="t77-pdp-sizes-grid"
                role="group"
                aria-label={option.name}
              >
                {option.optionValues.map((value) => {
                  const className = `t77-pdp-size-btn ${value.selected ? 'is-selected' : ''} ${!value.available && !comingSoon ? 'is-sold-out' : ''}`;
                  const label = `${option.name}: ${value.name}${!value.available && !comingSoon ? ' — sold out' : ''}`;
                  const content = (
                    <>
                      {value.swatch?.color && (
                        <span
                          className="t77-pdp-swatch"
                          style={{backgroundColor: value.swatch.color}}
                        />
                      )}
                      {value.name}
                    </>
                  );
                  return value.isDifferentProduct ? (
                    <Link
                      key={value.name}
                      className={className}
                      aria-label={label}
                      aria-current={value.selected ? 'true' : undefined}
                      to={`/products/${value.handle}?${value.variantUriQuery}`}
                      preventScrollReset
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      key={value.name}
                      type="button"
                      className={className}
                      disabled={!value.exists}
                      aria-label={label}
                      aria-pressed={value.selected}
                      onClick={() => {
                        if (!value.selected)
                          void navigate(`?${value.variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                      }}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <ProductPurchase
            quantity={quantity}
            onQuantityChange={setQuantity}
            addButton={addButton}
            price={
              selectedVariant?.price ? (
                <Money
                  data={{
                    ...selectedVariant.price,
                    amount: (
                      Number(selectedVariant.price.amount) * quantity
                    ).toFixed(2),
                  }}
                />
              ) : null
            }
            selection={selection}
            status={
              comingSoon
                ? `Coming soon${releaseDate ? ` · ${releaseDate}` : ''}`
                : selectedVariant?.availableForSale
                  ? 'Available in your selected option'
                  : 'This option is currently sold out'
            }
            secondaryButton={
              !comingSoon &&
              selectedVariant?.availableForSale && (
                <button
                  className="t77-pdp-buy-now-btn"
                  type="button"
                  disabled={selectedVariant.isOptimistic}
                  onClick={() => {
                    void navigate(
                      `/cart/${selectedVariant.id.split('/').pop()}:${quantity}`,
                    );
                  }}
                >
                  Buy it now
                </button>
              )
            }
          />
          <ProductInformation
            description={
              product.descriptionHtml ? (
                <div
                  dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
                />
              ) : (
                <p>
                  {product.description ||
                    'More details about this piece are coming soon.'}
                </p>
              )
            }
            fabric={product.fabric?.value}
            fit={product.fit?.value}
            care={product.care?.value}
          />
          <ProductShare />
        </div>
      </div>
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
