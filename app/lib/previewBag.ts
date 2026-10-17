import {useSyncExternalStore} from 'react';
import {validPreviewLines, type PreviewLine} from './previewProducts';
const key = 'thread77-preview-bag-v1';
let memory = '[]';
const listeners = new Set<() => void>();
function read() {
  try {
    return window.localStorage.getItem(key) || memory;
  } catch {
    return memory;
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}
function write(lines: PreviewLine[]) {
  memory = JSON.stringify(validPreviewLines(lines));
  try {
    window.localStorage.setItem(key, memory);
  } catch {
    /* Keep session memory when storage is blocked. */
  }
  listeners.forEach((listener) => listener());
}
export function usePreviewBag() {
  const snapshot = useSyncExternalStore(subscribe, read, () => '[]');
  let lines: PreviewLine[] = [];
  try {
    lines = validPreviewLines(JSON.parse(snapshot));
  } catch {
    /* Ignore corrupted preview data. */
  }
  return {
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    add(productId: string, size: string) {
      const existing = lines.find(
        (line) => line.productId === productId && line.size === size,
      );
      write(
        existing
          ? lines.map((line) =>
              line === existing
                ? {...line, quantity: Math.min(20, line.quantity + 1)}
                : line,
            )
          : [...lines, {productId, size, quantity: 1}],
      );
    },
    update(productId: string, size: string, quantity: number) {
      write(
        lines
          .map((line) =>
            line.productId === productId && line.size === size
              ? {...line, quantity}
              : line,
          )
          .filter((line) => line.quantity > 0),
      );
    },
  };
}
