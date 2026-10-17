# Thread77 test products

The owner authorized temporary test products. `shopify-test-products.csv` contains two draft products, each with sample imagery, example prices, sizes, SKUs, and test stock:

| Product | Type | Example price | Compare-at price | Sizes |
| --- | --- | --- | --- | --- |
| TEST — Everyday Tee | Tees | 999 | 1499 | S, M, L, XL |
| TEST — Relaxed Jeans | Jeans | 1999 | 2499 | 28, 30, 32, 34, 36 |

Amounts import in the store's currency; the interactive local preview displays INR. No Shopify products have been created by preparing this file.

The CSV imports as **draft**, unpublished. After reviewing, activate and publish only to the intended Hydrogen/Headless channel for a controlled test. Do not treat example stock or descriptions as real inventory. Archive/delete the test items after reviewing; replace them with real product details before selling.

`/collections/jeans` and `/collections/tees` prefer Shopify collections with those handles. If those collections do not exist, the storefront groups real products by the corresponding product type or tag (`Jeans`/`Denim`/`jeans` and `Tees`/`T-Shirts`/`tees`). These are storefront category pages, not newly created Shopify Admin collection records.

## Direct upload access

The existing Storefront API connection cannot create products. Shopify Admin API access with `write_products` is required. The earlier CLI device sign-in did not complete, and CLI login alone is not a product-write token.

For an app installed on a store in the same Shopify organization, configure app credentials locally using ignored `.env.admin.local` (never put these in browser code):

```dotenv
SHOPIFY_SHOP=ja1kvi-ri
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
```

Grant the app only the required scopes. Product creation uses `write_products`; creating stock and publishing requires the corresponding inventory/location/publication permissions. An installed app's client credentials can be exchanged server-side for an Admin access token. An existing valid Admin API token is another supported option. Do not send store passwords or one-time login codes through chat.

References: [Shopify client credentials grant](https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant), [Shopify CSV import format](https://help.shopify.com/en/manual/products/import-export/using-csv).

## Interactive preview (works now, no Admin access)

Open `/collections/jeans` or `/collections/tees` on localhost, click a test item, choose a size, and add it to `/preview/cart`. Example prices and sale labels are visible. Increase/decrease quantity, remove a line, and refresh to check persistence. The preview bag is kept in this browser's local storage and never sends fake variants to Shopify. Checkout is disabled. Real Storefront cart behavior must be checked after actual products are published.
