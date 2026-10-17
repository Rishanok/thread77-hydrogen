import {isDesignPreview} from '~/lib/designPreview';
import {
  CollectionLayout,
  CollectionEmpty,
  PreviewCollection,
} from '~/components/CollectionLayout';
import {catalogOptions} from '~/lib/catalog';
import {CatalogControls} from '~/components/CatalogControls';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import type {Route} from './+types/collections.all';
import {useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {ProductCard} from '~/components/ProductCard';

export const meta: Route.MetaFunction = ({data}) => [
  {title: 'All pieces | Thread77'},
  ...(data?.preview ? [{name: 'robots', content: 'noindex, nofollow'}] : []),
];

export async function loader({context, request}: Route.LoaderArgs) {
  const {products, catalogue} = await context.storefront.query(CATALOG_QUERY, {
    variables: {
      ...getPaginationVariables(request, {pageBy: 16}),
      ...catalogOptions(request),
    },
  });
  return {
    products,
    preview: isDesignPreview(request) && !catalogue.nodes.length,
  };
}

export default function Collection() {
  const {products, preview} = useLoaderData<typeof loader>();
  return (
    <CollectionLayout
      title="All pieces"
      description="Your everyday rotation starts here. Discover relaxed tees, denim, and the layers that bring it all together."
      preview={preview}
      count={products.nodes.length}
    >
      {preview ? (
        <PreviewCollection />
      ) : (
        <>
          <CatalogControls count={products.nodes.length} />
          {!products.nodes.length ? (
            <CollectionEmpty />
          ) : (
            <PaginatedResourceSection
              connection={products}
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
    </CollectionLayout>
  );
}

const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment MoneyCollectionItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment CollectionItem on Product {
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
    priceRange {
      minVariantPrice {
        ...MoneyCollectionItem
      }
      maxVariantPrice {
        ...MoneyCollectionItem
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

export const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $query: String
  ) @inContext(country: $country, language: $language) {
    catalogue: products(first: 1) { nodes { id } }
    products(first: $first, last: $last, before: $startCursor, after: $endCursor, sortKey: $sortKey, reverse: $reverse, query: $query) {
      nodes {
        ...CollectionItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${COLLECTION_ITEM_FRAGMENT}
` as const;
