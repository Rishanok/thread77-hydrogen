# Light storefront and simplified hero

- Removed the hero's visible garment numbers, names, descriptions, angle labels, cycle icons, instructions and footer. Hover, direct tap, keyboard arrows/Enter/Space and Escape/Home remain available on the garment itself. Accessible names, instructions and status announcements remain. Optional real product URLs still render as separate links when supplied; current artwork has none.
- Kept the four garments, existing transparent artwork, suspension geometry, neighbor movement and side-to-front reveal. Updated the studio to a white/light-neutral background and softened garment shadows. Reclaimed the removed controls' vertical space for the garments on shorter screens.
- Updated the existing shared CSS in place: white page/navigation/footer/drawer surfaces, light neutral panels, dark text, readable muted text, visible borders/focus indicators and dark primary/selected buttons with white labels. Photos retain their original colors and white text over dark photo scrims where appropriate. Native controls explicitly use `color-scheme: light`; the browser theme-color is white.

Changed implementation: `app/components/InteractiveJeansHero.tsx`, `app/styles/InteractiveJeansHero.css`, `app/styles/app.css`, `app/styles/thread77.css`, `app/styles/thread77-editorial.css`, `app/styles/thread77-home.css`, `app/root.tsx`.

Validation: TypeScript, production build and all 15 existing tests passed. ESLint passed with two existing no-console warnings. Audited explicit CSS text/surface pairs and corrected inverted button states. No new browser visual verification was performed; the preceding browser permission request was declined. Earlier screenshots in this directory show the superseded dark design.
