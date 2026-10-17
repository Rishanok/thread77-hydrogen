# Hero polish and right-side drawers

The floor shadow now lives inside the same progress layer as the garment frames. Width, lateral offset, skew and opacity derive from `--jeans-reveal`, so side/three-quarter/front, interrupted turns and reversal use the same 360ms progress. Neighbor shadows continue to slide with their corresponding assemblies. Reduced-motion changes remain immediate.

The heading is now “Denim, in motion.” with a restrained serif italic accent, a clearly separated edition line and the supporting copy “A new perspective on your everyday uniform.” The mobile heading remains compact and the desktop scene reserves room for the category bar.

The old drawer overlay had z-index 10, below the header (60) and mobile navigation (99999). It also positioned the cart summary absolutely with a fixed width/height allowance, risking overlap on short screens and long carts. The replacement uses native modal dialogs in the browser top layer, a fixed visible 44px close control, a full backdrop close target, Escape dismissal, native focus containment/restoration and scroll locking. Drawers slide in/out on the right; the native modal closes only once the actual exit animation finishes. Pending closure is cancelled on reopening. Reduced motion also covers the backdrop. Phone drawers use the full width and dynamic viewport height with safe-area padding and one content scroller.

Search now focuses its field on open, supports Enter and the submit button, and URL-encodes the query. The cart summary is in normal flow so discount/gift-card fields and checkout remain reachable. Empty/error/loading messages and drawer typography are updated. Header/mobile triggers expose their dialog relationships and expanded state. Account routing and all Shopify cart operations remain unchanged.

Changed files: `InteractiveJeansHero.tsx`, `InteractiveJeansHero.css`, `Aside.tsx`, `PageLayout.tsx`, `SearchFormPredictive.tsx`, `CartMain.tsx`, `Header.tsx`, `MobileBottomNav.tsx`, and `app.css`.

Verification: TypeScript, production build and all 15 existing tests pass. ESLint has only the two existing console warnings in audit scripts. Browser verification was requested and declined; no new screenshots or claims of verified focus/mobile behavior are made. The implementation still needs browser review of repeated opening/closing, focus return, long-cart scrolling and viewport composition.
