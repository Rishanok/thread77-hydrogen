import {useEffect, useRef} from 'react';
import {advanceHangerSpring, hangerLighting} from './hangerMotion';

type MotionOptions = {
  reveal: number;
  offset: number;
  active: boolean;
  reducedMotion: boolean;
  position: number;
  paused: boolean;
  views: number;
};

export function useHangerMotion({
  reveal,
  offset,
  active,
  reducedMotion,
  position,
  paused,
  views,
}: MotionOptions) {
  const element = useRef<HTMLSpanElement>(null);
  const motion = useRef({
    turn: {position: 0, velocity: 0},
    slide: {position: 0, velocity: 0},
    swing: {position: 0, velocity: 0},
    cloth: {position: 0, velocity: 0},
    twist: {position: 0, velocity: 0},
    scale: {position: 1, velocity: 0},
  });
  const lastTarget = useRef({reveal: 0, offset: 0, active: false});

  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const targetScale = active ? 1.025 : 1;
    const state = motion.current;
    const old = lastTarget.current;
    const touch = old.active !== active ? (active ? -1 : 0.65) : 0;
    // The hanger moves first; the fabric follows with a softer, delayed response.
    state.swing.velocity += touch * 17 + (old.offset - offset) * 22;
    state.twist.velocity += (reveal - old.reveal) * 18;
    state.cloth.velocity -= touch * 5;
    lastTarget.current = {reveal, offset, active};
    let frame = 0;
    let visible = true;
    let previousTime = performance.now();
    const phase = position * 1.73;

    function paint() {
      if (!node) return;
      const light = hangerLighting(
        state.turn.position,
        state.swing.position,
        state.cloth.position,
        (state.scale.position - 1) / 0.025,
        views,
      );
      node.style.setProperty(
        '--jeans-reveal',
        String(Math.max(0, Math.min(1, state.turn.position))),
      );
      node.style.setProperty(
        '--hanger-slide',
        `${state.slide.position * 100}%`,
      );
      node.style.setProperty('--hanger-swing', `${state.swing.position}deg`);
      node.style.setProperty('--cloth-sway', `${state.cloth.position}deg`);
      node.style.setProperty('--hanger-twist', `${state.twist.position}deg`);
      node.style.setProperty('--hanger-scale', String(state.scale.position));
      node.style.setProperty('--floor-drift', String(light.floorDrift));
      node.style.setProperty('--floor-width', String(light.floorWidth));
      node.style.setProperty('--floor-opacity', String(light.floorOpacity));
      node.style.setProperty('--cast-x', `${light.castX}px`);
      node.style.setProperty('--cast-y', `${light.castY}px`);
      node.style.setProperty('--cast-blur', `${light.castBlur}px`);
      node.style.setProperty('--cast-opacity', String(light.castOpacity));
    }
    function finish() {
      state.turn = {position: reveal, velocity: 0};
      state.slide = {position: offset, velocity: 0};
      state.swing = {position: 0, velocity: 0};
      state.cloth = {position: 0, velocity: 0};
      state.twist = {position: 0, velocity: 0};
      state.scale = {position: targetScale, velocity: 0};
      paint();
    }
    function tick(time: number) {
      const elapsed = (time - previousTime) / 1000;
      previousTime = time;
      const seconds = time / 1000;
      // Different phases and two slow frequencies avoid a synchronised loop.
      const breeze =
        (Math.sin(seconds * 0.86 + phase) * 0.26 +
          Math.sin(seconds * 1.31 + phase * 0.7) * 0.1) *
        (active ? 0.35 : 1);
      state.turn = advanceHangerSpring(state.turn, reveal, elapsed, 90, 16);
      state.slide = advanceHangerSpring(state.slide, offset, elapsed, 110, 19);
      const inertia = Math.max(
        -2.5,
        Math.min(2.5, -state.slide.velocity * 3.2),
      );
      state.swing = advanceHangerSpring(
        state.swing,
        breeze + inertia,
        elapsed,
        39,
        5.3,
      );
      const fabricLag = Math.max(
        -1.1,
        Math.min(1.1, -state.swing.velocity * 0.045),
      );
      state.cloth = advanceHangerSpring(
        state.cloth,
        fabricLag + breeze * 0.2,
        elapsed,
        29,
        4.4,
      );
      state.twist = advanceHangerSpring(
        state.twist,
        Math.sin(seconds * 0.68 + phase) * 0.55,
        elapsed,
        34,
        6,
      );
      state.scale = advanceHangerSpring(
        state.scale,
        targetScale,
        elapsed,
        100,
        19,
      );
      paint();
      frame = requestAnimationFrame(tick);
    }
    function updatePlayback() {
      cancelAnimationFrame(frame);
      if (reducedMotion || paused || document.hidden || !visible) finish();
      else {
        previousTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    });
    observer.observe(node);
    updatePlayback();
    document.addEventListener('visibilitychange', updatePlayback);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback);
    };
  }, [reveal, offset, active, reducedMotion, position, paused, views]);

  return element;
}
