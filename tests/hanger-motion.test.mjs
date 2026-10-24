import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceHangerSpring,
  hangerOffset,
  hangerLighting,
} from '../app/lib/hangerMotion.ts';

test('hanger motion settles consistently across frame rates', () => {
  for (const fps of [30, 60, 120]) {
    let value = {position: 0, velocity: 0};
    for (let frame = 0; frame < fps * 3; frame++) {
      value = advanceHangerSpring(value, 1, 1 / fps, 95, 18);
      assert.ok(Number.isFinite(value.position));
      assert.ok(value.position > -0.1 && value.position < 1.1);
    }
    assert.ok(Math.abs(value.position - 1) < 0.001);
    assert.ok(Math.abs(value.velocity) < 0.001);
  }
});

test('reversing a turn preserves momentum instead of snapping to another view', () => {
  let value = {position: 0, velocity: 0};
  for (let frame = 0; frame < 8; frame++)
    value = advanceHangerSpring(value, 1, 1 / 60, 95, 18);
  const before = value.position;
  value = advanceHangerSpring(value, 0, 1 / 60, 95, 18);
  assert.ok(Math.abs(value.position - before) < 0.1);
  for (let frame = 0; frame < 180; frame++)
    value = advanceHangerSpring(value, 0, 1 / 60, 95, 18);
  assert.ok(Math.abs(value.position) < 0.001);
});

test('a suspended browser cannot send a hanger flying when frames resume', () => {
  const value = advanceHangerSpring(
    {position: 0.4, velocity: 1},
    1,
    60,
    95,
    18,
  );
  assert.ok(value.position >= 0.4 && value.position < 1);
  assert.ok(Number.isFinite(value.velocity));
});

test('neighbours make room on both sides while the active hook stays in place', () => {
  assert.equal(hangerOffset(2, 2), 0);
  assert.equal(hangerOffset(0, null), 0);
  assert.ok(hangerOffset(1, 2) < 0);
  assert.ok(hangerOffset(3, 2) > 0);
  assert.equal(hangerOffset(1, 2), -hangerOffset(3, 2));
  assert.ok(Math.abs(hangerOffset(1, 2)) > Math.abs(hangerOffset(0, 2)));
});

test('the floor shadow follows the swinging hem and narrows during an edge-on turn', () => {
  const left = hangerLighting(0, 2, 0.4, 0, 2);
  const right = hangerLighting(0, -2, -0.4, 0, 2);
  assert.ok(left.floorDrift < 0);
  assert.equal(left.floorDrift, -right.floorDrift);
  const edge = hangerLighting(0.5, 0, 0, 0, 2);
  const front = hangerLighting(1, 0, 0, 0, 2);
  assert.ok(
    edge.floorWidth < left.floorWidth && edge.floorWidth < front.floorWidth,
  );
  const near = hangerLighting(1, 0, 0, 1, 2);
  assert.ok(near.castBlur > front.castBlur);
  assert.ok(near.castOpacity < front.castOpacity);
  for (const turn of [-0.1, 0, 0.5, 1, 1.1]) {
    const light = hangerLighting(turn, 2, 0.4, 1.1, 3);
    assert.ok(Object.values(light).every(Number.isFinite));
    assert.ok(light.floorOpacity > 0 && light.floorOpacity < 1);
  }
});
