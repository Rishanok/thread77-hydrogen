# Thread77 — Developer Handoff

Thread77 is a Shopify Hydrogen storefront built with React 18, React Router 7, TypeScript and Vite. This folder is the active website. The sibling Liquid theme exports, theme ZIPs and `preview.html` are separate older/reference assets and are not required to run it.

## Start here

1. Install Node.js 22.18 or later in the Node 22 series and npm. Node 22.18+ is needed for the native TypeScript tests; the package's older `>=18` engine declaration does not capture that test requirement.
2. Extract the handoff ZIP and open a terminal in `thread77-hydrogen`.
3. Install the locked dependencies and create your local configuration:

   ```sh
   npm ci
   cp .env.example .env
   ```

4. Fill `.env` using values provided privately by the store owner. Generate a new local session secret:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Copy the output into `SESSION_SECRET`. Placeholder values will not connect to Shopify. Local design preview still uses the application and its Shopify connection; it is not a fully offline demo.

5. Start the development server:

   ```sh
   npm run dev -- --port 47831
   ```

   Open **http://localhost:47831**. Keep the terminal running; Ctrl+C stops it.

   If macOS reports `EMFILE: too many open files, watch`, use polling:

   ```sh
   CHOKIDAR_USEPOLLING=true npm run dev -- --port 47831
   ```

   Windows PowerShell equivalent:

   ```powershell
   $env:CHOKIDAR_USEPOLLING="true"
   npm run dev -- --port 47831
   ```

## Environment configuration

`.env.example` contains names and placeholders only. Never commit real `.env` files or include them in a public ZIP.

| Variable | Purpose |
| --- | --- |
| `PUBLIC_STORE_DOMAIN` | Shopify store hostname, without `https://`, e.g. `your-store.myshopify.com`. |
| `PUBLIC_STOREFRONT_API_TOKEN` | Public Storefront API token for the intended Hydrogen/Headless storefront. |
| `PUBLIC_STOREFRONT_ID` | Storefront ID supplied by Shopify. |
| `PRIVATE_STOREFRONT_API_TOKEN` | Server-only Storefront token, if supplied for this environment. |
| `SESSION_SECRET` | Random secret for signing local session cookies; generate your own. |
| `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` | Shopify Customer Account client ID; needed for account functionality. |
| `PUBLIC_CUSTOMER_ACCOUNT_API_URL` | Customer Account API URL supplied by Shopify. |
| `SHOP_ID` | Shopify shop ID supplied with the storefront environment. |
| `PUBLIC_CHECKOUT_DOMAIN` | Optional checkout hostname; defaults to the store domain when omitted. |

Ask the owner for the intended store and matching storefront environment values. Customer accounts also require the correct allowed login/logout callback URLs in Shopify. Localhost browsing alone does not verify login.

## What the owner should share

- **The complete handoff ZIP**, including this README and `.env.example`.
- **Shopify collaborator/staff access** appropriate to the assigned work: products, collections, navigation, pages, metafields and the Hydrogen/Headless storefront as needed. Use an invitation rather than sharing the owner's login.
- **Environment values privately**, through an agreed secure channel. Admin API and Oxygen deployment credentials are separate from the Storefront API configuration and are only needed for those tasks.
- **The development brief:** requested changes, approved designs/assets, target store/domain, expected delivery and whether deployment is part of the work.
- If catalog import work is requested, separately provide the approved product CSV/data. The parent directory's scraped/import CSV files are not required to run this app and are not included in this handoff.

The ZIP excludes `.env`, `.env.admin.local`, `.env.oxygen.local`, `.shopify`, `node_modules`, `dist`, `.react-router`, editor settings, caches and local deployment logs. The recipient recreates dependencies with `npm ci`. Shopify catalog records, menus, settings and uploaded media are not backed up by this source archive.

## Project map

