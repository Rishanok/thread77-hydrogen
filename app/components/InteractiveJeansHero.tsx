import {HangerProductDialog} from './HangerProductDialog';
import {memo, useCallback, useEffect, useId, useRef, useState} from 'react';
import type {CSSProperties, PointerEvent, ReactNode} from 'react';
import {hangerOffset} from '~/lib/hangerMotion';
import {useHangerMotion} from '~/lib/useHangerMotion';
import {fillJeansRail, JEANS_ANGLES} from '~/data/hangingJeans';
import type {
  HangingJeans,
  JeansAngle,
  JeansFrame,
  JeansRail,
} from '~/data/hangingJeans';

const ANGLE_NAMES: Record<JeansAngle, string> = {
  'right-side': 'Right side',
  'three-quarter': 'Three-quarter',
  front: 'Front',
};

// Repeated rail positions share decoded product images.
const decodedFrames = new Map<string, Promise<boolean>>();
function decodeFrame(src: string) {
  const cached = decodedFrames.get(src);
  if (cached) return cached;
  const image = new Image();
  image.src = src;
  const promise = image.decode().then(
    () => true,
    () => {
      decodedFrames.delete(src);
      return false;
    },
  );
  decodedFrames.set(src, promise);
  return promise;
}

/** Align the complete image with the rail and leave space below for its shadow. */
function frameStyle(frame: JeansFrame): CSSProperties {
  const scale = 644 / frame.height;
  const width = ((frame.width * scale) / 440) * 100;
  return {
    width: `${width}%`,
    left: `${50 - width / 2}%`,
    top: 0,
  };
}

