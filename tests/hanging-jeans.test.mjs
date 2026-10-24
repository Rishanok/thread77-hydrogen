import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collectionGarments, fillJeansRail} from '../app/data/hangingJeans.ts';

const image = (filename, altText = null) => ({
  url: `https://cdn.shopify.com/files/${filename}?v=123`,
  altText,
  width: 500,
  height: 935,
});
const product = (id, images) => ({
  id,
  title: id,
  description: '',
  handle: id,
  images: {nodes: images},
});

test('five rail positions repeat available products in collection order', () => {
  const garments = collectionGarments(
    ['a', 'b', 'c'].map((id) => product(id, [image(`${id}.png`)])),
  );
  assert.deepEqual(
    fillJeansRail(garments).map(({id}) => id),
    ['a', 'b', 'c', 'a', 'b'],
  );
  assert.deepEqual(
    fillJeansRail(garments.slice(0, 1)).map(({id}) => id),
    ['a', 'a', 'a', 'a', 'a'],
  );
  assert.equal(fillJeansRail([...garments, ...garments]).length, 5);
  assert.deepEqual(fillJeansRail([]), []);
  assert.ok(
    fillJeansRail(garments).every(
      (garment) => garment.product.id === garment.id,
    ),
  );
});

test('explicit hanger labels select angles regardless of gallery order or filename', () => {
  const front = image('side.png', ' HANGER-FRONT ');
  const side = image('front.png', 'hanger-side');
  const middle = image('photo.png', 'hanger-three-quarter');
  const [{frames}] = collectionGarments([
    product('denim', [front, middle, side]),
  ]);
  assert.equal(frames['right-side'].src, side.url);
  assert.equal(frames['three-quarter'].src, middle.url);
  assert.equal(frames.front.src, front.url);
});

test('the current two unlabelled Shopify uploads remain two distinct views', () => {
  const side = image('side-transparent.png');
  const middle = image('three-quarter-transparent.png');
  const [{frames}] = collectionGarments([product('denim', [side, middle])]);
  assert.equal(frames['right-side'].src, side.url);
  assert.equal(frames['three-quarter'].src, middle.url);
  assert.equal(frames.front.src, middle.url);
});

test('unlabelled images use the first three uploads as side, middle and front', () => {
  const images = ['one', 'two', 'three', 'detail'].map((name) =>
    image(`${name}.png`),
  );
  const [{frames}] = collectionGarments([product('denim', images)]);
  assert.deepEqual(
    Object.values(frames).map(({src}) => src),
    images.slice(0, 3).map(({url}) => url),
  );
});

test('two generic photos use distinct endpoints and one photo remains stationary', () => {
  const photos = [image('one.png'), image('two.png')];
  const [two, one] = collectionGarments([
    product('two', photos),
    product('one', [photos[0]]),
  ]);
  assert.equal(two.frames['right-side'].src, photos[0].url);
  assert.equal(two.frames.front.src, photos[1].url);
  assert.equal(new Set(Object.values(one.frames).map(({src}) => src)).size, 1);
});

test('missing side uploads still allow a turn between the remaining named angles', () => {
  const front = image('front.png');
  const middle = image('three-quarter.png');
  const [{frames}] = collectionGarments([product('denim', [front, middle])]);
  assert.equal(frames['right-side'].src, middle.url);
  assert.equal(frames.front.src, front.url);
});
