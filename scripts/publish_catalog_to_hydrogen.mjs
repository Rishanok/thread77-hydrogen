import {existsSync} from 'node:fs';

if (existsSync('.env.admin.local')) process.loadEnvFile('.env.admin.local');

const shop = process.env.SHOPIFY_SHOP?.replace(/\.myshopify\.com$/, '');
const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

if (!shop || !/^[a-z0-9][a-z0-9-]*$/i.test(shop) || !token) {
  console.error(
    'Shopify Admin is not connected. Run python3 scripts/connect_shopify_admin.py first.',
  );
  process.exit(1);
}

const endpoint = `https://${shop}.myshopify.com/admin/api/2026-07/graphql.json`;

async function graphql(query, variables = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({query, variables}),
  });
  if (!response.ok)
    throw new Error(`Shopify Admin API returned HTTP ${response.status}.`);
  const result = await response.json();
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join('; '));
  }
  return result.data;
}

const publications = await graphql(`
  query HydrogenPublications {
    publications(first: 100) {
      nodes {
        id
        name
        autoPublish
        channels(first: 10) {
          nodes {
            name
          }
        }
      }
    }
  }
`);

const candidates = publications.publications.nodes.filter((publication) =>
  /hydrogen/i.test(
    `${publication.name} ${publication.channels.nodes.map((channel) => channel.name).join(' ')}`,
  ),
);
if (candidates.length !== 1) {
  console.error(
    candidates.length
      ? 'More than one Hydrogen publication was found. No products were changed.'
      : 'No Hydrogen publication was found. Confirm the Hydrogen sales channel is installed and connected.',
  );
  process.exit(1);
}

const publication = candidates[0];
console.log(`Using Shopify publication: ${publication.name}`);

async function collect(query, rootKey) {
  const nodes = [];
  let after = null;
  while (true) {
    const data = await graphql(query, {after});
    const connection = data[rootKey];
    nodes.push(...connection.nodes);
    if (!connection.pageInfo.hasNextPage) return nodes;
    after = connection.pageInfo.endCursor;
  }
}

const products = await collect(
  `query ActiveProducts($after: String) {
    products(first: 100, after: $after, query: "status:active") {
      nodes {
        id title status
        resourcePublicationsV2(first: 100) {
          nodes { isPublished publication { id } }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }`,
  'products',
);

const collections = await collect(
  `query StoreCollections($after: String) {
    collections(first: 100, after: $after) {
      nodes {
        id title
        resourcePublicationsV2(first: 100) {
          nodes { isPublished publication { id } }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }`,
  'collections',
);

const needsPublishing = (resource) =>
  !resource.resourcePublicationsV2.nodes.some(
    (entry) => entry.publication.id === publication.id && entry.isPublished,
  );
const productsToPublish = products.filter(needsPublishing);
const collectionsToPublish = collections.filter(needsPublishing);

console.log(
  `Found ${products.length} active products (${productsToPublish.length} to publish) and ${collections.length} collections (${collectionsToPublish.length} to publish).`,
);

if (process.argv.includes('--dry-run')) {
  console.log('Dry run only; Shopify was not changed.');
  process.exit(0);
}

async function publish(resources, kind) {
  for (const resource of resources) {
    const data = await graphql(
      `
        mutation PublishToHydrogen($id: ID!, $publicationId: ID!) {
          publishablePublish(id: $id, input: {publicationId: $publicationId}) {
            userErrors {
              message
            }
          }
        }
      `,
      {id: resource.id, publicationId: publication.id},
    );
    const errors = data.publishablePublish.userErrors;
    if (errors.length) {
      throw new Error(
        `Could not publish ${kind} "${resource.title}": ${errors.map((error) => error.message).join('; ')}`,
      );
    }
    console.log(`Published ${kind}: ${resource.title}`);
  }
}

await publish(productsToPublish, 'product');
await publish(collectionsToPublish, 'collection');

if (!publication.autoPublish) {
  const result = await graphql(
    `
      mutation EnableHydrogenAutoPublish(
        $id: ID!
        $input: PublicationUpdateInput!
      ) {
        publicationUpdate(id: $id, input: $input) {
          publication {
            id
            autoPublish
          }
          userErrors {
            message
          }
        }
      }
    `,
    {id: publication.id, input: {autoPublish: true}},
  );
  const errors = result.publicationUpdate.userErrors;
  if (errors.length) {
    throw new Error(
      `Products and collections are published, but auto-publish could not be enabled: ${errors.map((error) => error.message).join('; ')}`,
    );
  }
  console.log('Enabled automatic publishing for newly created products.');
} else {
  console.log('Automatic publishing for new products is already enabled.');
}

console.log('Hydrogen catalog sync complete.');
