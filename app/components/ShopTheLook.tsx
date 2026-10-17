import {useId, useRef, useState} from 'react';
import {Link} from 'react-router';
import {Money} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import {isComingSoon} from '~/lib/launch';
import {parseLookLayout} from '~/lib/shopTheLook';

export function ShopTheLook({product}: {product: ProductFragment}) {
  const {open} = useAside();
  const prefix = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const products = (product.lookProducts?.references?.nodes || []).filter(
    (item): item is Extract<typeof item, {id: string}> => 'id' in item,
  );
  const uniqueProducts = products.filter(
    (item, index) =>
      products.findIndex((other) => other.id === item.id) === index,
  );
  if (!uniqueProducts.length) return null;
  const layout = parseLookLayout(product.lookLayout?.value);
  const image = product.images.nodes[layout.image] || product.images.nodes[0];
  const hotspots = (
    product.images.nodes[layout.image] ? layout.items : []
  ).filter((item) =>
    uniqueProducts.some((linked) => linked.handle === item.handle),
  );
  const selected = uniqueProducts.map((item) => {
    const variant = item.variants.nodes.find(
      (option) => option.id === choices[item.id],
    );
    return {item, variant};
  });
  const allReady = selected.every(
    ({item, variant}) => variant?.availableForSale && !isComingSoon(item),
  );
  const lines = selected.flatMap(({variant}) =>
    variant ? [{merchandiseId: variant.id, quantity: 1}] : [],
  );
  const currencies = new Set(
    selected.flatMap(({variant}) =>
      variant ? [variant.price.currencyCode] : [],
    ),
  );
  const total = selected.reduce(
    (sum, {variant}) => sum + Number(variant?.price.amount || 0),
    0,
  );
  const firstPrice = selected.find(({variant}) => variant)?.variant?.price;

  return (
    <section className="t77-look" aria-labelledby={`${prefix}-heading`}>
      <div className="t77-look-heading">
        <div>
          <span className="t77-drop-eyebrow">Better together</span>
          <h2 id={`${prefix}-heading`}>Shop the look.</h2>
        </div>
        <p>
          {hotspots.length
            ? 'See a piece you like? Tap + to make it yours.'
            : 'Choose your pieces. Put your own look together.'}
        </p>
      </div>
      <div className="t77-look-layout">
        {image && (
          <div className="t77-look-photo">
            <img
              src={image.url}
              alt={
                image.altText ||
                `${product.title} styled with the pieces in this look`
              }
              width={image.width || undefined}
              height={image.height || undefined}
              loading="lazy"
            />
            {hotspots.map((spot) => {
              const item = uniqueProducts.find(
                (linked) => linked.handle === spot.handle,
              )!;
              const index = uniqueProducts.indexOf(item);
              return (
                <button
                  key={spot.handle}
                  type="button"
                  className={`t77-look-hotspot${active === item.id ? ' is-active' : ''}`}
                  style={{left: `${spot.x}%`, top: `${spot.y}%`}}
                  aria-label={`Choose options for ${item.title}`}
                  aria-controls={`${prefix}-item-${index}`}
                  aria-pressed={active === item.id}
                  onClick={() => {
                    setActive(item.id);
                    const card = panel.current?.querySelector<HTMLElement>(
                      `[data-look-index="${index}"]`,
                    );
                    card?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                    });
                    card
                      ?.querySelector<HTMLSelectElement>('select')
                      ?.focus({preventScroll: true});
                  }}
                >
                  <span aria-hidden="true">+</span>
                </button>
              );
            })}
            <span className="t77-look-photo-label">
              THE FULL FIT / THREAD77
            </span>
          </div>
        )}
        <div className="t77-look-items" ref={panel}>
          <p className="t77-look-count">
            {uniqueProducts.length} pieces. Your combination.
          </p>
          {selected.map(({item, variant}, index) => {
            const upcoming = isComingSoon(item);
            return (
              <article
                key={item.id}
                id={`${prefix}-item-${index}`}
                data-look-index={index}
                className={`t77-look-item${active === item.id ? ' is-active' : ''}`}
              >
                <div className="t77-look-item-header">
                  {item.featuredImage && (
                    <img
                      src={item.featuredImage.url}
                      alt={item.featuredImage.altText || item.title}
                      width="72"
                      height="90"
                      loading="lazy"
                    />
                  )}
                  <div>
                    <span className="t77-look-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3>
                      <Link to={`/products/${item.handle}`}>{item.title}</Link>
                    </h3>
                    {variant && <Money data={variant.price} />}
                    {upcoming && <p>Coming soon</p>}
                    {!upcoming && !item.availableForSale && <p>Sold out</p>}
                  </div>
                </div>
                <label htmlFor={`${prefix}-option-${index}`}>
                  Size / colour
                </label>
                <div className="t77-look-item-actions">
                  <select
                    id={`${prefix}-option-${index}`}
                    value={choices[item.id] || ''}
                    disabled={upcoming || !item.availableForSale}
                    onFocus={() => setActive(item.id)}
                    onChange={(event) =>
                      setChoices({...choices, [item.id]: event.target.value})
                    }
                  >
                    <option value="">Choose an option</option>
                    {item.variants.nodes.map((option) => (
                      <option
                        key={option.id}
                        value={option.id}
                        disabled={!option.availableForSale}
                      >
                        {option.title === 'Default Title'
                          ? 'One size'
                          : option.title}
                        {!option.availableForSale ? ' — Sold out' : ''}
                      </option>
                    ))}
                  </select>
                  <AddToCartButton
                    disabled={!variant?.availableForSale || upcoming}
                    lines={
                      variant ? [{merchandiseId: variant.id, quantity: 1}] : []
                    }
                    onSuccess={() => open('cart')}
                  >
                    Add to bag
                  </AddToCartButton>
                </div>
                {item.variants.pageInfo.hasNextPage && (
                  <Link to={`/products/${item.handle}`}>
                    View all product options
                  </Link>
                )}
              </article>
            );
          })}
          <div className="t77-look-summary">
            <div>
              <span>The full look</span>
              {allReady && firstPrice && currencies.size === 1 && (
                <Money
                  data={{
                    amount: total.toFixed(2),
                    currencyCode: firstPrice.currencyCode,
                  }}
                />
              )}
            </div>
            <p>
              {allReady
                ? 'All your pieces, added together.'
                : 'Choose an available option for each piece to add the full look.'}
            </p>
            <AddToCartButton
              disabled={!allReady}
              lines={allReady ? lines : []}
              onSuccess={() => open('cart')}
            >
              Add the full look · {uniqueProducts.length} pieces
            </AddToCartButton>
          </div>
        </div>
      </div>
    </section>
  );
}
