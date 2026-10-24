import {useEffect} from 'react';
import {useLocation} from 'react-router';

/**
 * Attaches an IntersectionObserver to observe product cards across all pages.
 * When cards enter the viewport, they are revealed with a subtle slide up from bottom
 * and a staggered left-to-right animation curve (inspired by sevenheavens.de).
 */
export function useScrollReveal() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Ensure document element has the js class so CSS applies
    document.documentElement.classList.add('js');

    const revealAll = () => {
      const cards = document.querySelectorAll('.t77-card, .t77-preview-card');
      cards.forEach((card) => card.classList.add('is-revealed'));
    };

    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.05,
      },
    );

    const observeUnrevealed = () => {
      const cards = document.querySelectorAll(
        '.t77-card:not(.is-revealed), .t77-preview-card:not(.is-revealed)',
      );
      cards.forEach((card) => observer.observe(card));
    };

    // Run initial observe
    observeUnrevealed();

    // Use MutationObserver so dynamically rendered, paginated, or filtered cards are observed
    const mutationObserver = new MutationObserver(() => {
      observeUnrevealed();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname, location.search]);
}
