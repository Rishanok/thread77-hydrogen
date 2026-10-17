import {useDesignPreview} from '~/lib/useDesignPreview';
import React from 'react';
import {NavLink, useNavigate} from 'react-router';
import {usePreviewBag} from '~/lib/previewBag';
import {useAside} from '~/components/Aside';

export function MobileBottomNav({cartCount = 0}: {cartCount?: number}) {
  const {open, type: activeDrawer} = useAside();
  const navigate = useNavigate();
  const bag = usePreviewBag();
  const isPreview = useDesignPreview();
  const shownCount = isPreview ? bag.count : cartCount;

  return (
    <nav
      className="t77-mobile-nav"
      role="navigation"
      aria-label="Mobile Bottom Navigation"
    >
      {/* 1. Home */}
      <NavLink
        to="/"
        end
        className={({isActive}) =>
          `t77-mobile-nav__item ${isActive ? 'is-active' : ''}`
        }
        aria-label="Home"
      >
        <svg
          className="t77-mobile-nav__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="t77-mobile-nav__label">HOME</span>
      </NavLink>

      {/* 2. Shop */}
      <NavLink
        to="/collections/all"
        className={({isActive}) =>
          `t77-mobile-nav__item ${isActive ? 'is-active' : ''}`
        }
        aria-label="Shop"
      >
        <svg
          className="t77-mobile-nav__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="7" height="7" x="3" y="3" rx="0" />
          <rect width="7" height="7" x="14" y="3" rx="0" />
          <rect width="7" height="7" x="14" y="14" rx="0" />
          <rect width="7" height="7" x="3" y="14" rx="0" />
        </svg>
        <span className="t77-mobile-nav__label">SHOP</span>
      </NavLink>

      {/* 3. Search */}
      <button
        type="button"
        className="t77-mobile-nav__item"
        onClick={() => open('search')}
        aria-label="Search"
        aria-haspopup="dialog"
        aria-controls="drawer-search"
        aria-expanded={activeDrawer === 'search'}
      >
        <svg
          className="t77-mobile-nav__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4.3-4.3" />
        </svg>
        <span className="t77-mobile-nav__label">SEARCH</span>
      </button>

      {/* 4. Account */}
      <NavLink
        to="/account"
        className={({isActive}) =>
          `t77-mobile-nav__item ${isActive ? 'is-active' : ''}`
        }
        aria-label="Account"
      >
        <svg
          className="t77-mobile-nav__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="7" r="4" />
          <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
        </svg>
        <span className="t77-mobile-nav__label">ACCOUNT</span>
      </NavLink>

      {/* 5. Bag */}
      <button
        type="button"
        className="t77-mobile-nav__item"
        onClick={() =>
          isPreview ? void navigate('/preview/cart') : open('cart')
        }
        aria-label="Bag"
        aria-haspopup={isPreview ? undefined : 'dialog'}
        aria-controls={isPreview ? undefined : 'drawer-cart'}
        aria-expanded={isPreview ? undefined : activeDrawer === 'cart'}
      >
        <div className="t77-mobile-nav__icon-wrap">
          <svg
            className="t77-mobile-nav__icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {shownCount > 0 && (
            <span className="t77-mobile-nav__badge">{shownCount}</span>
          )}
        </div>
        <span className="t77-mobile-nav__label">BAG</span>
      </button>
    </nav>
  );
}
