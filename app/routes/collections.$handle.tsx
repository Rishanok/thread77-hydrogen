import {isDesignPreview} from '~/lib/designPreview';
import {CATALOG_QUERY} from './collections.all';
import {
  CollectionLayout,
  CollectionEmpty,
  PreviewCollection,
} from '~/components/CollectionLayout';
import {catalogOptions} from '~/lib/catalog';
import {CatalogControls} from '~/components/CatalogControls';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import type {Route} from './+types/collections.$handle';
import {useLoaderData} from 'react-router';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {ProductCard} from '~/components/ProductCard';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Thread77 | ${data?.collection.title ?? ''}`},
    ...(data?.preview ? [{name: 'robots', content: 'noindex, nofollow'}] : []),
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const options = catalogOptions(request);
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 16,
  });

  if (!handle) {
    throw new Error('Expected collection handle to be defined');
  }

  const [{collection, catalogue}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        ...paginationVariables,
        ...options,
        sortKey: options.sortKey === 'CREATED_AT' ? 'CREATED' : options.sortKey,
      },
    }),
  ]);

  const category = ['jeans', 'tees', 'caps', 'cap', 'accessories'].includes(handle)
    ? handle
    : null;
  const preview = isDesignPreview(request) && !catalogue.nodes.length;
  if (!collection) {
    if (!category) throw new Response('Collection not found', {status: 404});
    let categoryQuery = '';
    let categoryTitle = '';
    let categoryDescription = '';

    if (category === 'jeans') {
      categoryQuery = '(product_type:Jeans OR product_type:Denim OR tag:jeans)';
      categoryTitle = 'Jeans';
      categoryDescription = 'Your denim rotation. Find the fit that feels like you.';
    } else if (category === 'tees') {
      categoryQuery = '(product_type:Tees OR product_type:T-Shirts OR tag:tees)';
      categoryTitle = 'Tees';
      categoryDescription = 'Everyday tees. Easy shapes, on repeat.';
    } else if (category === 'caps' || category === 'cap') {
      categoryQuery =
        '(product_type:Cap OR product_type:Caps OR product_type:Hats OR tag:cap OR tag:caps OR beanie)';
      categoryTitle = 'Caps';
      categoryDescription = 'Headwear and caps for everyday streetwear.';
    } else if (category === 'accessories') {
      categoryQuery =
        '(product_type:Accessories OR tag:accessories OR beanie OR frontpack OR bag)';
      categoryTitle = 'Accessories';
      categoryDescription = 'Everyday streetwear essentials and accessories.';
    }

    const result = await storefront.query(CATALOG_QUERY, {
      variables: {
        ...paginationVariables,
        ...options,
        query: [categoryQuery, options.query].filter(Boolean).join(' AND '),
      },
    });
    return {
      collection: {
        id: '',
        handle,
        title: categoryTitle,
        description: categoryDescription,
        products: {...result.products, filters: []},
      },
      preview,
      category,
    };
  }

  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
    preview,
    category,
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collection() {
  const {collection, preview, category} = useLoaderData<typeof loader>();

  return (
    <CollectionLayout
      preview={preview}
      title={collection.title}
      description={
        collection.description || 'Find your next everyday favourite.'
      }
    >
      {preview ? (
        <PreviewCollection category={category || undefined} />
      ) : (
        <>
          <CatalogControls
            facets={collection.products.filters}
            count={collection.products.nodes.length}
          />
          {!collection.products.nodes.length ? (
            <CollectionEmpty />
          ) : (
            <PaginatedResourceSection
              connection={collection.products}
              resourcesClassName="t77-collection-grid"
            >
              {({node: product, index}) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  loading={index < 4 ? 'eager' : 'lazy'}
                />
              )}
            </PaginatedResourceSection>
          )}
        </>
      )}
      {!!collection.id && (
        <Analytics.CollectionView
          data={{
            collection: {
              id: collection.id,
              handle: collection.handle,
            },
          }}
        />
      )}
    </CollectionLayout>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    availableForSale
    launchStatus: metafield(namespace: "custom", key: "launch_status") { value }
    releaseDate: metafield(namespace: "custom", key: "release_date") { value }
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    images(first: 2) {
      nodes {
        id
        altText
        url
        width
        height
      }
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 10) {
      nodes {
        id
        title
        availableForSale
        compareAtPrice { amount currencyCode }
        price {
          amount
          currencyCode
        }
      }
    }
  }
` as const;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $filters: [ProductFilter!]
  ) @inContext(country: $country, language: $language) {
    catalogue: products(first: 1) { nodes { id } }
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
        sortKey: $sortKey, reverse: $reverse, filters: $filters
      ) {
        filters { id label type values { id label count input } }
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