function useReducedMotion() {
  // SSR starts stationary. The preference is resolved before user interaction.
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

type Interaction = 'idle' | 'hover' | 'manual';

const HangingJeansItem = memo(function HangingJeansItem({
  garment,
  position,
  reducedMotion,
  activePosition,
  hovered,
  inViewer,
  onActivate,
  onRelease,
  onSelect,
}: {
  onSelect: (position: number) => void;
  garment: HangingJeans;
  position: number;
  reducedMotion: boolean;
  activePosition: number | null;
  hovered: boolean;
  inViewer: boolean;
  onActivate: (position: number) => void;
  onRelease: (position: number) => void;
}) {
  const id = useId();
  const [angle, setAngle] = useState<JeansAngle>('right-side');
  const [interaction, setInteraction] = useState<Interaction>('idle');
  const [selected, setSelected] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const pointerType = useRef('mouse');
  const views = JEANS_ANGLES.filter(
    (view, index) =>
      JEANS_ANGLES.findIndex(
        (candidate) =>
          garment.frames[candidate].src === garment.frames[view].src,
      ) === index,
  );

  useEffect(() => {
    let active = true;
    setReady(false);
    setFailed(false);
    // All three frames preload/decode together, before the first interaction.
    void Promise.all(
      JEANS_ANGLES.map((view) => decodeFrame(garment.frames[view].src)),
    ).then((results) => {
      if (!active) return;
      setReady(results.every(Boolean));
      setFailed(results.some((result) => !result));
    });
    return () => {
      active = false;
    };
  }, [garment.frames]);

  const reset = useCallback(() => {
    setSelected(false);
    setInteraction('idle');
    setAngle('right-side');
    onRelease(position);
  }, [onRelease, position]);

  useEffect(() => {
    if (activePosition !== null && activePosition !== position) reset();
  }, [activePosition, position, reset]);

  useEffect(() => {
    if (hovered || inViewer) {
      setInteraction('hover');
      setAngle('front');
    } else {
      setInteraction((current) => (current === 'hover' ? 'idle' : current));
      setAngle('right-side');
    }
  }, [hovered, inViewer]);

  useEffect(() => {
    const resetHidden = () => {
      if (document.hidden) reset();
    };
    document.addEventListener('visibilitychange', resetHidden);
    return () => document.removeEventListener('visibilitychange', resetHidden);
  }, [reset]);

  function cycle(direction = 1) {
    onActivate(position);
    setSelected(true);
    setInteraction('manual');
    setAngle((current) => {
      const currentView = views.findIndex(
        (view) => garment.frames[view].src === garment.frames[current].src,
      );
      const next = (currentView + direction + views.length) % views.length;
      return views[next];
    });
  }

  const visibleAngle = ready ? angle : 'right-side';
  const visibleIndex = views.findIndex(
    (view) => garment.frames[view].src === garment.frames[visibleAngle].src,
  );
  const reveal = views.length > 1 ? visibleIndex / (views.length - 1) : 0;
  const motionRef = useHangerMotion({
    reveal,
    offset: hangerOffset(position, activePosition),
    active: selected || hovered,
    reducedMotion,
    position,
    paused: inViewer || !ready,
    views: views.length,
  });

  return (
    <li
      className="jeans-hero__item"
      data-garment={garment.id}
      data-position={position}
      data-in-viewer={inViewer}
      data-angle={visibleAngle}
      data-ready={ready}
      data-interaction={interaction}
      data-selected={selected || interaction === 'hover'}
      style={
        {
          '--entrance-order': position,
          zIndex: hovered || selected ? 10 : 5 - position,
        } as CSSProperties
      }
      onFocus={() => onActivate(position)}
      onBlur={(event) => {
        if (
          !inViewer &&
          !hovered &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          reset();
      }}
    >
      <button
        type="button"
        className="jeans-hero__inspect"
        aria-label={
          garment.product
            ? `Shop ${garment.title}`
            : `Turn ${garment.title}. Current view: ${ANGLE_NAMES[visibleAngle]}.`
        }
        aria-describedby={`${id}-description ${id}-instructions`}
        aria-pressed={selected}
        aria-busy={!ready && !failed}
        onPointerDown={(event) => {
          pointerType.current = event.pointerType;
        }}
        onClick={(event) => {
          if (garment.product) {
            onSelect(position);
            return;
          }
          if (
            event.detail !== 0 &&
            pointerType.current === 'touch' &&
            !selected
          ) {
            onActivate(position);
            setSelected(true);
            setInteraction('manual');
          } else {
            cycle();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            cycle(event.key === 'ArrowRight' ? 1 : -1);
          } else if (event.key === 'Escape' || event.key === 'Home') {
            event.preventDefault();
            reset();
          }
        }}
      >
        <span
          ref={motionRef}
          className="jeans-hero__assembly"
          aria-hidden="true"
        >
          <span className="jeans-hero__shadow" />
          <span className="jeans-hero__lighting">
            <span className="jeans-hero__views" data-view-count={views.length}>
              {JEANS_ANGLES.map((view) => {
                const frame = garment.frames[view];
                return (
                  <span
                    key={view}
                    className="jeans-hero__frame"
                    data-view={view}
                    style={{
                      ...frameStyle(frame),
                      aspectRatio: `${frame.width} / ${frame.height}`,
                    }}
                  >
                    <img
                      className="jeans-hero__hook-image"
                      src={frame.src}
                      width={frame.width}
                      height={frame.height}
                      alt=""
                      decoding="async"
                      loading="eager"
                      draggable={false}
                    />
                    <img
                      className="jeans-hero__cloth-image"
                      src={frame.src}
                      width={frame.width}
                      height={frame.height}
                      alt=""
                      decoding="async"
                      loading="eager"
                      draggable={false}
                    />
                  </span>
                );
              })}
            </span>
          </span>
        </span>
      </button>
      {garment.product && (
        <button
          type="button"
          className="jeans-hero__product-link"
          onClick={() => onSelect(position)}
        >
          {garment.title} ↗
        </button>
      )}
      <span id={`${id}-description`} className="jeans-hero__sr-only">
        {garment.description}
      </span>
      <span id={`${id}-instructions`} className="jeans-hero__sr-only">
        {garment.product
          ? 'Hover to turn, or use the left and right arrow keys. Press Enter or Space to view product details and choose your size.'
          : 'Press Enter or Space for the next view, or use the left and right arrow keys. Press Escape or Home to return to the right side.'}
      </span>
      <span
        className="jeans-hero__sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {failed
          ? 'The additional views could not load. Please reload to try again.'
          : interaction === 'manual'
            ? `${garment.title}: ${ANGLE_NAMES[visibleAngle]}`
            : ''}
      </span>
    </li>
  );
});

export function InteractiveJeansHero({
  garments,
  navigation,
}: {
  garments: JeansRail;
  navigation?: ReactNode;
}) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
  const installation = useRef<HTMLDivElement>(null);
  const openingOrigin = useRef<DOMRect | null>(null);
  const rail = fillJeansRail(garments);
  const selectedGarment =
    selectedPosition === null ? null : rail[selectedPosition];
  const products = garments.filter((garment) => garment.product);
  const productIndex = products.findIndex(
    (garment) => garment.id === selectedGarment?.id,
  );
  const id = useId();
  const reducedMotion = useReducedMotion();
  const [activePosition, setActivePosition] = useState<number | null>(null);
  const activate = useCallback(
    (position: number) => setActivePosition(position),
    [],
  );
  const release = useCallback((position: number) => {
    setActivePosition((current) => (current === position ? null : current));
  }, []);

  function imageBounds(position: number) {
    const item = installation.current?.querySelector<HTMLElement>(
      `[data-position="${position}"]`,
    );
    return (
      item
        ?.querySelector(`[data-view="${item.dataset.angle}"]`)
        ?.getBoundingClientRect() ?? null
    );
  }
  function select(position: number) {
    if (!rail[position]?.product) return;
    openingOrigin.current = imageBounds(position);
    setHoveredPosition(position);
    setActivePosition(position);
    setSelectedPosition(position);
  }
  function hover(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' || selectedPosition !== null) return;
    const items = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        '.jeans-hero__inspect',
      ),
    ];
    const stage = event.currentTarget
      .querySelector('.jeans-hero__assembly')
      ?.getBoundingClientRect();
    if (!stage || !items.length) return;
    const bounds = items.map((item) => item.getBoundingClientRect());
    const first = bounds[0];
    if (event.clientY < first.top - 12 || event.clientY > first.bottom) {
      setHoveredPosition(null);
      setActivePosition(null);
      return;
    }
    const centers = bounds.map((bound) => bound.left + bound.width / 2);
    // Keep the chosen piece while moving across its wider front view.
    if (
      hoveredPosition !== null &&
      Math.abs(event.clientX - centers[hoveredPosition]) < stage.width * 0.36
    )
      return;
    const closest = centers.reduce(
      (best, center, index) =>
        Math.abs(center - event.clientX) <
        Math.abs(centers[best] - event.clientX)
          ? index
          : best,
      0,
    );
    const next =
      Math.abs(event.clientX - centers[closest]) <= stage.width * 0.24
        ? closest
        : null;
    setHoveredPosition(next);
    setActivePosition(next);
  }
  return (
    <section className="jeans-hero" aria-labelledby={`${id}-title`}>
      <header className="jeans-hero__heading">
        <div className="jeans-hero__headline">
          <h1 id={`${id}-title`}>
            Denim, <em>in motion.</em>
          </h1>
        </div>
      </header>
      <div
        ref={installation}
        className="jeans-hero__installation"
        onPointerMove={hover}
        onPointerLeave={() => {
          if (selectedPosition !== null) return;
          setHoveredPosition(null);
          setActivePosition(null);
        }}
        onClickCapture={(event) => {
          const targetInspect = (event.target as HTMLElement).closest<HTMLElement>(
            '.jeans-hero__inspect',
          );
          if (targetInspect) {
            const itemEl = targetInspect.closest<HTMLElement>('[data-position]');
            const clickedPos =
              itemEl && itemEl.dataset.position !== undefined
                ? Number(itemEl.dataset.position)
                : null;
            if (clickedPos !== null && !isNaN(clickedPos)) {
              event.stopPropagation();
              select(clickedPos);
              return;
            }
          }
          if (
            event.detail > 0 &&
            hoveredPosition !== null &&
            (event.target as HTMLElement).closest('.jeans-hero__inspect')
          ) {
            event.stopPropagation();
            select(hoveredPosition);
          }
        }}
      >
        <div className="jeans-hero__rail" aria-hidden="true" />
        <ol
          className="jeans-hero__garments"
          aria-label="Shop the hanging collection"
        >
          {rail.map((garment, position) => (
            <HangingJeansItem
              // eslint-disable-next-line react/no-array-index-key -- Each fixed rail position owns independent rotation state, including repeated products.
              key={`${garment.id}-${position}`}
              garment={garment}
              position={position}
              reducedMotion={reducedMotion}
              activePosition={selectedPosition ?? activePosition}
              hovered={(selectedPosition ?? hoveredPosition) === position}
              inViewer={selectedPosition === position}
              onActivate={activate}
              onRelease={release}
              onSelect={select}
            />
          ))}
        </ol>
      </div>
      {selectedGarment?.product && (
        <HangerProductDialog
          product={selectedGarment.product}
          initialImageUrl={selectedGarment.frames.front.src}
          origin={openingOrigin.current}
          getOrigin={() =>
            selectedPosition === null ? null : imageBounds(selectedPosition)
          }
          getOpener={() =>
            installation.current?.querySelector<HTMLButtonElement>(
              `[data-position="${selectedPosition}"] .jeans-hero__inspect`,
            ) ?? null
          }
          productIndex={productIndex}
          productCount={products.length}
          onNavigate={(direction) => {
            const next =
              products[
                (productIndex + direction + products.length) % products.length
              ];
            setSelectedPosition(
              rail.findIndex((garment) => garment.id === next.id),
            );
          }}
          onClose={() => {
            setHoveredPosition(null);
            setActivePosition(null);
            setSelectedPosition(null);
          }}
        />
      )}
      {navigation && <div className="jeans-hero__navigation">{navigation}</div>}
    </section>
  );
}
