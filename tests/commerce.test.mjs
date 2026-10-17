import {test} from 'node:test';
import assert from 'node:assert/strict';
import {safeLocalRedirect, validCartLines} from '../app/lib/cart-validation.ts';
import {catalogOptions} from '../app/lib/catalog.ts';
import {storefrontMenuUrl} from '../app/lib/menu.ts';

test('cart accepts real variants and rejects product IDs, invalid quantities and oversized batches', () => {
  const line = {merchandiseId: 'gid://shopify/ProductVariant/123', quantity: 1};
  assert.equal(validCartLines([line]), true);
  for (const quantity of [0, -1, 1.5, NaN, Infinity, '1'])
    assert.equal(validCartLines([{...line, quantity}]), false);
  assert.equal(
    validCartLines([{...line, merchandiseId: 'gid://shopify/Product/123'}]),
    false,
  );
  assert.equal(validCartLines(Array(251).fill(line)), false);
  assert.equal(validCartLines(null), false);
  assert.equal(validCartLines([null]), false);
  assert.equal(
    validCartLines([{id: 'gid://shopify/CartLine/abc', quantity: 0}], true),
    true,
  );
});

test('redirects only accept local paths', () => {
  for (const target of [
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    'javascript:alert(1)',
    '/\nfoo',
    null,
  ]) {
    assert.equal(safeLocalRedirect(target), '/cart');
  }
  assert.equal(
    safeLocalRedirect('/products/shirt?Size=M'),
    '/products/shirt?Size=M',
  );
});

test('catalog validates price bounds and keeps sorting and Shopify facets', () => {
  const options = catalogOptions(
    new Request(
      'https://shop.test/collections/all?sort=price-desc&available=true&min=500&max=100',
    ),
  );
  assert.equal(options.sortKey, 'PRICE');
  assert.equal(options.reverse, true);
  assert.equal(
    options.query,
    'available_for_sale:true AND variants.price:>=100 AND variants.price:<=500',
  );
  assert.deepEqual(options.filters, [
    {available: true},
    {price: {min: 100, max: 500}},
  ]);
  const malformed = catalogOptions(
    new Request('https://shop.test?min=abc&max=-1&filter=null&filter=bad'),
  );
  assert.deepEqual(malformed.filters, []);
  const params = new URLSearchParams({
    filter: JSON.stringify({variantOption: {name: 'Size', value: 'M'}}),
  });
  assert.deepEqual(
    catalogOptions(new Request(`https://shop.test?${params}`)).filters,
    [{variantOption: {name: 'Size', value: 'M'}}],
  );
});

test('menu links preserve external destinations and localize Shopify shop URLs', () => {
  const domains = ['brand.myshopify.com', 'https://brand.test'];
  assert.equal(
    storefrontMenuUrl(
      'https://brand.myshopify.com/collections/tops?sort=title',
      domains,
    ),
    '/collections/tops?sort=title',
  );
  assert.equal(
    storefrontMenuUrl('https://example.test/help', domains),
    'https://example.test/help',
  );
  assert.equal(storefrontMenuUrl('javascript:alert(1)', domains), null);
  assert.equal(
    storefrontMenuUrl('mailto:help@brand.test', domains),
    'mailto:help@brand.test',
  );
});
