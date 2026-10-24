import {NavLink} from 'react-router';
import {useAside} from '~/components/Aside';

export function MobileBottomNav({cartCount = 0}: {cartCount?: number}) {
  const {type: activeDrawer} = useAside();
  const isDrawerOpen = activeDrawer !== 'closed';

  return (
    <nav
      className={`t77-mobile-nav ${isDrawerOpen ? 'is-hidden' : ''}`}
      role="navigation"
      aria-label="Mobile Navigation"
      aria-hidden={isDrawerOpen}
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
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="t77-mobile-nav__label">Home</span>
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
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect width="7" height="7" x="3" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="14" rx="1.5" />
          <rect width="7" height="7" x="3" y="14" rx="1.5" />
        </svg>
        <span className="t77-mobile-nav__label">Shop</span>
      </NavLink>

      {/* 3. Account */}
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
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="7" r="4" />
          <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
        </svg>
        <span className="t77-mobile-nav__label">Account</span>
      </NavLink>
    </nav>
  );
}
