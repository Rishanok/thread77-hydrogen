import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {Image, Money} from '@shopify/hydrogen';
import {productState} from '~/lib/launch';
import {isDesignPreview} from '~/lib/designPreview';
import {previewProducts, previewMoney} from '~/lib/previewProducts';
import {InteractiveJeansHero} from '~/components/InteractiveJeansHero';
import {hangingJeans, jeansViewPreloads} from '~/data/hangingJeans';
import jeansHeroStyles from '~/styles/InteractiveJeansHero.css?url';
import {useScrollReveal} from '~/lib/useScrollReveal';

export const links: Route.LinksFunction = () => [
  {rel: 'stylesheet', href: jeansHeroStyles},
  ...jeansViewPreloads,
];

export const meta: Route.MetaFunction = ({data}) => [
  {title: 'Thread77 — New arrivals & everyday essentials'},
  {
    name: 'description',
    content:
      'Discover the latest Thread77 collection. Explore T-shirts, denim, layers, and your next everyday favourites.',
  },
  ...(data?.preview ? [{name: 'robots', content: 'noindex, nofollow'}] : []),
];

export async function loader({context, request}: Route.LoaderArgs) {
  const preview = isDesignPreview(request);
  try {
    const result = await context.storefront.query(RECOMMENDED_PRODUCTS_QUERY);
    return {
      products: result.products.nodes,
      collections: result.collections.nodes,
      catalogueUnavailable: false,
      preview: preview && result.products.nodes.length === 0,
    };
  } catch {
    return {products: [], collections: [], catalogueUnavailable: true, preview};
  }
}

