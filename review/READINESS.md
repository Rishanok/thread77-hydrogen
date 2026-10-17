# Store readiness — 30 September 2026

## Verified

- Shopify Admin credentials connect to ja1kvi-ri.myshopify.com, currency INR.
- App has product, inventory, location-read and publication permissions.
- Live Admin product query returned zero products. Earlier uncertainty about an empty Storefront catalogue is resolved: the connected store has no products.
- Dark storefront styling applied locally, including header, catalogue, preview, cart surfaces and product controls. Browser visual review remains pending.
- 15 regression tests pass; TypeScript passes; production build passes. ESLint has no errors and two script console-output warnings.

## Still required before launch

1. Choose labelled test products or merchant-approved real products, then create variants, images, prices and inventory and publish to the intended storefront channel.
2. Verify the Storefront API can see those products and exercise actual Shopify cart creation, quantity changes, removal and persistence.
3. Verify shipping, taxes, payment test mode and checkout in Shopify Admin; complete a test order. Existing API access does not establish payment-settings access. No order has been placed.
4. Verify customer login callbacks and order history, policy content and support details.
5. Complete mobile/desktop browser review, keyboard navigation, variant/sold-out behavior and error states.
6. Verify deployment access, deploy a review build and connect the intended domain before launch.

The local sample bag is a design preview and cannot complete checkout. Local styling changes have not been deployed.
