import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router';

export interface HeroSlide {
  image: string;
  eyebrow: string;
  title: string;
  ctaLabel: string;
  ctaUrl: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    image: '/thread77-exact-hero.jpg',
    eyebrow: 'Collection 01',
    title: 'Explore our first collection',
    ctaLabel: 'Shop now',
    ctaUrl: '/collections/all',
  },
  {
    image: '/thread77-lookbook.jpg',
    eyebrow: 'New arrivals',
    title: 'Built for the everyday grind',
    ctaLabel: 'Shop new in',
    ctaUrl: '/collections/all',
  },
  {
    image: '/thread77-female-diptych.jpg',
    eyebrow: 'Crafted for everyday rebels',
    title: 'A modern take on streetwear',
    ctaLabel: 'View all',
    ctaUrl: '/collections/all',
  },
];

export function HeroSlideshow({
  slides = DEFAULT_SLIDES,
  interval = 6500,
}: {
  slides?: HeroSlide[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;
    const id = window.setInterval(next, interval);
    return () => window.clearInterval(id);
  }, [next, interval, slides.length]);

  const active = slides[index];

  return (
    <section className="t77h-hero" aria-roledescription="carousel">
      {slides.map((slide, i) => (
        <div
          key={slide.image}
          className={`t77h-hero__slide ${i === index ? 'is-active' : ''}`}
          aria-hidden={i !== index}
        >
          <img
            src={slide.image}
            alt={i === index ? slide.title : ''}
            className="t77h-hero__img"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      <div className="t77h-hero__scrim" />

      <div className="t77h-hero__content">
        <span className="t77h-hero__eyebrow">{active.eyebrow}</span>
        <h1 className="t77h-hero__title">{active.title}</h1>
        <Link to={active.ctaUrl} className="t77h-hero__cta">
          {active.ctaLabel} <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      <div className="t77h-hero__bar">
        <span className="t77h-hero__count">
          <b>{String(index + 1).padStart(2, '0')}</b> /{' '}
          {String(slides.length).padStart(2, '0')}
        </span>
        <button type="button" className="t77h-hero__next" onClick={next}>
          Next <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </section>
  );
}
