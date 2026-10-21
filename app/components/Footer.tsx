import {Suspense} from 'react';
import {Await, Link} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {storefrontMenuUrl} from '~/lib/menu';
import {useScrollReveal} from '~/lib/useScrollReveal';

export function Footer({
  footer,
  header,
  publicStoreDomain,
}: {
  footer?: Promise<FooterQuery | null>;
  header?: HeaderQuery;
  publicStoreDomain?: string;
}) {
  const revealRef = useScrollReveal<HTMLElement>();

  const policyFallback = (
    <>
      <Link to="/policies/shipping-policy" className="t77-footer-link">
        Shipping Policy
      </Link>
      <Link to="/policies/refund-policy" className="t77-footer-link">
        Refund Policy
      </Link>
      <Link to="/policies/privacy-policy" className="t77-footer-link">
        Privacy Policy
      </Link>
      <Link to="/policies/terms-of-service" className="t77-footer-link">
        Terms of Service
      </Link>
    </>
  );

  return (
    <footer className="t77-footer" ref={revealRef}>
      <div className="t77-footer-inner" data-reveal-group>
        <div className="t77-footer-brand">
          <Link to="/" className="t77-footer-logo" aria-label="Thread77 home">
            THREAD 77
          </Link>
          <p className="t77-footer-desc">
            Your everyday, reimagined. Premium denim, relaxed essentials, and elevated streetwear built for continuous motion.
          </p>
          <Link className="t77-footer-cta" to="/collections/all">
            <span>Explore collection</span>
            <span aria-hidden="true" className="t77-footer-cta-arrow">↗</span>
          </Link>
        </div>

        <div className="t77-footer-navs">
          <nav className="t77-footer-nav" aria-label="Shop">
            <h3 className="t77-footer-heading">Explore</h3>
            <div className="t77-footer-links">
              <Link to="/collections/all" className="t77-footer-link">Shop all</Link>
              <Link to="/collections/all?sort=newest" className="t77-footer-link">New arrivals</Link>
              <Link to="/collections/jeans" className="t77-footer-link">Jeans & Denim</Link>
              <Link to="/collections/tees" className="t77-footer-link">Tees & Tops</Link>
            </div>
          </nav>

          <nav className="t77-footer-nav" aria-label="Customer care and policies">
            <h3 className="t77-footer-heading">Policies</h3>
            <div className="t77-footer-links">
              <Suspense fallback={policyFallback}>
                <Await resolve={footer} errorElement={policyFallback}>
                  {(data) =>
                    data?.menu?.items.length
                      ? data.menu.items.map((item) => {
                          const url = storefrontMenuUrl(item.url, [
                            header?.shop.primaryDomain.url,
                            publicStoreDomain,
                          ]);
                          return url ? (
                            <Link key={item.id} className="t77-footer-link" to={url}>
                              {item.title}
                            </Link>
                          ) : null;
                        })
                      : policyFallback
                  }
                </Await>
              </Suspense>
            </div>
          </nav>

          <nav className="t77-footer-nav" aria-label="Account">
            <h3 className="t77-footer-heading">Account</h3>
            <div className="t77-footer-links">
              <Link to="/account" className="t77-footer-link">Your account</Link>
              <Link to="/account/orders" className="t77-footer-link">Orders & tracking</Link>
              <Link to="/policies/refund-policy" className="t77-footer-link">Returns & exchanges</Link>
            </div>
          </nav>
        </div>
      </div>

      <div className="t77-footer-bottom">
        <span className="t77-footer-copyright">
          © {new Date().getFullYear()} Thread77. All rights reserved.
        </span>

        <button
          type="button"
          className="t77-back-to-top"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches
                ? 'instant'
                : 'smooth',
            })
          }
          aria-label="Back to top"
        >
          <span>Back to top</span>
          <svg
            className="t77-back-to-top-arrow"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </footer>
  );
}
