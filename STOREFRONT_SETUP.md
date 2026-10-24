# Thread77 storefront setup and verification

The active storefront is this Hydrogen project. The sibling Liquid theme exports and preview.html do not configure this application.

## Store connection

Keep actual credentials in local `.env` and the deployment environment, never in source control. The project already has a local `.env`; no credentials were changed during this work.

Required configuration includes `PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_API_TOKEN`, `PUBLIC_STOREFRONT_ID`, and a strong `SESSION_SECRET`. Use the storefront environment values supplied by Shopify. Keep private API tokens on the server. Set `PUBLIC_CHECKOUT_DOMAIN` to the actual checkout domain if it differs from the store domain; otherwise the application uses `PUBLIC_STORE_DOMAIN`.

The storefront country context is now `IN`, with English, to match the store's existing India-facing content. Enable the India market in Shopify and verify real INR prices and checkout shipping rates. Multi-country selection is not implemented.

The CLI reported that its signed-in account cannot access the linked store. An authorized store owner/developer needs to authenticate the Shopify CLI with an account that can access the linked Hydrogen storefront. Existing local environment values still allowed the homepage, catalogue, cart, and missing-product routes to respond.

## Catalogue and product details

1. Make products active and publish products and collections to the Hydrogen/Headless sales channel used by this storefront. Check variant prices, size/colour options, images, and stock in Shopify Admin.
2. The configured Storefront API currently returns one product and the `frontpage` collection. Products visible only on the Liquid Online Store are not automatically available to Hydrogen.
3. Demo and scraped data are no longer used as storefront fallbacks. Empty collections show an empty state; unknown product handles return 404. API failures are not disguised as products.
4. Add optional product metafields as plain text, with Storefront read access:
   - `custom.fabric`
   - `custom.fit`
   - `custom.care`
   - `custom.size_guide`
     Use single-line or multi-line text definitions. Missing values are hidden. Do not enter rich-text JSON in these fields.
5. Product descriptions, prices, available options, availability, and gallery images come from Shopify. Unverified fabric, delivery, financing, and stock claims have been removed. The fake outfit recommendations are not displayed.

### Publish the Shopify catalog to Hydrogen

The local sync command can publish active products and collections to the Hydrogen publication, then enable automatic publishing for newly created products:

```sh
python3 scripts/connect_shopify_admin.py
npm run shopify:catalog:sync -- --dry-run
npm run shopify:catalog:sync
```

The Shopify Admin app connection must have `read_products`, `read_publications`, and `write_publications` access. Enter the app's Client ID and Client secret only in the local hidden prompts; they are saved in ignored `.env.admin.local`. The dry run reports what would be published without changing Shopify. The final command publishes active products and collections to Hydrogen and turns on auto-publishing for future products. Draft products remain unpublished.

## Navigation and filters

Configure Shopify menus with handles `main-menu` and `footer`. Use real collection, page, policy, and contact links. Both parent and child links are rendered; store-domain links are converted to local storefront paths. Without menus, safe shop/account/policy links are used.

`/collections` now lists real collections. Catalogue and collection pages have pagination, sort order, stock-only and price filters. Collection option facets (including size and colour) come from Shopify's Search & Discovery configuration; enable and populate them in Shopify. The all-products route has price and availability filtering, not size/colour facets.

## Cart, accounts, and checkout

- Quick add uses actual variant IDs and full variant names, without fabricated size options. For products with more than the first ten queried variants, “View all options” opens the complete product selector.
- Main and mobile add-to-bag buttons add the selected variant and open the cart only after a successful response. Warnings and errors stay visible for review.
- Quantity/removal controls report API errors. Checkout is disabled while cart changes are pending.
- Discount applicability and mutation errors are visible.
- With the installed Hydrogen 2025.7 API, the cart gift-card form explicitly replaces applied gift cards; additional cards can be applied in Shopify checkout. It no longer retains attempted gift-card codes in a client-side array.
- Payments, shipping, taxes, COD, and discounts must be configured in Shopify. A visible payment/delivery promise is not proof a payment method or shipping rule exists.
- Existing Customer Account API routes remain. Verify `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID`, `PUBLIC_CUSTOMER_ACCOUNT_API_URL`, and the permitted storefront login/logout callback URLs in Shopify before launch.
- Reviews, wishlists, subscriptions, and third-party apps still require individual integrations. They are not implemented merely by having their Liquid theme app installed.

