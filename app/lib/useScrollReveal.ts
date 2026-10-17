import {useEffect, useRef} from 'react';

/** Progressive enhancement: content stays visible without JS or motion support. */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !('IntersectionObserver' in window) || !root.animate) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const seen = new WeakSet<Element>();
    const active = new Map<HTMLElement, Animation>();
    const targets = root.querySelectorAll<HTMLElement>(
      '[data-reveal], [data-reveal-group] > *',
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || preference.matches) continue;
          const element = entry.target as HTMLElement;
          if (seen.has(element)) continue;
          seen.add(element);
          observer.unobserve(element);
          const group = element.parentElement;
          const order = group?.hasAttribute('data-reveal-group')
            ? Array.from(group.children).indexOf(element)
            : 0;
          const animation = element.animate(
            [
              {opacity: 0, transform: 'translateY(18px)'},
              {opacity: 1, transform: 'translateY(0)'},
            ],
            {
              duration: 620,
              delay: Math.min(order * 70, 210),
              easing: 'cubic-bezier(.22, 1, .36, 1)',
              fill: 'backwards',
            },
          );
          active.set(element, animation);
          animation.onfinish = () => active.delete(element);
        }
      },
      {threshold: 0.08},
    );
    const updatePreference = () => {
      if (preference.matches) {
        observer.disconnect();
        active.forEach((animation) => animation.cancel());
        active.clear();
      } else {
        targets.forEach((element) => {
          if (!seen.has(element)) observer.observe(element);
        });
      }
    };
    const revealFocused = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) return;
      active.forEach((animation, element) => {
        if (element.contains(event.target as Node)) animation.finish();
      });
      // A keyboard user must never land in a newly faded section.
      targets.forEach((element) => {
        if (element.contains(event.target as Node)) {
          seen.add(element);
          observer.unobserve(element);
        }
      });
    };
    updatePreference();
    preference.addEventListener('change', updatePreference);
    root.addEventListener('focusin', revealFocused);
    return () => {
      observer.disconnect();
      active.forEach((animation) => animation.cancel());
      preference.removeEventListener('change', updatePreference);
      root.removeEventListener('focusin', revealFocused);
    };
  }, []);

  return ref;
}
