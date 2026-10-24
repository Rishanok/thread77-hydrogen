export type SpringValue = {position: number; velocity: number};

/** Small fixed steps keep the spring stable when rendering slows down. */
export function advanceHangerSpring(
  value: SpringValue,
  target: number,
  elapsed: number,
  stiffness: number,
  damping: number,
): SpringValue {
  let {position, velocity} = value;
  const duration = Math.min(Math.max(elapsed, 0), 0.05);
  const steps = Math.max(1, Math.ceil(duration / (1 / 120)));
  const dt = duration / steps;
  for (let step = 0; step < steps; step++) {
    velocity += ((target - position) * stiffness - velocity * damping) * dt;
    position += velocity * dt;
  }
  return {position, velocity};
}

export function hangerOffset(position: number, active: number | null): number {
  if (active === null || active === position) return 0;
  const distance = Math.abs(position - active);
  return Math.sign(position - active) * (distance === 1 ? 0.28 : 0.19);
}

/** Project the moving hem onto the floor under a light above and to the left. */
export function hangerLighting(
  turn: number,
  swing: number,
  cloth: number,
  depth: number,
  views: number,
) {
  const progress = Math.max(0, Math.min(1, turn));
  const distance = Math.max(0, Math.min(1, depth));
  const radians = Math.PI / 180;
  const edge = views === 2 ? Math.abs(Math.cos(progress * Math.PI)) : 1;
  return {
    floorDrift:
      -Math.sin(swing * radians) * 1.46 - Math.sin(cloth * radians) * 1.27,
    floorWidth: (0.45 + progress * 0.55) * (0.32 + edge * 0.68),
    floorOpacity: 0.34 + edge * 0.12 - distance * 0.08,
    castX: 12 + distance * 8,
    castY: 14 + distance * 8,
    castBlur: 9 + distance * 5,
    castOpacity: 0.18 - distance * 0.035,
  };
}
