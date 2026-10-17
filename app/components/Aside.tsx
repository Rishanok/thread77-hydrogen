import {
  createContext,
  useCallback,
  useRef,
  useId,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {useLocation} from 'react-router';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (expanded) {
      if (element.open) return;
      element.showModal();
      // Search is ready to type; other panels start at their visible close control.
      element
        .querySelector<HTMLElement>(
          type === 'search' ? 'input[type="search"]' : '.drawer__close',
        )
        ?.focus({preventScroll: true});
    } else if (element.open) {
      let cancelled = false;
      const animations =
        element.querySelector('.drawer__panel')?.getAnimations() ?? [];
      // No timing guess: close after the actual exit, or immediately if motion
      // is disabled. A new open request cancels this pending close.
      void Promise.all(
        animations.map((animation) => animation.finished.catch(() => {})),
      ).then(() => {
        if (!cancelled) element.close();
      });
      return () => {
        cancelled = true;
      };
    }
  }, [expanded, type]);

  useEffect(() => {
    const element = dialog.current;
    return () => element?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      id={`drawer-${type}`}
      aria-labelledby={headingId}
      className="overlay"
      data-state={expanded ? 'open' : 'closing'}
      data-drawer={type}
      onCancel={(event) => {
        // Keep the native modal open until its exit animation finishes.
        event.preventDefault();
        close();
      }}
      onClose={() => {
        if (expanded && !dialog.current?.open) close();
      }}
    >
      <button
        type="button"
        className="close-outside"
        onClick={close}
        aria-label="Close panel"
        tabIndex={-1}
      />
      <aside className="drawer__panel">
        <header className="drawer__header">
          <div>
            <span className="drawer__eyebrow">THREAD77</span>
            <h2 id={headingId}>{heading}</h2>
          </div>
          <button
            type="button"
            className="drawer__close"
            onClick={close}
            aria-label="Close panel"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </header>
        <div className="drawer__content">{children}</div>
      </aside>
    </dialog>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const close = useCallback(() => setType('closed'), []);
  const location = useLocation();

  useEffect(() => {
    close();
  }, [location.key, close]);

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close,
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
