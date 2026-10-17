import type {Storefront} from '@shopify/hydrogen';
import {purchaseBlockReason} from './launch';

/** Recheck Shopify at purchase time; never trust status sent from the browser. */
export async function checkPurchaseAvailability(
  storefront: Storefront,
  variantIds: string[],
) {
  const ids = [...new Set(variantIds)];
  if (!ids.length) return 'Your bag is empty.';
  if (ids.length > 250)
    return 'There are too many product options in this bag.';
  const result = await storefront.query(PURCHASE_AVAILABILITY_QUERY, {
    variables: {ids},
    cache: storefront.CacheNone(),
  });
  const variants = result.nodes.filter(
    (node) => node?.__typename === 'ProductVariant',
  );
  return purchaseBlockReason(ids, variants);
}

const PURCHASE_AVAILABILITY_QUERY = `#graphql
  query PurchaseAvailability($ids: [ID!]!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      __typename
      ... on ProductVariant {
        id
        availableForSale
        product {
          title
          launchStatus: metafield(namespace: "custom", key: "launch_status") { value }
        }
      }
    }
  }
` as const;
