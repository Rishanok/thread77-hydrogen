import {checkPurchaseAvailability} from '~/lib/launch.server';
import {useLoaderData, data, type HeadersFunction} from 'react-router';
import type {Route} from './+types/cart';
import type {CartQueryDataReturn} from '@shopify/hydrogen';
import {CartForm} from '@shopify/hydrogen';
import {safeLocalRedirect, validCartLines} from '~/lib/cart-validation';
import {CartMain} from '~/components/CartMain';

export const meta: Route.MetaFunction = () => {
  return [{title: `Thread77 | Cart`}];
};

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

export async function action({request, context}: Route.ActionArgs) {
  const {cart} = context;

  const formData = await request.formData();

  let parsed;
  try {
    parsed = CartForm.getFormInput(formData);
  } catch {
    return data({errors: [{message: 'Invalid cart request.'}]}, {status: 400});
  }
  const {action, inputs} = parsed;

  if (!action) {
    return data(
      {errors: [{message: 'No cart action provided.'}]},
      {status: 400},
    );
  }

  let status = 200;
  let result: CartQueryDataReturn;

  try {
    switch (action) {
      case CartForm.ACTIONS.LinesAdd:
        if (!validCartLines(inputs.lines))
          return data(
            {
              errors: [
                {message: 'Choose a valid product option and quantity.'},
              ],
            },
            {status: 400},
          );
        {
          const reason = await checkPurchaseAvailability(
            context.storefront,
            inputs.lines.map((line) => line.merchandiseId),
          );
          if (reason) return data({errors: [{message: reason}]}, {status: 409});
        }
        result = await cart.addLines(inputs.lines);
        break;
      case CartForm.ACTIONS.LinesUpdate:
        if (!validCartLines(inputs.lines, true))
          return data(
            {errors: [{message: 'Choose a valid cart quantity.'}]},
            {status: 400},
          );
        {
          const existing = await cart.get({numCartLines: 250});
          const variants: string[] = [];
          for (const update of inputs.lines) {
            if (update.quantity === 0) continue;
            const line = existing?.lines.nodes.find(
              (item) => item.id === update.id,
            );
            if (!line)
              return data(
                {
                  errors: [
                    {
                      message:
                        'This item is no longer in your bag. Please refresh.',
                    },
                  ],
                },
                {status: 409},
              );
            variants.push(update.merchandiseId || line.merchandise.id);
          }
          if (variants.length) {
            const reason = await checkPurchaseAvailability(
              context.storefront,
              variants,
            );
            if (reason)
              return data({errors: [{message: reason}]}, {status: 409});
          }
        }
        result = await cart.updateLines(inputs.lines);
        break;
      case CartForm.ACTIONS.LinesRemove:
        result = await cart.removeLines(inputs.lineIds);
        break;
      case CartForm.ACTIONS.DiscountCodesUpdate: {
        const formDiscountCode =
          typeof inputs.discountCode === 'string'
            ? inputs.discountCode.trim()
            : '';

        // User inputted discount code
        const discountCodes = (
          formDiscountCode ? [formDiscountCode] : []
        ) as string[];

        // Combine discount codes already applied on cart
        discountCodes.push(...(inputs.discountCodes || []));

        result = await cart.updateDiscountCodes(discountCodes);
        break;
      }
      case CartForm.ACTIONS.GiftCardCodesUpdate: {
        const formGiftCardCode =
          typeof inputs.giftCardCode === 'string'
            ? inputs.giftCardCode.replace(/\s/g, '')
            : '';

        // User inputted gift card code
        const giftCardCodes = (
          formGiftCardCode ? [formGiftCardCode] : []
        ) as string[];

        // Combine gift card codes already applied on cart
        giftCardCodes.push(...(inputs.giftCardCodes || []));

        result = await cart.updateGiftCardCodes(giftCardCodes);
        break;
      }
      case CartForm.ACTIONS.GiftCardCodesRemove: {
        const appliedGiftCardIds = inputs.giftCardCodes as string[];
        result = await cart.removeGiftCardCodes(appliedGiftCardIds);
        break;
      }
      case CartForm.ACTIONS.BuyerIdentityUpdate: {
        result = await cart.updateBuyerIdentity({
          ...inputs.buyerIdentity,
        });
        break;
      }
      default:
        return data(
          {errors: [{message: 'Unsupported cart action.'}]},
          {status: 400},
        );
    }
  } catch {
    return data(
      {errors: [{message: 'We could not update your bag. Please try again.'}]},
      {status: 502},
    );
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const {cart: cartResult, errors, warnings} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string' && !errors?.length && !warnings?.length) {
    status = 303;
    headers.set('Location', safeLocalRedirect(redirectTo));
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

export async function loader({context}: Route.LoaderArgs) {
  const {cart} = context;
  return await cart.get();
}

export default function Cart() {
  const cart = useLoaderData<typeof loader>();

  return (
    <div className="cart t77-cart-page">
      <h1>Your bag</h1>
      <CartMain layout="page" cart={cart} />
    </div>
  );
}
