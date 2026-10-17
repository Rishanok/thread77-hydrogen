import {Link} from 'react-router';
import {useDragScroll} from '~/lib/useDragScroll';

export function BrandStatement({
  mark = 'THREAD 77',
  body = 'Born from long nights and early starts, rooted in a vision of authenticity and self-expression through what we wear. For us it is about the everyday grind, the culture around it, and the people we meet along the way.',
}: {
  mark?: string;
  body?: string;
}) {
  return (
    <section className="t77h-statement">
      <div className="t77h-statement__mark">{mark}</div>
      <p className="t77h-statement__body">{body}</p>
    </section>
  );
}

export interface PromoItem {
  image: string;
  title: string;
  cta: string;
  url: string;
  external?: boolean;
}

export function PromoRows({
  items,
  split = false,
}: {
  items: PromoItem[];
  split?: boolean;
}) {
  return (
    <div className={`t77h-promos ${split ? 't77h-promos--split' : ''}`}>
      {items.map((item) => {
        const inner = (
          <>
            <img
              src={item.image}
              alt={item.title}
              className="t77h-promo__img"
              loading="lazy"
            />
            <div className="t77h-promo__scrim" />
            <div className="t77h-promo__row">
              <h2 className="t77h-promo__title">{item.title}</h2>
              <span className="t77h-promo__cta">{item.cta} &rarr;</span>
            </div>
          </>
        );

        return item.external ? (
          <a
            key={item.title}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="t77h-promo"
          >
            {inner}
          </a>
        ) : (
          <Link key={item.title} to={item.url} className="t77h-promo">
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

export function LookbookStrip({
  title = 'More than clothing',
  images,
}: {
  title?: string;
  images: string[];
}) {
  const {ref, isDragging, handlers} = useDragScroll<HTMLDivElement>();

  return (
    <section className="t77h-lookbook">
      <div className="t77h-lookbook__head">
        <h2 className="t77h-lookbook__title">{title}</h2>
        <span className="t77h-lookbook__hint">Swipe &rarr;</span>
      </div>
      <div
        ref={ref}
        className={`t77h-lookbook__track ${isDragging ? 'is-dragging' : ''}`}
        {...handlers}
      >
        {images.map((src) => (
          <div key={src} className="t77h-lookbook__frame">
            <img
              src={src}
              alt=""
              className="t77h-lookbook__img"
              loading="lazy"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SerifMarquee({
  items = [
    'More than clothing',
    'Crafted for everyday rebels',
    'Made for the grind',
  ],
}: {
  items?: string[];
}) {
  // Duplicated so the -50% keyframe loops seamlessly.
  const loop = [0, 1].flatMap((copy) =>
    items.map((item) => ({item, key: `${copy}-${item}`})),
  );

  return (
    <section className="t77h-marquee" aria-hidden="true">
      <div className="t77h-marquee__track">
        {loop.map(({item, key}) => (
          <span key={key} className="t77h-marquee__item">
            {item}
            <span className="t77h-marquee__dot"> &#9679; </span>
          </span>
        ))}
      </div>
    </section>
  );
}
