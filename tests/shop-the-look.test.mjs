import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseLookLayout} from '../app/lib/shopTheLook.ts';

test('outfit tags retain their product handles and image coordinates', () => {
  const layout = {
    image: 1,
    items: [
      {handle: 'everyday-tee', x: 50, y: 30},
      {handle: 'relaxed-jeans', x: 48, y: 70},
    ],
  };
  assert.deepEqual(parseLookLayout(JSON.stringify(layout)), layout);
});

test('invalid merchant configuration cannot break the product page', () => {
  for (const value of [null, undefined, '', '{', 'null', '42', '"text"']) {
    assert.deepEqual(parseLookLayout(value), {image: 0, items: []});
  }
  assert.deepEqual(parseLookLayout('{"image":-2,"items":{}}'), {
    image: 0,
    items: [],
  });
});

test('ignore duplicate tags, missing handles, and coordinates outside the photo', () => {
  const valid = {handle: 'tee', x: 50, y: 30};
  assert.deepEqual(
    parseLookLayout(
      JSON.stringify({
        items: [
          valid,
          {...valid, x: 60},
          null,
          {x: 20, y: 20},
          {handle: 'jeans', x: -1, y: 50},
          {handle: 'hat', x: 20, y: 101},
          {handle: 'shoes', x: '20', y: 50},
        ],
      }),
    ),
    {image: 0, items: [valid]},
  );
});