export default function Homepage() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  const {products, collections, catalogueUnavailable, preview} =
    useLoaderData<typeof loader>();
  const isWomen = (str?: string | null) =>
    Boolean(str && /wom[ae]n|female|dress|skirt|leggings/i.test(str));

  // Filter out any women/female collections and products
  const nonWomenProducts = products.filter(
    (product) => !isWomen(product.title) && !isWomen(product.handle),
  );

  const nonWomenCollections = collections.filter(
    (collection) =>
      !isWomen(collection.handle) && !isWomen(collection.title),
  );

  // Filter out Tops, Bottoms, and Women collections as requested
  const allowedCollections = nonWomenCollections.filter(
    (collection) =>
      !/^(tops|bottoms)$/i.test(collection.handle) &&
      !/^(tops|bottoms)$/i.test(collection.title) &&
      collection.handle !== 'frontpage',
  );

  const menCol = allowedCollections.find((c) => /men/i.test(c.handle));
  const unisexCol = allowedCollections.find((c) => /unisex/i.test(c.handle));
  const accessoriesCol = allowedCollections.find((c) => /accessories/i.test(c.handle));
  const capCol = allowedCollections.find((c) => /cap/i.test(c.handle));

  const categoryLinks = [
    {
      title: menCol?.title || 'Men',
      url: menCol ? `/collections/${menCol.handle}` : '/collections/men',
    },
    {
      title: unisexCol?.title || 'Unisex',
      url: unisexCol ? `/collections/${unisexCol.handle}` : '/collections/unisex',
    },
    {
      title: accessoriesCol?.title || 'Accessories',
      url: accessoriesCol ? `/collections/${accessoriesCol.handle}` : '/collections/accessories',
    },
    {
      title: capCol?.title || 'Cap',
      url: capCol ? `/collections/${capCol.handle}` : '/collections/caps',
    },
  ];
  return (
    <div className="t77-editorial-home" ref={revealRef}>
      <InteractiveJeansHero
        garments={hangingJeans}
        navigation={
          <nav
            className="t77-editorial-category-nav"
            aria-label="Shop by category"
          >
            <Link to="/collections/all">Shop all</Link>
            {categoryLinks.map((item) => (
              <Link key={item.url} to={item.url}>
                {item.title}
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        }
      />

      {preview && (
        <div
          role="note"
          className="t77-design-notice"
          aria-label="Design preview"
        >
          Design preview — sample imagery is labelled and cannot be purchased.{' '}
          <Link to="/?preview=0">Exit preview ↗</Link>
        </div>
      )}

      {/* 4-column bordered product grid (Blurg Village format) */}
      <section className="t77-blurg-grid-section" aria-label="Products">
        <div className="t77-blurg-grid" data-reveal-group>
          {nonWomenProducts.length > 0 ? (
            nonWomenProducts.slice(0, 10).map((product) => {
              const state = productState(product);
              const statusBadge =
                state === 'coming_soon'
                  ? 'Coming soon'
                  : state === 'sold_out'
                    ? 'Sold out'
                    : null;
              return (
                <Link
                  key={product.id}
                  to={`/products/${product.handle}`}
                  prefetch="intent"
                  className="t77-blurg-card"
                >
                  {statusBadge && (
                    <span className="t77-blurg-card__badge">{statusBadge}</span>
                  )}
                  <div className="t77-blurg-card__media">
                    {product.featuredImage ? (
                      <Image
                        data={product.featuredImage}
                        alt={product.featuredImage.altText || product.title}
                        loading="lazy"
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 50vw"
                      />
                    ) : (
                      <div className="t77-blurg-card__placeholder" />
                    )}
                  </div>
                  <div className="t77-blurg-card__info">
                    <h3 className="t77-blurg-card__title">{product.title}</h3>
                    <span className="t77-blurg-card__price">
                      {state === 'coming_soon' &&
                      Number(product.priceRange.minVariantPrice.amount) === 0 ? (
                        'Price at launch'
                      ) : (
                        <Money data={product.priceRange.minVariantPrice} />
                      )}
                    </span>
                  </div>
                </Link>
              );
            })
          ) : preview ? (
            previewProducts.slice(0, 10).map((item) => (
              <Link
                key={item.id}
                to={`/preview/products/${item.id}`}
                className="t77-blurg-card"
              >
                <div className="t77-blurg-card__media">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                  />
                </div>
                <div className="t77-blurg-card__info">
                  <h3 className="t77-blurg-card__title">{item.title}</h3>
                  <span className="t77-blurg-card__price">
                    {previewMoney(item.price)}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div
              className="t77-editorial-empty"
              role="status"
              style={{
                gridColumn: '1 / -1',
                padding: '64px 24px',
                textAlign: 'center',
                borderRight: '2px solid #000',
                borderBottom: '2px solid #000',
              }}
            >
              <h3>
                {catalogueUnavailable
                  ? 'The collection is temporarily unavailable.'
                  : 'The next collection is on its way.'}
              </h3>
              <p>
                {catalogueUnavailable
                  ? 'Please try again shortly.'
                  : 'New pieces will appear here when they are released.'}
              </p>
              <Link to="/collections/all">Explore the store ↗</Link>
            </div>
          )}
        </div>
      </section>
      <nav className="t77-editorial-service" aria-label="Customer information" data-reveal-group>
        <Link to="/policies/shipping-policy">
          <span className="t77-service-index" aria-hidden="true">01</span>
          <div><h3>On its way.</h3><p>Shipping & delivery</p></div>
          <span className="t77-service-arrow" aria-hidden="true">↗</span>
        </Link>
        <Link to="/policies/refund-policy">
          <span className="t77-service-index" aria-hidden="true">02</span>
          <div><h3>A change of mind?</h3><p>Read our returns policy</p></div>
          <span className="t77-service-arrow" aria-hidden="true">↗</span>
        </Link>
        <Link to="/account">
          <span className="t77-service-index" aria-hidden="true">03</span>
          <div><h3>Your space.</h3><p>Orders & account details</p></div>
          <span className="t77-service-arrow" aria-hidden="true">↗</span>
        </Link>
      </nav>
    </div>
  );
}

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    availableForSale
    launchStatus: metafield(namespace: "custom", key: "launch_status") { value }
    releaseDate: metafield(namespace: "custom", key: "release_date") { value }
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    variants(first: 10) {
      nodes {
        id
        title
        sku
        availableForSale
        compareAtPrice { amount currencyCode }
        price {
          amount
          currencyCode
        }
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 12) {
      nodes {
        id title handle description
        image { url altText width height }
        products(first: 4) { nodes { ...RecommendedProduct } }
      }
    }
    products(first: 48, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
