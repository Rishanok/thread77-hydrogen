import {data, Link, redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/checkout';
import {checkPurchaseAvailability} from '~/lib/launch.server';

export const meta: Route.MetaFunction = () => [
  {title: 'Checkout | Thread77'},
  {name: 'robots', content: 'noindex'},
];

export async function loader({context}: Route.LoaderArgs) {
  try {
    const cart = await context.cart.get({numCartLines: 250});
    if (!cart?.lines.nodes.length) return redirect('/cart');
    if (cart.lines.pageInfo.hasNextPage)
      return data(
        {
          error:
            'Please reduce the number of items in your bag before checking out.',
        },
        {status: 409},
      );
    const reason = await checkPurchaseAvailability(
      context.storefront,
      cart.lines.nodes.map((line) => line.merchandise.id),
    );
    if (reason) return data({error: reason}, {status: 409});
    if (!cart.checkoutUrl)
      return data(
        {error: 'Checkout is temporarily unavailable. Please try again.'},
        {status: 503},
      );
    return redirect(cart.checkoutUrl);
  } catch {
    return data(
      {error: 'We could not check your bag. Please try again.'},
      {status: 503},
    );
  }
}

export default function Checkout() {
  const {error} = useLoaderData<typeof loader>();
  return (
    <div className="t77-collection-page">
      <h1>Check your bag</h1>
      <p role="alert">{error}</p>
      <Link to="/cart">Return to bag →</Link>
    </div>
  );
}
