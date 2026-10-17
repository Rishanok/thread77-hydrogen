import {isComingSoon} from '~/lib/launch';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from './CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useFetchers} from 'react-router';
import {CartFeedback} from './CartFeedback';

export function CartSummary({
  cart,
  layout,
}: {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
}) {
  const fetchers = useFetchers();
  const busy =
    Boolean(cart?.isOptimistic) ||
    fetchers.some((fetcher) => fetcher.formAction === '/cart');
  const hasUpcoming = cart?.lines.nodes.some((line) =>
    isComingSoon(line.merchandise.product),
  );
  const codes = cart?.discountCodes?.map(({code}) => code) || [];
  return (
    <div
      className={layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside'}
      aria-label="Cart totals"
    >
      <h4>Totals</h4>
      <dl className="cart-subtotal">
        <dt>Subtotal</dt>
        <dd>
          {cart?.cost?.subtotalAmount && (
            <Money data={cart.cost.subtotalAmount} />
          )}
        </dd>
      </dl>
      {cart?.discountCodes?.map(({code, applicable}) => (
        <p key={code} role="status">
          {code}: {applicable ? 'Applied' : 'Not applicable to this bag'}
        </p>
      ))}
      {codes.length > 0 && (
        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.DiscountCodesUpdate}
          inputs={{discountCodes: []}}
        >
          {(fetcher) => (
            <>
              <button disabled={busy || fetcher.state !== 'idle'}>
                Remove discounts
              </button>
              <CartFeedback result={fetcher.data} />
            </>
          )}
        </CartForm>
      )}
      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.DiscountCodesUpdate}
        inputs={{discountCodes: codes}}
      >
        {(fetcher) => (
          <>
            <label>
              Discount code <input name="discountCode" type="text" required />
            </label>
            <button disabled={busy || fetcher.state !== 'idle'}>
              Apply discount
            </button>
            <CartFeedback result={fetcher.data} />
          </>
        )}
      </CartForm>
      {cart?.appliedGiftCards?.map((giftCard) => (
        <div key={giftCard.id}>
          <p>
            Gift card ending {giftCard.lastCharacters}:{' '}
            <Money data={giftCard.amountUsed} />
          </p>
          <CartForm
            route="/cart"
            action={CartForm.ACTIONS.GiftCardCodesRemove}
            inputs={{giftCardCodes: [giftCard.id]}}
          >
            {(fetcher) => (
              <>
                <button disabled={busy || fetcher.state !== 'idle'}>
                  Remove gift card
                </button>
                <CartFeedback result={fetcher.data} />
              </>
            )}
          </CartForm>
        </div>
      ))}
      {Boolean(cart?.appliedGiftCards?.length) && (
        <p>
          Applying a new code replaces the gift cards in this bag. You can apply
          additional gift cards at checkout.
        </p>
      )}
      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.GiftCardCodesUpdate}
        inputs={{giftCardCodes: []}}
      >
        {(fetcher) => (
          <>
            <label>
              Gift card code{' '}
              <input
                name="giftCardCode"
                type="text"
                autoComplete="off"
                required
              />
            </label>
            <button disabled={busy || fetcher.state !== 'idle'}>
              {cart?.appliedGiftCards?.length
                ? 'Replace gift cards'
                : 'Apply gift card'}
            </button>
            <CartFeedback result={fetcher.data} />
          </>
        )}
      </CartForm>
      <p>Shipping and taxes are calculated at checkout.</p>
      {hasUpcoming && (
        <p role="alert">Remove coming-soon pieces from your bag to continue.</p>
      )}
      {cart?.checkoutUrl &&
        (busy || hasUpcoming ? (
          <button disabled>
            {hasUpcoming ? 'Coming-soon item in bag' : 'Updating bag…'}
          </button>
        ) : (
          <a href="/checkout">Continue to checkout →</a>
        ))}
    </div>
  );
}
