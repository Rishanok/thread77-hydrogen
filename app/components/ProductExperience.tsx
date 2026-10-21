import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {Link} from 'react-router';
import {productZoom} from '~/lib/productZoom';

export type ProductPhoto = {url: string; altText?: string | null};

export function ProductIcon({
  name,
}: {
  name: 'arrow' | 'bag' | 'zoom' | 'close' | 'ruler' | 'truck' | 'return';
}) {
  const paths = {
    arrow: 'M5 12h14M13 6l6 6-6 6',
    bag: 'M5 7h14l1 14H4L5 7ZM9 8V6a3 3 0 0 1 6 0v2',
    zoom: 'M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5',
    close: 'm6 6 12 12M6 18 18 6',
    ruler: 'm3 16 13-13 5 5L8 21 3 16Zm7-7 3 3m1-7 3 3m-11 5 3 3',
    truck:
      'M3 5h11v12H3V5Zm11 5h4l3 4v3h-7M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
    return: 'M4 10h10a6 6 0 0 1 0 12M4 10l5-5M4 10l5 5',
  };
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function ProductDialog({
  open,
  onClose,
  title,
  children,
  className = '',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`t77-product-dialog ${className}`}
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close dialog">
          <ProductIcon name="close" />
        </button>
      </header>
      {children}
    </dialog>
  );
}

