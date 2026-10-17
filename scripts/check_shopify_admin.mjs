import {existsSync} from 'node:fs';
if (existsSync('.env.admin.local')) process.loadEnvFile('.env.admin.local');
const shop = process.env.SHOPIFY_SHOP?.replace(/\.myshopify\.com$/, '');
if (!shop || !/^[a-z0-9][a-z0-9-]*$/i.test(shop)) {
  console.error('Set SHOPIFY_SHOP to the store subdomain in .env.admin.local.');
  process.exit(1);
}
let token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
try {
  if (!token) {
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      console.error('Admin connection pending: fill SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in .env.admin.local after installing the app on this store.');
      process.exit(1);
    }
    const response = await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
      method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret}),
    });
    if (!response.ok) throw new Error(`Authorization failed (HTTP ${response.status}). Check app installation, store ownership, and credentials.`);
    const result = await response.json();
    token = result.access_token;
    if (!token) throw new Error('Shopify did not return an access token.');
  }
  const response = await fetch(`https://${shop}.myshopify.com/admin/api/2026-07/graphql.json`, {
    method: 'POST', headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': token},
    body: JSON.stringify({query: '{ shop { name myshopifyDomain currencyCode } currentAppInstallation { accessScopes { handle } } }'}),
  });
  if (!response.ok) throw new Error(`Admin verification failed (HTTP ${response.status}).`);
  const result = await response.json();
  if (result.errors?.length) throw new Error('Shopify rejected the verification query. Check Admin API permissions.');
  if (!result.data?.shop) throw new Error('No shop returned by Admin API.');
  const scopes = result.data.currentAppInstallation?.accessScopes.map(s => s.handle) || [];
  console.log(JSON.stringify({connected: true, shop: result.data.shop, scopes, canCreateProducts: scopes.includes('write_products')}, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Admin verification failed.');
  process.exitCode = 1;
}
