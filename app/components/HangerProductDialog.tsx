import {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link} from 'react-router';
import {Money} from '@shopify/hydrogen';
import type {HomeProduct} from '~/data/hangingJeans';
import {productState} from '~/lib/launch';
import thread77Logo from '~/assets/thread77-logo.webp';

type Props = {
  product: HomeProduct;
  initialImageUrl: string;
  origin: DOMRect | null;
  getOrigin: () => DOMRect | null;
  getOpener: () => HTMLElement | null;
  productIndex: number;
  productCount: number;
  onNavigate: (direction: number) => void;
  onClose: () => void;
};

function originTransform(image: HTMLImageElement, origin: DOMRect | null) {
  const target = image.getBoundingClientRect();
  if (!origin || !target.height) return 'translateY(18px) scale(0.96)';
  const x = origin.left + origin.width / 2 - (target.left + target.width / 2);
  return `translate(${x}px, ${origin.top - target.top}px) scale(${origin.height / target.height})`;
}

export function HangerProductDialog(props: Props) {
  const {product, initialImageUrl, productIndex, productCount, onNavigate} =
    props;
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const initialOrigin = useRef(props.origin);
  const firstProduct = useRef(product.id);
  const direction = useRef(1);
  const closing = useRef(false);
  const animations = useRef<Animation[]>([]);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node.showModal();
    closeButton.current?.focus({preventScroll: true});
    const image = node.querySelector<HTMLImageElement>('.hanger-dialog__image');
    if (
      image &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const animation = image.animate(
        [
          {transform: originTransform(image, initialOrigin.current)},
          {transform: 'none'},
        ],
        {duration: 700, easing: 'cubic-bezier(.18,.78,.22,1)', fill: 'both'},
      );
      animations.current.push(animation);
      void animation.finished.then(() => animation.cancel()).catch(() => {});
    }
    return () => {
      animations.current.forEach((animation) => animation.cancel());
      document.body.style.overflow = previousOverflow;
      const isTouch =
        typeof window !== 'undefined' &&
        window.matchMedia('(pointer: coarse)').matches;
      if (!isTouch) {
        (latest.current.getOpener() ?? opener)?.focus({preventScroll: true});
      }
    };
  }, []);

  useEffect(() => {
    if (product.id === firstProduct.current) return;
    firstProduct.current = product.id;
    const image = dialog.current?.querySelector<HTMLImageElement>(
      '.hanger-dialog__image',
    );
    if (!image || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    animations.current.forEach((animation) => animation.cancel());
    const animation = image.animate(
      [
        {
          transform: `translateX(${direction.current * 55}px) rotate(${direction.current * 2}deg)`,
          opacity: 0,
        },
        {transform: 'none', opacity: 1},
      ],
      {duration: 500, easing: 'cubic-bezier(.2,.75,.25,1)'},
    );
    animations.current = [animation];
  }, [product.id]);

  function close() {
    if (closing.current) return;
    closing.current = true;
    const node = dialog.current;
    const image = node?.querySelector<HTMLImageElement>(
      '.hanger-dialog__image',
    );
    if (
      !node ||
      !image ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      latest.current.onClose();
      return;
    }
    const from = getComputedStyle(image).transform;
    animations.current.forEach((animation) => animation.cancel());
    node.dataset.closing = 'true';
    node.inert = true;

    // Immediately fade out the text details, header and nav arrows so there is zero UI lag or text lingering
    const details = node.querySelector<HTMLElement>('.hanger-dialog__details');
    if (details) {
      details.style.animation = 'none';
      details.style.transition = 'opacity 130ms ease, transform 130ms ease';
      details.style.opacity = '0';
      details.style.transform = 'translateY(6px)';
      details.style.pointerEvents = 'none';
    }
    const header = node.querySelector<HTMLElement>('.hanger-dialog__header');
    if (header) {
      header.style.transition = 'opacity 130ms ease';
      header.style.opacity = '0';
      header.style.pointerEvents = 'none';
    }
    const browse = node.querySelector<HTMLElement>('.hanger-dialog__browse');
    if (browse) {
      browse.style.transition = 'opacity 130ms ease';
      browse.style.opacity = '0';
      browse.style.pointerEvents = 'none';
    }

    const animation = image.animate(
      [
        {transform: from, opacity: 1},
        {
          transform: originTransform(image, latest.current.getOrigin()),
          opacity: 1,
        },
      ],
      {duration: 460, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards'},
    );
    animations.current = [animation];
    void animation.finished
      .then(() => latest.current.onClose())
      .catch(() => {});
  }

  return createPortal(
    <dialog
      ref={dialog}
      className="hanger-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <button
        className="hanger-dialog__backdrop"
        type="button"
        tabIndex={-1}
        aria-label="Close product viewer"
        onClick={close}
      />
      <header className="hanger-dialog__header">
        <span className="hanger-dialog__brand">
          <img
            src={thread77Logo}
            alt="Thread77"
            className="hanger-dialog__brand-logo"
            width={110}
            height={37}
          />
          <span>THE HANGING EDIT</span>
        </span>
        <button
          ref={closeButton}
          type="button"
          className="hanger-dialog__close"
          onClick={close}
          aria-label="Close product details"
        >
          Close <span aria-hidden="true">×</span>
        </button>
      </header>
      <div className="hanger-dialog__panel">
        {productCount > 1 && (
          <nav
            className="hanger-dialog__browse"
            aria-label="Browse the hanging collection"
          >
            <button
              type="button"
              className="hanger-dialog__arrow hanger-dialog__arrow--previous"
              aria-label="Previous product"
              onClick={() => {
                direction.current = -1;
                onNavigate(-1);
              }}
            >
              ←
            </button>
            <button
              type="button"
              className="hanger-dialog__arrow hanger-dialog__arrow--next"
              aria-label="Next product"
              onClick={() => {
                direction.current = 1;
                onNavigate(1);
              }}
            >
              →
            </button>
            <span className="hanger-dialog__count">
              {String(productIndex + 1).padStart(2, '0')} /{' '}
              {String(productCount).padStart(2, '0')}
            </span>
          </nav>
        )}
        <ProductDetails
          key={product.id}
          product={product}
          initialImageUrl={initialImageUrl}
          titleId={titleId}
          onClose={close}
        />
      </div>
    </dialog>,
    document.body,
  );
}

function imageLabel(
  image: HomeProduct['images']['nodes'][number],
  index: number,
) {
  const label = `${image.altText ?? ''} ${image.url.split('?')[0]}`;
  if (/three[-_ ]?quarter/i.test(label)) return 'Angle';
  if (/front/i.test(label)) return 'Front';
  if (/side/i.test(label)) return 'Side';
  if (/back/i.test(label)) return 'Back';
  return `View ${index + 1}`;
}

function ProductDetails({
  product,
  initialImageUrl,
  titleId,
  onClose,
}: {
  product: HomeProduct;
  initialImageUrl: string;
  titleId: string;
  onClose: () => void;
}) {
  const [imageIndex, setImageIndex] = useState(
    Math.max(
      0,
      product.images.nodes.findIndex((image) => image.url === initialImageUrl),
    ),
  );
  const state = productState(product);
  const images = product.images.nodes;
  const image = images[imageIndex];
  const variants = product.variants.nodes;
  const lowestPrice = variants.reduce<
    HomeProduct['variants']['nodes'][number] | undefined
  >(
    (lowest, item) =>
      !lowest || Number(item.price.amount) < Number(lowest.price.amount)
        ? item
        : lowest,
    undefined,
  )?.price;
  const price = lowestPrice;
  const priceVaries = variants.some(
    (item) => item.price.amount !== lowestPrice?.amount,
  );

  return (
    <>
      <div className="hanger-dialog__gallery">
        {image ? (
          <img
            key={image.url}
            className="hanger-dialog__image"
            src={image.url}
            width={image.width ?? 500}
            height={image.height ?? 935}
            alt={`${product.title} — ${imageLabel(image, imageIndex)}`}
          />
        ) : (
          <p>Image coming soon</p>
        )}
      </div>
      <div className="hanger-dialog__details">
        <p className="hanger-dialog__eyebrow">
          {state === 'coming_soon'
            ? 'Coming soon'
            : state === 'sold_out'
              ? 'Sold out'
              : 'The collection'}
        </p>
        <h2 id={titleId}>{product.title}</h2>
        <div className="hanger-dialog__price">
          {state === 'coming_soon' && Number(price?.amount) === 0
            ? 'Price at launch'
            : price && (
                <>
                  {priceVaries && 'From '}
                  <Money data={price} />
                </>
              )}
        </div>
        {images.length > 1 && (
          <div className="hanger-dialog__angles" aria-label="Product angles">
            {images.map((item, index) => (
              <button
                key={item.url}
                type="button"
                aria-label={`View image ${index + 1}: ${imageLabel(item, index)}`}
                aria-pressed={imageIndex === index}
                onClick={() => setImageIndex(index)}
              >
                {imageLabel(item, index)}
              </button>
            ))}
          </div>
        )}
        <div className="hanger-dialog__actions">
          <Link
            className="hanger-dialog__availability-btn"
            to={`/products/${product.handle}`}
            onClick={onClose}
          >
            <span>See availability</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </>
  );
}
