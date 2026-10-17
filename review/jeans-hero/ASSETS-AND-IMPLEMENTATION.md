# Three-jeans closet update — 17 October 2026

This section supersedes the historical report below. Positions 01–03 now use distinct jeans; only position 04 repeats Jean 1 and is labelled as a preview.

## New artwork and extraction

Inspected all six source images in `public/products/jean-2` and `public/products/jean-3`: `side.png`, `three-quarter.png`, and `front.png`. Each is an RGB PNG with a baked checkerboard, not an alpha-transparent image. Sources are 500 pixels wide and 934 or 935 pixels tall.

Added `side-transparent.png`, `three-quarter-transparent.png`, and `front-transparent.png` beside each set of originals. The originals remain untouched. `scripts/prepare_new_jeans_assets.py` reproduces extraction using Python/OpenCV/Pillow/NumPy, following the user's existing authorization for direct background removal. These remain offline preparation dependencies.

The new RGBA files preserve the entire original hanger, metal highlights, denim texture, light graphics, chains and red stars. Retained RGB values match the source pixel-for-pixel. All six have alpha ranging from 0 to 255. Automated checks confirm transparent outer borders and hook openings, plus opaque hanger stems and bars. `new-jeans-alpha-audit.json` records dimensions, visible bounds and pixel counts. `new-jeans-matte-review.jpg` shows all six cutouts against dark and light surfaces; no checkerboard boxes are visible in that inspected composite.

The source canvases are retained at their native dimensions. Per-frame measurements in `app/data/hangingJeans.ts` normalize them into the common 440 × 700 display stage, aligning the stem at source y=100 and the hem at stage y=644. This uses uniform scaling, never horizontal compression. Saved PNGs contain the complete upper hook; the scene clips the first 100 source rows only because its SVG supplies that hook, preventing duplication while retaining the lower hanger and clips.

## Scene and interaction

Jean 2 is labelled Charcoal denim; Jean 3 is labelled Gothic denim. These are descriptive artwork labels, not invented Shopify product handles. Existing collection navigation and optional product URL handling are preserved. Nine distinct frames preload/decode, with the fourth preview sharing Jean 1's cached images. The side → three-quarter → front reveal remains 360 ms, holds on hover and reverses on exit. Touch selection/cycling, keyboard controls and reduced-motion behavior remain in place.

The preceding requested closet refinement is also present: the hook is shorter (32px desktop / 25px mobile), garments sit closer together, and neighbors slide toward their respective sides when an item is active. Each neighbor's hook, garment and caption share the same lateral offset; the rail stays stationary. Pointer hit areas remain stationary. Selecting another garment resets the previous garment's view. These motion changes have not received a fresh browser verification in this pass.

## Changed files and verification

- `app/data/hangingJeans.ts`: add Jean 2/3 frames, measured pivots, normalized lengths and labels.
- `app/components/InteractiveJeansHero.tsx`: update preview copy; contains the preceding shorter-hook and shared active-position changes.
- `app/styles/InteractiveJeansHero.css`: contains the preceding closer spacing and synchronized neighbor movement; formatting checked.
- `scripts/prepare_new_jeans_assets.py`: repeatable extraction and audit generation.
- Six new transparent PNGs and `new-jeans-*` audit/review artifacts.

TypeScript, production build, Prettier and all 15 existing tests pass. ESLint has no errors and retains two unrelated `no-console` warnings. Headless Chrome verification was requested but permission was declined, so desktop/touch interaction, hook connections and rendered visual continuity were **not freshly verified**. Existing `trio-*` screenshots/results below document the older single-jean implementation and must not be treated as validation of this update.

Three still images provide a blended reveal, not continuous photographic rotation. Different silhouettes can overlap during crossfades. Two additional matched intermediate views per garment (one between each existing pair) would improve continuity if required. Jean 4 artwork and real product URLs remain to be supplied.

---

# Historical report — 16 October 2026

This report supersedes the earlier four-view Gothic denim implementation. The latest inputs are the user's three blue-wash jeans images in `public/products/jean-1`: `right.png`, `three-quarter.png`, and `front.png`. All three are 500 × 935 RGB images with a baked-in checkerboard, not transparent PNGs.

## Final assets

- `public/products/jean-1/right-transparent.png`
- `public/products/jean-1/three-quarter-transparent.png`
- `public/products/jean-1/front-transparent.png`

Each is a 500 × 935 RGBA cutout with the full original hanger, including the upper metal hook, black bar and clips. The originals are untouched. Background removal was performed directly on the originals using Python after the user explicitly approved that approach. `scripts/prepare_jeans_assets.py` reproduces the masks using Pillow, NumPy, SciPy and OpenCV; these are asset-preparation tools, not storefront runtime dependencies.

The mask isolates the foreground, removes the checkerboard (including hook and leg openings), preserves shiny metal and cloth highlights, and softens only the matte boundary. Retained RGB pixels match the original image exactly; this was checked pixel by pixel. Alpha spans 0–255, with zero alpha at the corners, in the hook opening and in the front leg gap. Dark-matte previews and the rendered studio scene were inspected. No checkerboard rectangles or background boxes are visible in the reviewed hero screenshots. These are extracted 500-pixel-wide source images, not regenerated high-resolution product photos.