## Checks

Use Node 22.18+ for the native TypeScript regression tests (this session used Node 25.3).

```sh
npm run codegen
npm run typecheck
npm run lint
npm test
npm run build
npm run preview -- --port 3000
```

The regression tests cover invalid cart IDs/quantities, redirect handling, filter parsing, and Shopify menu URL conversion. The local HTTP smoke check returned 200 for `/`, `/collections/all`, and `/cart`, and 404 for an unknown product. No live order was placed. Product purchase, login, discounts, gift cards, and payment completion need end-to-end verification with published products and an authorized Shopify test setup.

The initial development server encountered the machine's file-watcher limit (`EMFILE`); production preview successfully started outside the sandbox. This is separate from application type/build validation.

Before launch, verify mobile and desktop variant selection, sold-out combinations, cart persistence after refresh, quantity changes, invalid/valid discounts, login/logout, and a Shopify test checkout. The visual redesign will follow the supplied UI reference.

References: [Shopify collection filtering](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/filter-products), [CartForm](https://shopify.dev/docs/api/hydrogen/latest/components/cartform), [gift-card update behavior](https://shopify.dev/docs/api/storefront/2025-07/mutations/cartGiftCardCodesUpdate).

## Mixed launch: available now and coming soon

Thread77 now supports selling current pieces alongside upcoming previews. No individual Shopify product statuses or inventory quantities were changed by this implementation.

Create these product metafield definitions in Shopify Admin and enable Storefront read access:

| Name                  | Namespace and key      | Type             | Values                       |
| --------------------- | ---------------------- | ---------------- | ---------------------------- |
| Launch status         | `custom.launch_status` | Single-line text | `coming_soon` or `available` |
| Expected release date | `custom.release_date`  | Date             | Optional confirmed date      |

Leave launch status blank for existing products that should follow normal Shopify availability. `coming_soon` overrides stock in the website's display and purchase checks. An unavailable product without that field remains **Sold out**, rather than being mislabeled as an upcoming release.

For a preview: publish the Active product to this storefront's sales channel, set its launch status to `coming_soon`, enable inventory tracking, set online sellable inventory to zero, and disable **Continue selling when out of stock** on every variant. Keep real inventory reserved/unavailable until release. The inventory restriction is essential: the website's custom checks do not apply to external sales channels or independently created Shopify checkout URLs.

At release, change launch status to `available` and set the online quantity to the number ready to sell. The date is informational and does not automatically enable purchasing. Storefront query caching may briefly delay a display update; cart and checkout guards query launch status without caching.

Changes implemented:

- Homepage separates available products from coming-soon previews. It reads up to 24 recently created products, appropriate to this initial small catalogue, and displays up to six per section. The full catalogue remains paginated; switch the homepage to curated collections if the range grows beyond 24 products.
- Product cards and product pages distinguish Coming soon, In stock, and Sold out. Upcoming pieces have no working quick-add or purchase button.
- Upcoming product cards with an unset/zero price show “Price at launch.” Enter the actual expected price when known.
- Add-to-cart, positive quantity updates, cart permalink creation, and `/checkout` verify product availability using fresh Shopify data. Existing carts containing upcoming items are blocked at the storefront checkout step; items can still be removed.
- The new `/checkout` route hands a checked cart to Shopify checkout. It does not replace Shopify's payment flow.
- A still-photo homepage, off-white palette, Bricolage Grotesque headings, DM Sans body text, and short copy establish the initial visual direction. The campaign image is an existing project asset; replace it with approved photography of the actual Thread77 range before launch.
- No nonfunctional “Notify me” form has been added. Product-specific notifications still need an email provider integration, consent handling, and release-message delivery.

Tests in `tests/launch.test.mjs` verify upcoming products remain blocked even when Shopify reports stock, ordinary sold-out items retain their correct state, and date changes alone cannot unlock purchasing.

## Product photos with “Shop the look” + tags

The product page now supports a shoppable outfit photo, individual product additions, and adding the complete outfit in one cart request. Every piece requires an explicit variant choice; sold-out and coming-soon pieces cannot be added. Existing server cart validation also applies. The full-look button stays disabled if any linked piece is unavailable. No products or hotspot positions are guessed from a photograph.

Create these **product metafield definitions** in Shopify with Storefront read access:

- `custom.shop_the_look`: **Product reference → List of products**. Select every piece shown in the outfit, including the current product if it should be part of the complete look. Up to 12 linked products are displayed. Use published products with valid images, variants, prices, and inventory.
- `custom.shop_the_look_layout`: **JSON**. Choose the outfit image and position each + marker using its linked product handle:

```json
{
  "image": 0,
  "items": [
    {"handle": "your-actual-tshirt-handle", "x": 50, "y": 30},
    {"handle": "your-actual-jeans-handle", "x": 48, "y": 70}
  ]
}
```

`image` is the zero-based index in the current product’s image gallery (0 means the first photo). `x` and `y` are percentages from the original photo’s left and top edges. The outfit image is displayed uncropped to preserve tag placement on mobile and desktop. Keep tags at least about 8% from the edges for comfortable touch targets. Update these coordinates if you replace or reorder the photo. Replace the example handles with your real Shopify product handles.

With no linked products, this section is hidden. With linked products but no valid marker configuration, their purchase controls still appear without guessed + positions. Missing/unpublished references and unknown handles do not create fake purchase buttons. Products with more than 100 variants link to their full product page for additional options.

Verify with a real tee-and-jeans photo: tap each +, choose the intended size/colour, add one item, then choose every item and add the full look. Check actual cart IDs, quantities, displayed errors, sold-out options, coming-soon items, keyboard focus, and mobile photo alignment. Live Shopify content configuration and checkout testing are separate from the local code checks.

## Editorial homepage and design preview

The homepage now follows a collection-led editorial layout: full-bleed campaign, category navigation, New Arrivals product row, collection/image features, a second product row, coming-soon pieces, and brand/customer information. Collection titles, descriptions, imagery, and associated products come from Shopify. Sold-out pieces remain visible with a status badge instead of disappearing from New Arrivals.

A read-only Storefront query on 2026-09-26 returned zero products and only the `frontpage` collection. The connection is working; the owner confirmed products have not been uploaded. No Admin API token is configured. Existing scraped catalogue IDs must not be used for purchases in this store.

Open `/?preview=1` for a labelled visual preview using selected imagery already present in the project's reference catalogue. Sample cards have no variant IDs, prices, product-page links, or cart buttons. They cannot be purchased. Preview pages are `noindex, nofollow`. Local development also displays this preview when the catalogue is empty; `/?preview=0` shows the real empty storefront. Production does not automatically substitute sample products. Once real products exist, those take precedence in the preview as well.

To populate the live site, upload your actual products to the connected Shopify store, configure prices/options/inventory, and publish them and their collections to the Hydrogen/Headless channel. The homepage automatically fills from that catalogue. This redesign does not run the legacy sample-product importer or create live inventory.

### Collection preview update

Localhost now defaults to design preview across the homepage, `/collections`, and `/collections/all` while the underlying catalogue is empty (including production preview servers). `?preview=0` explicitly disables it; deployed hosts require `?preview=1`. The unfiltered catalogue is checked before supplying collection samples, so filtering a populated live catalogue to zero results never inserts samples. Preview collections support category tabs, name sorting, and explanatory + controls with disabled purchase actions. Live filters are grouped into a collapsible Filter & sort panel. No-index metadata is included on preview routes.

Use the current preview server at `http://localhost:3017`; a previously running server on port 3001 may still be serving older builds.

### Interactive test-shopping preview

The owner approved temporary test products. Preview cards now show labelled example INR prices and sample sale prices, link to `/preview/products/:id`, and allow explicit size selection before adding to `/preview/cart`. Quantities, totals, removal, and browser refresh persistence are implemented in a separate local-storage bag. The header/mobile bag link follows preview mode. No fake Shopify variant IDs are submitted, no real cart is mutated, and preview checkout remains disabled. All preview routes are no-index.

The top announcement strip has been removed. Jeans and Tees have separate storefront routes. Published Shopify collections with matching handles take precedence; otherwise real products are queried by their corresponding product types/tags. These fallback routes do not create collection records in Shopify Admin.

Product-card sale labels and struck-through prices use matching-currency compare-at values greater than the displayed price; product-page sale pricing follows the selected variant. Live cart and checkout still need verification after test products are uploaded and published.

Draft import data and access requirements are in `review/SHOPIFY-TEST-PRODUCTS.md` and `review/shopify-test-products.csv`. Browser checks passed for separate categories, removed announcement, size requirement, add-to-preview-bag, quantities/subtotal, refresh persistence, removal, disabled checkout, and mobile overflow. The code checks pass with 15 unit tests.

## Homepage hanger collection and quick shop

Create a Shopify collection titled **Home Screen** with handle **home-screen** and publish it and its products to this Hydrogen storefront. Its first five products, in collection order, populate five hanger positions. Smaller collections repeat in order: three products display as 1, 2, 3, 1, 2; one product fills all five positions. These are repeated views of the same Shopify products, with the same purchase options. Until the collection has visible products, the existing artwork remains a non-purchasable preview.

Upload transparent images that include the **complete hanger and garment**, with the hook centred at the top. The entire image appears against the rail; the website adds no hanger or hook and does not crop the uploaded hook. Use matching canvases and garment alignment across angles (500 × 935 is recommended).

For predictable rotation, set image alt text to `hanger-side`, `hanger-three-quarter`, and `hanger-front`. Angle filenames such as `side-transparent.png`, `three-quarter-transparent.png`, and `front-transparent.png` are also recognised. Alt text takes precedence. For images without angle labels or filenames, the first three uploads are used in gallery order: side, three-quarter, front. With two images, the view changes at the edge of the turn; a single image has no angle change. Hover turns towards the front, leaving reverses the turn, and arrow keys cycle through distinct available views. Reduced-motion preferences disable the animated hover. The full product gallery remains available in the quick-shop dialog.

Click a connected hanger to open its details on the homepage. Customers select an actual Shopify variant before adding to the real cart; unavailable options and coming-soon products cannot be purchased. The overlay displays cart errors and confirms successful additions with a bag/checkout link. Escape, the close button, or the backdrop closes the overlay and restores focus. Checkout continues through the existing cart and Shopify checkout. Products with more than 250 variants have a link to the full product page for additional options.

The rail packs the five pieces closely with slight overlap. Hover opens a gap around the selected piece, with spring-driven sliding, turning, and a small swing around the hook. Pointer tolerance keeps the selected front view stable when it extends across adjacent positions. Animation retains velocity when reversing and settles into a gentle idle sway, with different timing for each rail position. It pauses when offscreen, when the tab is hidden, or when reduced motion is enabled.

The uploaded photograph is rendered in two joined layers at 12% of its height: the hook stays full-size and the cloth below it follows with a small delay and jiggle. Keep the hanger neck near this position on matching image canvases. This uses the original image, including its hook. Soft shadows follow the garment's transparent silhouette; the floor shadow follows the hem, narrows during a turn, and softens as the selected piece moves forward.

The product viewer expands the selected image over a blurred rail and returns it on close. Angle controls use the product gallery; previous/next controls browse the actual collection when more than one product is available. Repeated rail positions still refer to the same Shopify product. Variant choices reset when browsing to another product, and its price and image follow the chosen variant. The layout and interaction were adapted after inspecting [Snug Wrld](https://snugwrld.netlify.app/), using Thread77's own images and storefront data.
