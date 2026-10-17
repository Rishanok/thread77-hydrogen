import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isSalePrice} from '../app/lib/pricing.ts';
const price = (amount, currencyCode = 'INR') => ({amount, currencyCode});
test('sale requires a higher compare-at price in the same currency', () => {
  assert.equal(isSalePrice(price('999'), price('1499')), true);
  assert.equal(isSalePrice(price('999'), price('999')), false);
  assert.equal(isSalePrice(price('1499'), price('999')), false);
  assert.equal(isSalePrice(price('999'), price('1499', 'USD')), false);
});
test('missing and invalid prices do not create false sale claims', () => {
  assert.equal(isSalePrice(price('999'), null), false);
  assert.equal(isSalePrice(undefined, price('1499')), false);
  assert.equal(isSalePrice(price('NaN'), price('1499')), false);
  assert.equal(isSalePrice(price('-1'), price('1499')), false);
});
