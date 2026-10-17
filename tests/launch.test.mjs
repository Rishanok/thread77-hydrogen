import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  isComingSoon,
  productState,
  purchaseBlockReason,
  releaseDateLabel,
} from '../app/lib/launch.ts';

const live = {
  __typename: 'ProductVariant',
  id: 'gid://shopify/ProductVariant/1',
  availableForSale: true,
  product: {title: 'Live tee'},
};
const upcoming = {
  ...live,
  id: 'gid://shopify/ProductVariant/2',
  product: {title: 'Next tee', launchStatus: {value: 'coming_soon'}},
};

test('explicit upcoming status overrides stock without relabelling sold-out pieces', () => {
  assert.equal(
    productState({
      availableForSale: true,
      launchStatus: {value: 'coming_soon'},
    }),
    'coming_soon',
  );
  assert.equal(
    productState({
      availableForSale: false,
      launchStatus: {value: 'coming_soon'},
    }),
    'coming_soon',
  );
  assert.equal(productState({availableForSale: false}), 'sold_out');
  assert.equal(productState({availableForSale: true}), 'available');
  assert.equal(
    productState({availableForSale: true, launchStatus: {value: 'available'}}),
    'available',
  );
  assert.equal(isComingSoon({launchStatus: {value: ' COMING_SOON '}}), true);
});

test('a mixed cart cannot purchase an upcoming variant even if Shopify reports stock', () => {
  assert.equal(purchaseBlockReason([live.id], [live]), null);
  assert.match(
    purchaseBlockReason([live.id, upcoming.id], [live, upcoming]),
    /Next tee is coming soon/,
  );
  assert.match(
    purchaseBlockReason([live.id], [{...live, availableForSale: false}]),
    /sold out/,
  );
  assert.match(purchaseBlockReason([live.id], []), /no longer available/);
});

test('a manual release respects stock, and display dates never unlock buying', () => {
  const released = {
    ...upcoming,
    product: {...upcoming.product, launchStatus: {value: 'available'}},
  };
  assert.equal(purchaseBlockReason([released.id], [released]), null);
  assert.match(
    purchaseBlockReason(
      [released.id],
      [{...released, availableForSale: false}],
    ),
    /sold out/,
  );
  assert.equal(releaseDateLabel('2026-10-15'), '15 Oct 2026');
  for (const date of ['not-a-date', '2026-02-31', '2026-15-01', '', null])
    assert.equal(releaseDateLabel(date), null);
  assert.equal(
    isComingSoon({...upcoming.product, releaseDate: {value: '2020-01-01'}}),
    true,
  );
});
