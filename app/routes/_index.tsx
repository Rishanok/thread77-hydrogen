import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {Image, Money} from '@shopify/hydrogen';
import {isDesignPreview} from '~/lib/designPreview';
import {previewProducts, previewMoney} from '~/lib/previewProducts';
import {InteractiveJeansHero} from '~/components/InteractiveJeansHero';
import {ProductCard} from '~/components/ProductCard';
import {PreviewCard} from '~/components/PreviewCard';
import {HANGER_POSITIONS, collectionGarments} from '~/data/hangingJeans';
import jeansHeroStyles from '~/styles/InteractiveJeansHero.css?url';
import {useScrollReveal} from '~/lib/useScrollReveal';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';

export const links: Route.LinksFunction = () => [
  {rel: 'stylesheet', href: jeansHeroStyles},
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
  const homeResult = await context.storefront.query(HOME_SCREEN_QUERY).catch(() => null);
  const homeProducts = homeResult?.collection?.products.nodes ?? [];
  try {
    const result = await context.storefront.query(RECOMMENDED_PRODUCTS_QUERY);
    return {
      homeProducts,
      newArrivalProducts: result.newArrivals?.products.nodes ?? [],
      products: result.products.nodes,
      collections: result.collections.nodes,
      catalogueUnavailable: false,
      preview: preview && result.products.nodes.length === 0,
    };
  } catch {
    return {
      homeProducts,
      newArrivalProducts: [],
      products: [],
      collections: [],
      catalogueUnavailable: true,
      preview,
    };
  }
}

export default function Homepage() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  const {
    products,
    collections,
    catalogueUnavailable,
    preview,
    homeProducts,
    newArrivalProducts,
  } = useLoaderData<typeof loader>();
  const isWomen = (str?: string | null) =>
    Boolean(str && /wom[ae]n|female|dress|skirt|leggings/i.test(str));

  type RecommendedProduct = NonNullable<RecommendedProductsQuery['products']['nodes'][number]>;
  type RecommendedCollection = NonNullable<RecommendedProductsQuery['collections']['nodes'][number]>;

  // Filter out any women/female collections and products
  const nonWomenProducts = products.filter(
    (product: RecommendedProduct) => !isWomen(product.title) && !isWomen(product.handle),
  );

  const nonWomenCollections = collections.filter(
    (collection: RecommendedCollection) =>
      !isWomen(collection.handle) && !isWomen(collection.title),
  );

  // Filter out Tops, Bottoms, and Women collections as requested
  const allowedCollections = nonWomenCollections.filter(
    (collection: RecommendedCollection) =>
      !/^(tops|bottoms)$/i.test(collection.handle) &&
      !/^(tops|bottoms)$/i.test(collection.title) &&
      collection.handle !== 'frontpage',
  );

  const menCol = allowedCollections.find((c: RecommendedCollection) => /men/i.test(c.handle));
  const unisexCol = allowedCollections.find((c: RecommendedCollection) => /unisex/i.test(c.handle));
  const accessoriesCol = allowedCollections.find((c: RecommendedCollection) => /accessories/i.test(c.handle));
  const capCol = allowedCollections.find((c: RecommendedCollection) => /cap/i.test(c.handle));

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
  // The hanger rail is driven by `home-screen`; the product row has its own
  // optional Shopify collection and otherwise shows a short newest-products row.
  const hangingProductIds = new Set(homeProducts.map((product) => product.id));
  const curatedNewArrivals = newArrivalProducts.filter(
    (product: RecommendedProduct) =>
      !isWomen(product.title) &&
      !isWomen(product.handle),
  );
  const fallbackProducts = nonWomenProducts.filter(
    (product: RecommendedProduct) =>
      !hangingProductIds.has(product.id),
  );
  const sectionProducts = (curatedNewArrivals.length
    ? curatedNewArrivals
    : fallbackProducts
  );
  return (
    <div className="t77-editorial-home" ref={revealRef}>
      <InteractiveJeansHero
        garments={collectionGarments(homeProducts).slice(0, HANGER_POSITIONS)}
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

      {/* Product grid matching /collections/all layout and UI */}
      <section className="t77-home-products-section" aria-label="New arrivals">
        <header className="t77-home-products-heading">
          <div>
            <h2>New Arrivals</h2>
            <p>Fresh pieces for your everyday rotation.</p>
          </div>
        </header>
        <div className="t77-collection-grid" data-reveal-group>
          {sectionProducts.length > 0 ? (
            sectionProducts.map((product: any, index: number) => (
              <ProductCard
                key={product.id}
                product={product}
                preferListingImage
                loading={index < 4 ? 'eager' : 'lazy'}
              />
            ))
          ) : preview ? (
            previewProducts.map((item, index) => (
              <PreviewCard key={item.id} index={index} />
            ))
          ) : (
            <div
              className="t77-editorial-empty"
              role="status"
              style={{
                gridColumn: '1 / -1',
                padding: '64px 24px',
                textAlign: 'center',
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
    images(first: 10) {
      nodes {
        id
        url
        altText
        width
        height
      }
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
    newArrivals: collection(handle: "new-arrivals") {
      products(first: 48, sortKey: COLLECTION_DEFAULT) {
        nodes { ...RecommendedProduct }
      }
    }
    products(first: 48, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;

const HOME_SCREEN_QUERY = `#graphql
  query HomeScreen($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collection(handle: "home-screen") {
      products(first: 5, sortKey: COLLECTION_DEFAULT) {
        nodes {
          id title handle description availableForSale
          launchStatus: metafield(namespace: "custom", key: "launch_status") { value }
          images(first: 50) { nodes { url altText width height } }
          variants(first: 250) {
            pageInfo { hasNextPage }
            nodes {
              id title availableForSale
              selectedOptions { name value }
              image { url altText width height }
              price { amount currencyCode }
            }
          }
        }
      }
    }
  }
` as const;
