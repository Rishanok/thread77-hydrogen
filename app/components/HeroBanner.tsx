import React from 'react';

export function HeroBanner({heading = 'new arrivals'}: {heading?: string}) {
  return (
    <div className="t77-hero-container">
      {/* Hero Media Background */}
      <div className="t77-hero-media">
        <picture className="t77-hero-picture">
          <source media="(max-width: 768px)" srcSet="/thread77-mobile-hero.jpg" />
          <img
            src="/thread77-exact-hero.jpg"
            alt="Thread77 New Arrivals"
            className="t77-hero-bg-img"
            loading="eager"
          />
        </picture>
      </div>

      {/* Center Lowercase Heading (Screenshot 1) */}
      <div className="t77-hero-center-text">
        <h1 className="t77-hero-title-lowercase">{heading}</h1>
      </div>

      {/* Floating Currency Selector Pill (Screenshot 1) */}
      <div className="t77-currency-pill" role="button" tabIndex={0} aria-label="Select Currency">
        <span style={{fontSize: '14px', lineHeight: 1}}>🇮🇳</span>
        <span>INR &#9662;</span>
      </div>
    </div>
  );
}
