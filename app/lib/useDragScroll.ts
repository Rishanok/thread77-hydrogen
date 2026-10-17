import {useCallback, useRef, useState} from 'react';

/**
 * Click-and-drag horizontal scrolling. Suppresses the click that follows a
 * drag so cards don't navigate when the user was just panning.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const state = useRef({startX: 0, startScroll: 0, moved: false});

  const onPointerDown = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    state.current = {startX: e.clientX, startScroll: el.scrollLeft, moved: false};
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!el || !isDragging) return;
      const delta = e.clientX - state.current.startX;
      if (Math.abs(delta) > 4) state.current.moved = true;
      el.scrollLeft = state.current.startScroll - delta;
    },
    [isDragging],
  );

  const endDrag = useCallback(() => setIsDragging(false), []);

  const onClickCapture = useCallback((e: React.MouseEvent<T>) => {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      state.current.moved = false;
    }
  }, []);

  return {
    ref,
    isDragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerLeave: endDrag,
      onClickCapture,
    },
  };
}
