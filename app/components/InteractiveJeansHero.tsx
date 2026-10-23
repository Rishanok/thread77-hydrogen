import {HangerProductDialog} from './HangerProductDialog';
import {memo, useCallback, useEffect, useId, useRef, useState} from 'react';
import type {CSSProperties, ReactNode} from 'react';
import {JEANS_ANGLES} from '~/data/hangingJeans';
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

// Shared promises also deduplicate the remaining Jean 1 preview instance.
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

/** A common 440 × 700 stage, with the pivot at (220, 0) and hem at y=644. */
function frameStyle(frame: JeansFrame): CSSProperties {
  const scale = 644 / frame.hangingLength;
  return {
    width: `${((frame.width * scale) / 440) * 100}%`,
    left: `${50 - ((frame.pivot.x * scale) / 440) * 100}%`,
    top: `${((-frame.pivot.y * scale) / 700) * 100}%`,
    clipPath: `inset(${(frame.cropTop / frame.height) * 100}% 0 0)`,
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

function FixedHook() {
  return (
    <svg
      className="jeans-hero__hook"
      viewBox="0 0 32 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 19C-2 7 8-2 18 2C28 6 28 17 21 23L16 28V35"
        stroke="#131513"
        strokeWidth="4"
      />
      <path
        d="M7 19C-2 7 8-2 18 2C28 6 28 17 21 23L16 28V35"
        stroke="#b4b8b5"
        strokeWidth="2"
      />
      <path d="M8 16C3 7 10 1 17 4" stroke="#f3f3eb" strokeWidth="1" />
    </svg>
  );
}

type Interaction = 'idle' | 'hover' | 'manual';

const HangingJeansItem = memo(function HangingJeansItem({
  garment,
  position,
  reducedMotion,
  activePosition,
  onActivate,
  onRelease,
  onSelect,
}: {
  onSelect: (garment: HangingJeans) => void;
  garment: HangingJeans;
  position: number;
  reducedMotion: boolean;
  activePosition: number | null;
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

  useEffect(() => {
    let active = true;
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
      const next =
        (JEANS_ANGLES.indexOf(current) + direction + JEANS_ANGLES.length) %
        JEANS_ANGLES.length;
      return JEANS_ANGLES[next];
    });
  }

  const visibleAngle = ready ? angle : 'right-side';
  const reveal = JEANS_ANGLES.indexOf(visibleAngle) / 2;

  return (
    <li
      className="jeans-hero__item"
      data-garment={garment.id}
      data-angle={visibleAngle}
      data-ready={ready}
      data-interaction={interaction}
      data-selected={selected || interaction === 'hover'}
      style={
        {
          '--entrance-order': position,
          '--closet-direction':
            activePosition === null ? 0 : Math.sign(position - activePosition),
        } as CSSProperties
      }
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse' || reducedMotion) return;
        onActivate(position);
        setInteraction('hover');
        setAngle('front');
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') reset();
      }}
      onFocus={() => onActivate(position)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) reset();
      }}
    >
      <span className="jeans-hero__suspension" aria-hidden="true">
        <FixedHook />
        <span className="jeans-hero__swivel" />
      </span>
      <button
        type="button"
        className="jeans-hero__inspect"
        aria-label={garment.product ? `Shop ${garment.title}` : `Turn ${garment.title}. Current view: ${ANGLE_NAMES[visibleAngle]}.`}
        aria-describedby={`${id}-description ${id}-instructions`}
        aria-pressed={selected}
        aria-busy={!ready && !failed}
        onPointerDown={(event) => {
          pointerType.current = event.pointerType;
        }}
        onClick={(event) => {
          if (garment.product) { onSelect(garment); return; }
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
        <span className="jeans-hero__assembly" aria-hidden="true">
          <span
            className="jeans-hero__views"
            style={{'--jeans-reveal': reveal} as CSSProperties}
          >
            <span className="jeans-hero__shadow" />
            {JEANS_ANGLES.map((view) => {
              const frame = garment.frames[view];
              return (
                <img
                  key={view}
                  className="jeans-hero__frame"
                  data-view={view}
                  src={frame.src}
                  width={frame.width}
                  height={frame.height}
                  style={frameStyle(frame)}
                  alt=""
                  decoding="async"
                  loading="eager"
                  draggable={false}
                />
              );
            })}
          </span>
        </span>
      </button>
      {garment.product && (
        <button type="button" className="jeans-hero__product-link" onClick={() => onSelect(garment)}>
          {garment.title} ↗
        </button>
      )}
      <span id={`${id}-description`} className="jeans-hero__sr-only">
        {garment.description}
      </span>
      <span id={`${id}-instructions`} className="jeans-hero__sr-only">
        {garment.product
          ? 'Press Enter or Space to view product details and choose your size.'
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
  const [selectedGarment, setSelectedGarment] = useState<HangingJeans | null>(null);
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
  return (
    <section className="jeans-hero" aria-labelledby={`${id}-title`}>
      <header className="jeans-hero__heading">
        <div className="jeans-hero__edition">
          <span>THREAD77 — THE DENIM EDIT</span>
          <span>01 / EVERYDAY UNIFORM</span>
        </div>
        <div className="jeans-hero__headline">
          <h1 id={`${id}-title`}>
            Denim, <em>in motion.</em>
          </h1>
          <p>A new perspective on your everyday uniform.</p>
        </div>
      </header>
      <div className="jeans-hero__installation">
        <div className="jeans-hero__rail" aria-hidden="true" />
        <ol
          className="jeans-hero__garments"
          aria-label="Shop the hanging collection"
        >
          {garments.map((garment, position) => (
            <HangingJeansItem
              key={garment.id}
              garment={garment}
              position={position}
              reducedMotion={reducedMotion}
              activePosition={activePosition}
              onActivate={activate}
              onRelease={release}
              onSelect={setSelectedGarment}
            />
          ))}
        </ol>
      </div>
      {selectedGarment?.product && <HangerProductDialog key={selectedGarment.id} product={selectedGarment.product} onClose={() => setSelectedGarment(null)} />}
      {navigation && <div className="jeans-hero__navigation">{navigation}</div>}
    </section>
  );
}
