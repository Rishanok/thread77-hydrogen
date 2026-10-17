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
  const fallback = (
    <>
      <Link to="/collections/all">Shop all</Link>
      <Link to="/policies">Store policies</Link>
      <Link to="/account">My account</Link>
    </>
  );
  return (
    <footer className="t77-footer" ref={revealRef}>
      <div className="t77-footer-grid" data-reveal-group>
        <div className="t77-footer-col t77-footer-col--brand">
          <span className="t77-section-kicker">Your everyday, reimagined.</span>
          <h2>Make it<br /><em>yours.</em></h2>
          <p>Find the pieces you’ll reach for again and again.</p>
          <Link className="t77-footer-shop" to="/collections/all">
            Explore the collection <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <nav className="t77-footer-col" aria-label="Footer shopping">
          <h3>Explore</h3>
          <Link to="/collections/all">Shop all</Link>
          <Link to="/collections/all?sort=newest">New arrivals</Link>
          <Link to="/collections">Our collections</Link>
          <Link to="/account">Your account</Link>
        </nav>
        <nav className="t77-footer-col" aria-label="Footer">
          <h3>Good to know</h3>
          <Suspense fallback={fallback}>
            <Await resolve={footer} errorElement={fallback}>
              {(data) =>
                data?.menu?.items.length
                  ? data.menu.items.map((item) => {
                      const url = storefrontMenuUrl(item.url, [
                        header?.shop.primaryDomain.url,
                        publicStoreDomain,
                      ]);
                      return (
                        <div key={item.id}>
                          {url && (
                            <Link className="t77-footer-col__link" to={url}>
                              {item.title}
                            </Link>
                          )}
                          {item.items.map((child) => {
                            const childUrl = storefrontMenuUrl(child.url, [
                              header?.shop.primaryDomain.url,
                              publicStoreDomain,
                            ]);
                            return childUrl ? (
                              <Link
                                key={child.id}
                                className="t77-footer-col__link"
                                to={childUrl}
                              >
                                {child.title}
                              </Link>
                            ) : null;
                          })}
                        </div>
                      );
                    })
                  : fallback
              }
            </Await>
          </Suspense>
        </nav>
      </div>
      <Link className="t77-footer-wordmark" to="/" aria-label="Thread77 home" data-reveal>
        THREAD77<span aria-hidden="true">®</span>
      </Link>
      <div className="t77-footer-bottom">
        <span>© Thread77 {new Date().getFullYear()}. All rights reserved.</span>
        <button
          type="button"
          onClick={() => window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          })}
          aria-label="Back to top"
        >
          Back to top <span aria-hidden="true">↑</span>
        </button>
      </div>
    </footer>
  );
}
