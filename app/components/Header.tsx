import {useDesignPreview} from '~/lib/useDesignPreview';
import {usePreviewBag} from '~/lib/previewBag';
import {Suspense, useEffect, useState} from 'react';
import {Await, NavLink, useAsyncValue, useLocation} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {storefrontMenuUrl} from '~/lib/menu';
import {useAside} from '~/components/Aside';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {open, type: activeDrawer} = useAside();
  const {pathname} = useLocation();
  // Only the homepage has a full-bleed hero for the header to float over.
  const isOverlay = pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!isOverlay) return;
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, [isOverlay]);

  const headerClass = [
    't77-hero-header',
    isOverlay ? 'is-overlay' : 'is-solid',
    isOverlay && isScrolled ? 'is-scrolled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClass}>
      {/* Left: MENU trigger (drawer holds the full navigation) */}
      <div className="t77-hero-header__nav">
        <button
          type="button"
          className="t77-hero-nav__link t77-hero-menu-btn"
          onClick={() => open('mobile')}
          aria-haspopup="dialog"
          aria-controls="drawer-mobile"
          aria-expanded={activeDrawer === 'mobile'}
        >
          Collection
        </button>
        <NavLink
          to="/collections/tees"
          className="t77-hero-nav__link t77-header-category"
        >
          Tees
        </NavLink>
        <NavLink
          to="/collections/jeans"
          className="t77-hero-nav__link t77-header-category"
        >
          Jeans
        </NavLink>
        <NavLink
          to="/collections/all"
          className="t77-hero-nav__link t77-header-category"
        >
          Shop all
        </NavLink>
      </div>

      <button
        type="button"
        className="t77-hero-mobile-toggle"
        onClick={() => open('mobile')}
        aria-haspopup="dialog"
        aria-controls="drawer-mobile"
        aria-expanded={activeDrawer === 'mobile'}
        aria-label="Open menu"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Center Brand Logo */}
      <div className="t77-hero-header__logo">
        <NavLink
          to="/"
          className="t77-hero-logo__link"
          aria-label="Thread77 Home"
        >
          <span className="t77-hero-logo__text">THREAD 77</span>
        </NavLink>
      </div>

      {/* Right Action Icons (Account & Cart Bag) */}
      <div className="t77-hero-header__actions">
        {/* Search */}
        <button
          type="button"
          className="t77-hero-icon__btn"
          onClick={() => open('search')}
          aria-label="Search"
          aria-haspopup="dialog"
          aria-controls="drawer-search"
          aria-expanded={activeDrawer === 'search'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m20 20-4.3-4.3"></path>
          </svg>
        </button>

        {/* Account */}
        <NavLink
          to="/account"
          className="t77-hero-icon__btn"
          aria-label="Account"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="7" r="4"></circle>
            <path d="M5.5 21a8.38 8.38 0 0 1 13 0"></path>
          </svg>
        </NavLink>

        {/* Cart Bag */}
        <CartToggle cart={cart} />
      </div>
    </header>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  const preview = useDesignPreview();
  const bag = usePreviewBag();
  if (preview)
    return (
      <NavLink
        className="t77-header-category t77-preview-bag-link"
        to="/preview/cart"
      >
        Bag ({bag.count})
      </NavLink>
    );
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

function CartBadge({count}: {count: number | null}) {
  const {open, type: activeDrawer} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <button
      type="button"
      className="t77-hero-icon__btn"
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      aria-label="Cart"
      aria-haspopup="dialog"
      aria-controls="drawer-cart"
      aria-expanded={activeDrawer === 'cart'}
    >
      <div
        style={{position: 'relative', display: 'flex', alignItems: 'center'}}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        {count !== null && count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-8px',
              background: '#000000',
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: 700,
              minWidth: '15px',
              height: '15px',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 2px',
            }}
          >
            {count}
          </span>
        )}
      </div>
    </button>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu?: HeaderQuery['menu'];
  primaryDomainUrl?: string;
  viewport: 'desktop' | 'mobile';
  publicStoreDomain?: string;
}) {
  const {close} = useAside();

  const navItems = menu?.items?.length
    ? menu.items
    : [
        {id: 'all', title: 'Shop all', url: '/collections/all', items: []},
        {
          id: 'collections',
          title: 'Collections',
          url: '/collections',
          items: [],
        },
        {id: 'account', title: 'My account', url: '/account', items: []},
      ];

  return (
    <nav
      className={`t77-header-menu t77-header-menu--${viewport}`}
      aria-label="Shop navigation"
    >
      {navItems.map((item) => {
        const url = storefrontMenuUrl(item.url, [
          primaryDomainUrl,
          publicStoreDomain,
        ]);
        return (
          <div key={item.id}>
            {url && (
              <NavLink
                to={url}
                onClick={close}
                className="t77-menu-link"
                prefetch="intent"
              >
                {item.title}
              </NavLink>
            )}
            {item.items?.map((child) => {
              const childUrl = storefrontMenuUrl(child.url, [
                primaryDomainUrl,
                publicStoreDomain,
              ]);
              return childUrl ? (
                <NavLink
                  key={child.id}
                  to={childUrl}
                  onClick={close}
                  className="t77-menu-link"
                  prefetch="intent"
                >
                  {child.title}
                </NavLink>
              ) : null;
            })}
          </div>
        );
      })}
    </nav>
  );
}
