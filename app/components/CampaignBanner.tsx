import React from 'react';

export function CampaignBanner({heading = 'Back in Stock'}: {heading?: string}) {
  return (
    <section className="t77-secondary-banner">
      <div className="t77-secondary-banner__media">
        <img
          src="/thread77-exact-backinstock.jpg"
          alt={heading}
          className="t77-secondary-banner__img"
          loading="lazy"
        />
      </div>
      <div className="t77-secondary-banner__content">
        <h2 className="t77-secondary-banner__title">{heading}</h2>
      </div>
    </section>
  );
}