export function ProductGallery({
  images,
  title,
  selectedImage,
}: {
  images: ProductPhoto[];
  title: string;
  selectedImage?: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [magnifier, setMagnifier] =
    useState<ReturnType<typeof productZoom>>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const hoverDismissed = useRef(false);
  const touch = useRef<{x: number; y: number} | null>(null);
  const swiped = useRef(false);
  const photos = useMemo(
    () =>
      images.filter(
        (image, index) =>
          images.findIndex((other) => other.url === image.url) === index,
      ),
    [images],
  );
  const index = Math.min(active, Math.max(0, photos.length - 1));
  const photo = photos[index];
  const isMagnifying = magnifier !== null;
  useEffect(() => {
    setMagnifier(null);
    hoverDismissed.current = false;
  }, [photo?.url]);
  useEffect(() => {
    if (!isMagnifying) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hoverDismissed.current = true;
        setMagnifier(null);
      }
    };
    const reset = () => setMagnifier(null);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', reset);
    window.addEventListener('scroll', reset, {passive: true});
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', reset);
      window.removeEventListener('scroll', reset);
    };
  }, [isMagnifying]);
  useEffect(() => {
    const next = photos.findIndex((item) => item.url === selectedImage);
    if (next >= 0) setActive(next);
  }, [selectedImage, photos]);
  const changeImage = (direction: number) =>
    setActive((index + direction + photos.length) % photos.length);
  return (
    <div className="t77-pdp-gallery">
      <div className="t77-pdp-stage">
        {photo ? (
          <button
            className="t77-pdp-photo-button"
            type="button"
            aria-label={`Enlarge image ${index + 1} of ${title}`}
            onClick={() => {
              setMagnifier(null);
              hoverDismissed.current = true;
              if (!swiped.current) setZoomed(true);
              swiped.current = false;
            }}
            onPointerEnter={() => {
              hoverDismissed.current = false;
            }}
            onPointerLeave={() => setMagnifier(null)}
            onPointerMove={(event) => {
              const img = imageRef.current;
              if (
                !img ||
                zoomed ||
                hoverDismissed.current ||
                event.pointerType !== 'mouse' ||
                !window.matchMedia(
                  '(min-width: 1024px) and (hover: hover) and (pointer: fine)',
                ).matches
              )
                return;
              const rect = img.getBoundingClientRect();
              const panelWidth = Math.min(
                520,
                window.innerWidth - rect.right - 36,
              );
              const panelHeight = Math.min(
                720,
                rect.height,
                window.innerHeight - Math.max(rect.top, 96) - 24,
              );
              if (panelWidth < 200 || panelHeight < 180) {
                setMagnifier(null);
                return;
              }
              setMagnifier(
                productZoom({
                  width: rect.width,
                  height: rect.height,
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight,
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                  panelWidth,
                  panelHeight,
                }),
              );
            }}
            onTouchStart={(event) => {
              swiped.current = false;
              touch.current = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
              };
            }}
            onTouchEnd={(event) => {
              if (!touch.current || photos.length < 2) return;
              const dx = event.changedTouches[0].clientX - touch.current.x;
              const dy = event.changedTouches[0].clientY - touch.current.y;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                swiped.current = true;
                changeImage(dx < 0 ? 1 : -1);
              }
              touch.current = null;
            }}
          >
            <img
              ref={imageRef}
              src={photo.url}
              alt={photo.altText || `${title}, view ${index + 1}`}
              loading="eager"
            />
            {magnifier && (
              <span
                className="t77-pdp-magnifier-lens"
                aria-hidden="true"
                style={{
                  width: magnifier.lensWidth,
                  height: magnifier.lensHeight,
                  transform: `translate3d(${magnifier.lensX}px, ${magnifier.lensY}px, 0)`,
                }}
              />
            )}
            <span className="t77-pdp-zoom">
              <ProductIcon name="zoom" />
            </span>
          </button>
        ) : (
          <div className="t77-pdp-photo-empty">
            Product photography coming soon
          </div>
        )}
        {magnifier && photo && (
          <div
            className="t77-pdp-magnifier"
            aria-hidden="true"
            style={{width: magnifier.panelWidth, height: magnifier.panelHeight}}
          >
            <img
              src={photo.url}
              alt=""
              style={{
                width: magnifier.imageWidth,
                height: magnifier.imageHeight,
                transform: `translate3d(${magnifier.imageX}px, ${magnifier.imageY}px, 0)`,
              }}
            />
          </div>
        )}
        {photos.length > 1 && (
          <div className="t77-pdp-gallery-controls">
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => changeImage(-1)}
            >
              <span className="t77-icon-back">
                <ProductIcon name="arrow" />
              </span>
            </button>
            <span aria-live="polite">
              {String(index + 1).padStart(2, '0')} /{' '}
              {String(photos.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => changeImage(1)}
            >
              <ProductIcon name="arrow" />
            </button>
          </div>
        )}
      </div>
      {photos.length > 1 && (
        <div className="t77-pdp-thumbnails" aria-label="Product images">
          {photos.map((image, i) => (
            <button
              key={image.url}
              type="button"
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setActive(i)}
            >
              <img src={image.url} alt="" loading="lazy" />
              <span>{String(i + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      )}
      <div className="t77-pdp-gallery-caption">
        <span>A CLOSER LOOK</span>
        <span className="t77-pdp-gallery-caption-touch">
          {photos.length > 1 ? 'Swipe or select a view. ' : ''}Tap image to
          explore.
        </span>
        <span className="t77-pdp-gallery-caption-hover">
          Hover to zoom · Click to expand
        </span>
      </div>
      <ProductDialog
        open={zoomed}
        onClose={() => setZoomed(false)}
        title={`${title} · ${index + 1} / ${photos.length}`}
        className="t77-product-dialog--image"
      >
        {photo && <img src={photo.url} alt={photo.altText || title} />}
        {photos.length > 1 && (
          <footer>
            <button type="button" onClick={() => changeImage(-1)}>
              ← Previous
            </button>
            <button type="button" onClick={() => changeImage(1)}>
              Next →
            </button>
          </footer>
        )}
      </ProductDialog>
    </div>
  );
}

export function ProductHeading({
  title,
  category,
  price,
  compareAtPrice,
  salePercent,
  preview = false,
}: {
  title: string;
  category?: string;
  price: ReactNode;
  compareAtPrice?: ReactNode;
  salePercent?: number;
  preview?: boolean;
}) {
  return (
    <header className="t77-pdp-header">
      <p className="t77-pdp-eyebrow">
        THREAD77 <span>/</span> {category || 'EVERYDAY EXPRESSION'}
      </p>
      <h1>{title}</h1>
      <div className="t77-pdp-price">
        {price}
        {compareAtPrice && <s>{compareAtPrice}</s>}
        {!!salePercent && (
          <span className="t77-pdp-saving">{salePercent}% OFF</span>
        )}
      </div>
      <p className="t77-pdp-price-note">
        {preview
          ? 'Sample pricing · For design preview only'
          : 'Shipping and applicable taxes calculated at checkout.'}
      </p>
    </header>
  );
}

export function ProductSizeGuide({note}: {note?: string | null}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="t77-pdp-size-guide-btn"
        type="button"
        onClick={() => setOpen(true)}
      >
        <ProductIcon name="ruler" /> Size guide
      </button>
      <ProductDialog
        title="Find your fit"
        open={open}
        onClose={() => setOpen(false)}
      >
        <p className="t77-pdp-eyebrow">A LITTLE MEASURING GOES A LONG WAY</p>
        {note ? (
          <p className="t77-pdp-size-note">{note}</p>
        ) : (
          <p>
            Product-specific measurements are not available yet. Compare a piece
            you already wear with the product measurements before choosing a
            size.
          </p>
        )}
        <div className="t77-pdp-measure-steps">
          <div>
            <span>01</span>
            <div>
              <h3>Start with a favourite</h3>
              <p>
                Lay a similar garment flat. Smooth it out without stretching the
                fabric.
              </p>
            </div>
          </div>
          <div>
            <span>02</span>
            <div>
              <h3>Measure across</h3>
              <p>
                For tops, measure the chest from underarm to underarm. For
                bottoms, measure straight across the waistband. Double the
                measurement for circumference.
              </p>
            </div>
          </div>
          <div>
            <span>03</span>
            <div>
              <h3>Check the length</h3>
              <p>
                Measure tops from the highest shoulder point to the hem, and
                bottoms from the waistband to the hem.
              </p>
            </div>
          </div>
        </div>
        <p className="t77-pdp-size-note">
          Between sizes? Consider the fit you prefer and check the product’s fit
          notes.
        </p>
      </ProductDialog>
    </>
  );
}

export function ProductQuantity({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="t77-pdp-stepper" role="group" aria-label="Quantity">
      <button
        type="button"
        disabled={quantity <= 1}
        onClick={() => onChange(Math.max(1, quantity - 1))}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span aria-live="polite" aria-label={`Quantity: ${quantity}`}>
        {quantity}
      </span>
      <button
        type="button"
        disabled={quantity >= 20}
        onClick={() => onChange(Math.min(20, quantity + 1))}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export function ProductPurchase({
  quantity,
  onQuantityChange,
  addButton,
  secondaryButton,
  price,
  selection,
  status,
}: {
  quantity: number;
  onQuantityChange: (value: number) => void;
  addButton: ReactNode;
  secondaryButton?: ReactNode;
  price: ReactNode;
  selection?: string;
  status?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setSticky((ref.current?.getBoundingClientRect().bottom ?? 0) < 0);
      });
    };
    update();
    window.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return (
    <>
      <div ref={ref} className="t77-pdp-purchase">
        {status && (
          <p className="t77-pdp-availability" role="status">
            {status}
          </p>
        )}
        <div className="t77-pdp-actions-row">
          <ProductQuantity quantity={quantity} onChange={onQuantityChange} />
          {addButton}
        </div>
        {secondaryButton}
      </div>
      {sticky && (
        <div className="t77-pdp-mobile-purchase">
          <div>
            <strong>{price}</strong>
            <span>
              {selection || 'Your selection'} · Qty {quantity}
            </span>
          </div>
          {addButton}
        </div>
      )}
    </>
  );
}

export function ProductInformation({
  description,
  fabric,
  fit,
  care,
  preview = false,
}: {
  description: ReactNode;
  fabric?: string | null;
  fit?: string | null;
  care?: string | null;
  preview?: boolean;
}) {
  return (
    <>
      <div className="t77-pdp-service-links">
        <Link to="/policies/shipping-policy">
          <ProductIcon name="truck" />
          <span>
            Delivery information<small>View shipping policy</small>
          </span>
          <ProductIcon name="arrow" />
        </Link>
        <Link to="/policies/refund-policy">
          <ProductIcon name="return" />
          <span>
            Returns & exchanges<small>Find out what’s eligible</small>
          </span>
          <ProductIcon name="arrow" />
        </Link>
      </div>
      <div className="t77-pdp-accordions">
        <details className="t77-pdp-accordion-item" open>
          <summary>
            About this piece<span aria-hidden="true">+</span>
          </summary>
          <div className="t77-pdp-accordion-content">{description}</div>
        </details>
        <details className="t77-pdp-accordion-item">
          <summary>
            Fit & care<span aria-hidden="true">+</span>
          </summary>
          <div className="t77-pdp-accordion-content">
            {fit && (
              <p>
                <strong>Fit:</strong> {fit}
              </p>
            )}
            {fabric && (
              <p>
                <strong>Fabric:</strong> {fabric}
              </p>
            )}
            <p>
              {care ||
                'Follow the care instructions on the garment label. Check the product’s measurements to find your preferred fit.'}
            </p>
          </div>
        </details>
        <details className="t77-pdp-accordion-item">
          <summary>
            Delivery & returns<span aria-hidden="true">+</span>
          </summary>
          <div className="t77-pdp-accordion-content">
            <p>
              {preview
                ? 'This is a preview item. No payment is collected and no order will be shipped.'
                : 'Available delivery options and shipping charges are shown at checkout. Please review return and exchange eligibility before ordering.'}
            </p>
            <Link to="/policies/shipping-policy">Shipping policy ↗</Link>
            <Link to="/policies/refund-policy">Returns policy ↗</Link>
          </div>
        </details>
      </div>
    </>
  );
}

export function ProductShare() {
  const [status, setStatus] = useState('Share this piece');
  return (
    <button
      className="t77-pdp-share"
      type="button"
      onClick={() => {
        void (async () => {
          try {
            if (navigator.share)
              await navigator.share({
                title: document.title,
                url: window.location.href,
              });
            else {
              await navigator.clipboard.writeText(window.location.href);
              setStatus('Link copied');
            }
          } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError'))
              setStatus('Copy the link from your address bar');
          }
        })();
      }}
    >
      <span aria-live="polite">{status}</span>
      <ProductIcon name="arrow" />
    </button>
  );
}