| Path | Contents |
| --- | --- |
| `app/routes/` | Homepage, collections, products, cart, checkout, accounts, search, policies and preview routes. |
| `app/components/` | Header/footer, product cards, hero sections, cart and shared UI. |
| `app/styles/` | Storefront CSS. |
| `app/lib/` | Shopify context/session, catalog helpers, preview logic and purchase validation. |
| `app/data/` | Local sample and design-preview data. |
| `app/graphql/` | Customer Account GraphQL operations. |
| `public/` | Local storefront image assets. |
| `server.ts` | Request handler for the Oxygen runtime. |
| `tests/` | Node regression tests. |
| `scripts/` | Optional Admin/catalog and Oxygen utilities; not required for local startup. |
| `STOREFRONT_SETUP.md` | Detailed store configuration and verification notes. |
| `review/READINESS.md` | Historical launch-readiness notes dated 30 September 2026. |
| `review/SHOPIFY-TEST-PRODUCTS.md` | Existing test-product planning notes. |
| `package.json`, `package-lock.json` | Scripts and locked dependency versions; keep both. |
| `*.config.*`, `.graphqlrc.ts`, `env.d.ts`, generated `*.d.ts` | Build, code generation and type configuration. |

## Preview versus real commerce

Localhost enables design preview by default. `?preview=1` explicitly enables preview; `?preview=0` disables it. Sample products and the preview bag are for design review and cannot complete checkout. Test real commerce against actual published Shopify products.

The application uses English and the India (`IN`) market context. Products, stock, prices, collections, menus, policies, shipping, taxes and payment settings must be configured in the connected Shopify store. Coming-soon purchase rules and required metafields are described in `STOREFRONT_SETUP.md`.

## Validation commands

```sh
npm run codegen
npm run typecheck
npm run lint
npm test
npm run build
```

For a local production preview:

```sh
npm run preview -- --port 47832
```

These commands are instructions for the recipient, not a claim that all checks were rerun for this handoff. On 13 October 2026, the development homepage returned HTTP 200 on port 47831 using the owner's existing environment. Checkout, accounts, payments and deployment were not verified in that check. Earlier verification in `review/READINESS.md` is historical; recheck the current store before launch.

## Troubleshooting

- **Port conflict / MiniOxygen startup error:** on the owner's machine, ports 3000 and 3001 caused internal module requests to reach other local services. Port 47831 resolved startup. If you see `Cannot read properties of undefined (reading 'replace')` or an HTML response where JSON is expected, check for a port conflict and try a free port. Those messages can have other causes too.
- **Watcher limit:** use the polling command above.
- **Missing session secret:** set `SESSION_SECRET` in `.env`, then restart.
- **Empty real catalog:** confirm the store/token, product publication to the intended storefront channel, stock and market availability. Preview products do not prove a live catalog exists.
- **Shopify CLI access denied:** use your own authorized Shopify account and have the owner grant access to the intended storefront.
- **Customer login fails:** verify Customer Account configuration and callback URLs with the owner.

## Optional Admin scripts and deployment

Local UI development does not require Admin API or deployment credentials. Admin utilities use `.env.admin.local` with `SHOPIFY_SHOP` plus either `SHOPIFY_ADMIN_ACCESS_TOKEN` or the configured `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` flow. Inspect each script before use.

`scripts/import_to_shopify.py` creates products and collections and contains a hard-coded store domain and API version. It is a historical utility, not a startup step. Review its target and product data with the owner before running it.

`scripts/connect_shopify_admin.py` and `scripts/connect_oxygen.py` use macOS dialogs (`osascript`). The Oxygen connection script immediately starts a preview deployment after saving the token. `scripts/deploy_oxygen.mjs` reads `SHOPIFY_HYDROGEN_DEPLOYMENT_TOKEN` from `.env.oxygen.local` and deploys a preview using `.env`. Review the target, configuration and authorization before running deployment scripts. No deployment is needed to run locally.

Before launch, verify real product/variant selection, cart persistence, sold-out and coming-soon rules, discounts, login/logout, shipping/taxes and a Shopify test checkout. Confirm mobile/desktop layouts, policies/support content and the intended deployment/domain with the owner.
