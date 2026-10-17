export type LookHotspot = {handle: string; x: number; y: number};

/** Coordinates are percentages of the uncropped outfit image. */
export function parseLookLayout(value?: string | null): {
  image: number;
  items: LookHotspot[];
} {
  const empty = {image: 0, items: []};
  if (!value) return empty;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return empty;
    const data = parsed as Record<string, unknown>;
    const seen = new Set<string>();
    return {
      image:
        typeof data.image === 'number' &&
        Number.isInteger(data.image) &&
        data.image >= 0
          ? data.image
          : 0,
      items: (Array.isArray(data.items) ? data.items : []).filter(
        (candidate: unknown): candidate is LookHotspot => {
          if (!candidate || typeof candidate !== 'object') return false;
          const item = candidate as Record<string, unknown>;
          if (
            !item ||
            typeof item.handle !== 'string' ||
            !item.handle ||
            typeof item.x !== 'number' ||
            !Number.isFinite(item.x) ||
            typeof item.y !== 'number' ||
            !Number.isFinite(item.y) ||
            item.x < 0 ||
            item.x > 100 ||
            item.y < 0 ||
            item.y > 100 ||
            seen.has(item.handle)
          )
            return false;
          seen.add(item.handle);
          return true;
        },
      ),
    };
  } catch {
    return empty;
  }
}
