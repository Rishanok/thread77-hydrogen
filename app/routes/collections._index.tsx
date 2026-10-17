import {Link, useLoaderData} from 'react-router';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import type {Route} from './+types/collections._index';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {
  CollectionLayout,
  previewCategories,
} from '~/components/CollectionLayout';
import {isDesignPreview} from '~/lib/designPreview';
import {homePreview} from '~/data/homePreview';

export const meta: Route.MetaFunction = ({data}) => [
  {title: 'Collections | Thread77'},
  ...(data?.preview ? [{name: 'robots', content: 'noindex, nofollow'}] : []),
];
export async function loader({request, context}: Route.LoaderArgs) {
  const result = await context.storefront.query(COLLECTIONS_QUERY, {
    variables: getPaginationVariables(request, {pageBy: 12}),
  });
  return {
    ...result,
    preview: isDesignPreview(request) && !result.catalogue.nodes.length,
  };
}
export default function Collections() {
  const {collections, preview} = useLoaderData<typeof loader>();
  return (
    <CollectionLayout
      title="The collections"
      description="Find your starting point. Everyday tees, easy denim, and something to layer on top."
      preview={preview}
    >
      <div className="t77-collection-toolbar">
        <span>Explore the wardrobe</span>
        <Link to={preview ? '/collections/all?preview=1' : '/collections/all'}>
          Shop all pieces ↗
        </Link>
      </div>
      {preview ? (
        <div className="t77-collection-index-grid">
          {previewCategories.slice(1).map((item) => (
            <Link
              className="t77-collection-tile"
              key={item.handle}
              to={
                ['jeans', 'tees'].includes(item.handle)
                  ? `/collections/${item.handle}?preview=1`
                  : `/collections/all?preview=1&category=${item.handle}`
              }
            >
              <img
                src={homePreview[item.image].image}
                alt={item.title}
                width="600"
                height="780"
                loading="lazy"
              />
              <div>
                <h2>{item.title}</h2>
                <span>Explore ↗</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <PaginatedResourceSection
          connection={collections}
          resourcesClassName="t77-collection-index-grid"
        >
          {({node: collection}) => (
            <Link
              className="t77-collection-tile"
              key={collection.id}
              to={`/collections/${collection.handle}`}
              prefetch="intent"
            >
              {collection.image ? (
                <Image
                  data={collection.image}
                  alt={collection.image.altText || collection.title}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  aspectRatio="3/4"
                />
              ) : (
                <div className="t77-collection-tile-placeholder">THREAD77</div>
              )}
              <div>
                <h2>{collection.title}</h2>
                <span>Explore ↗</span>
              </div>
            </Link>
          )}
        </PaginatedResourceSection>
      )}
    </CollectionLayout>
  );
}

const COLLECTIONS_QUERY = `#graphql
  query CollectionsIndex($country: CountryCode, $language: LanguageCode, $first: Int, $last: Int, $startCursor: String, $endCursor: String)
    @inContext(country: $country, language: $language) {
    catalogue: products(first: 1) { nodes { id } }
    collections(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes { id handle title image { id url altText width height } }
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    }
  }
` as const;
