import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productZoom} from '../app/lib/productZoom.ts';

const portrait = {width: 600, height: 750, naturalWidth: 1200, naturalHeight: 1600, panelWidth: 500, panelHeight: 600};

test('hover zoom follows the actual photo and ignores object-fit padding', () => {
  assert.equal(productZoom({...portrait, x: 0, y: 375}), null);
  const result = productZoom({...portrait, x: 300, y: 375});
  assert.ok(result);
  // The centre of the original photo must land at the centre of the zoom panel.
  assert.equal(result.imageWidth / 2 + result.imageX, 250);
  assert.equal(result.imageHeight / 2 + result.imageY, 300);
  assert.equal(result.lensX + result.lensWidth / 2, 300);
  assert.equal(result.lensY + result.lensHeight / 2, 375);
});

test('hovering at photo edges never exposes blank space in the zoom panel', () => {
  for (const point of [{x: 18.75, y: 0}, {x: 581.25, y: 750}]) {
    const result = productZoom({...portrait, ...point});
    assert.ok(result);
    assert.ok(result.imageX <= 0 && result.imageY <= 0);
    assert.ok(result.imageX + result.imageWidth >= result.panelWidth);
    assert.ok(result.imageY + result.imageHeight >= result.panelHeight);
    assert.ok(result.lensX >= 18.75 && result.lensX + result.lensWidth <= 581.25);
    assert.ok(result.lensY >= 0 && result.lensY + result.lensHeight <= 750);
  }
});

test('wide images fill the zoom panel and unloaded images cannot produce invalid geometry', () => {
  const result = productZoom({...portrait, naturalWidth: 2400, naturalHeight: 400, x: 300, y: 375});
  assert.ok(result);
  assert.ok(result.imageHeight >= result.panelHeight);
  assert.equal(productZoom({...portrait, naturalWidth: 0, x: 300, y: 375}), null);
  assert.equal(productZoom({...portrait, x: NaN, y: 375}), null);
});