## Suspension and source limitations

The existing rail, SVG hook geometry, swivel geometry, studio background, layout and typography have not been restyled or repositioned. The PNG files preserve the entire hanger. In the scene, only the upper 70 source rows are clipped from the image layer because the existing fixed SVG already supplies the upper hook; displaying both would duplicate it. This is layer separation of a genuinely transparent cutout, not masking an opaque background. The lower hanger and its waistband clips remain visible.

Each frame has its own measured pivot and hanging length. Frames are uniformly scaled into the existing 440 × 700 stage, sharing a top suspension pivot and a 644-unit hem position. No stretch, mirrored substitution or flat-image `rotateY()` is used.

**The lower clip bar changes perspective in the supplied photos.** It therefore changes with its corresponding jeans frame. The shared rail, upper hooks and swivels remain fixed, but the lower clip bar is not identical in every view. A literally invariant lower hanger would require separately photographed garment-only layers plus one fixed hanger, with compatible waistband attachment points; forcing the current wide front hanger over the narrow side image would detach its clips. This limitation is not hidden by CSS.

Three discrete views also cannot reproduce all intermediate cloth geometry. The reveal is a short, smoothly blended sequence rather than a true 3D turn. For a more photographic turn, the minimum useful addition is one matched frame between side and three-quarter and one between three-quarter and front, with consistent scale, lighting and pivot. Five total views would reduce the large silhouette changes; they still would not constitute continuous 3D geometry.

## Interaction

The default is right-side profile. A mouse hover sets a continuous CSS progress value from 0 to 1 over 360 ms. Side, three-quarter and front opacities are derived from that same value, so the middle view appears between the endpoints. The front holds until exit. Exiting retargets the same transition to 0 from its current progress, including rapid enter/leave; there are no JavaScript animation timers, loops, interval delays or queued frame sequences.

All three views preload and decode once per URL, shared by the four independent garment instances. Positions 02–04 remain clearly labelled Jean 1 previews, as approved. Touch selects on the first tap and cycles on later taps; dedicated cycle buttons remain available. Keyboard arrows/Enter/Space change views, and Escape/Home returns to side. Reduced motion disables hover animation and makes manual changes immediate. Links remain separate from garment inspection controls.

## Changed implementation files

- `app/components/InteractiveJeansHero.tsx`: replace timed multi-view cycling with reversible three-view progress; preload/decode all views; retain accessibility and independent state.
- `app/data/hangingJeans.ts`: three clean assets, measured pivots, default order and deduplicated view preloads. Update the garment description to match the new blue-wash images.
- `app/styles/InteractiveJeansHero.css`: register and transition the reveal progress; derive three frame opacities; extend reduced-motion handling. Existing rail/hook/swivel declarations remain unchanged.
- `app/routes/_index.tsx`: use the three-view preload list.
- `scripts/prepare_jeans_assets.py`: repeatable, pixel-preserving background extraction.
- The three transparent PNGs listed above and review artifacts in this directory.

Existing Shopify queries, product routes, cart and checkout code are unchanged. No product handles or prices were invented.

## Verification

TypeScript, ESLint, Prettier and the production build pass. ESLint retains two existing `no-console` warnings in the unrelated catalog/admin audit scripts.

`trio-browser-results.json` records Chrome checks for: side as default; three eager image requests; immediate response; visible middle view; front holding; reverse and rapid re-entry; all four independent positions; fixed rail/hook/swivel bounds; keyboard and reduced-motion controls; touch behavior and collection navigation at 768, 390 and 320 px. No uncaught browser errors occurred. `trio-rest.png`, `trio-front.png`, and `trio-mobile-*.png` show the current result. Earlier screenshots without the `trio-` prefix belong to the previous implementation.

## Image-tool attempts

Built-in imagegen was tried first using each source as an edit target and requesting transparent background extraction while preserving the full hanger. Those outputs were rejected for colored fringe artifacts and are not used by the storefront. The user then explicitly approved Python extraction from the originals, which produced the final files above.

The same built-in edit prompt was used for the three discarded candidates:

> Precise background extraction ONLY. Edit the supplied image, do not redraw, restyle, zoom or change the subject. The gray and white checkerboard and diagonal pale marks are baked-in background pixels: DELETE ALL OF THEM and replace them with real zero-alpha transparent empty pixels. Preserve the entire blue washed wide-leg denim jeans AND THE COMPLETE ORIGINAL HANGER including metal hook, stem, black bar and both clips exactly. Do not remove or simplify the hanger. Keep the exact original view, crop, proportions, texture, wash, hems and placement. Remove background also inside the hook, between the hanger bar and waistband, and between the legs. NO replacement background, NO gradients, NO glow, NO shadows, NO checkerboard in result, NO semi-transparent haze. Only jeans and hanger should have nonzero alpha. Keep original portrait framing and generous transparency around the object. This is an asset extraction, not a new fashion illustration.
