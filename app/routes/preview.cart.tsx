import {Link} from 'react-router';
import {usePreviewBag} from '~/lib/previewBag';
import {
  previewProducts,
  previewMoney,
  previewTotal,
} from '~/lib/previewProducts';
export const meta = () => [
  {title: 'Preview bag | Thread77'},
  {name: 'robots', content: 'noindex, nofollow'},
];
export default function PreviewCart() {
  const bag = usePreviewBag();
  return (
    <div className="t77-cart-page">
      <div className="t77-collection-notice" role="note">
        <span>Test bag · Saved only in this browser · No real purchases</span>
        <Link to="/collections/all?preview=1">Continue shopping ↗</Link>
      </div>
      <header className="t77-collection-heading">
        <div>
          <span>YOUR EVERYDAY ROTATION</span>
          <h1>
            Your bag <small>({bag.count})</small>
          </h1>
        </div>
      </header>
      {bag.lines.length ? (
        <div className="t77-preview-cart-layout">
          <ul className="t77-preview-cart-lines">
            {bag.lines.map((line) => {
              const product = previewProducts.find(
                (item) => item.id === line.productId,
              )!;
              return (
                <li key={`${line.productId}-${line.size}`}>
                  <Link to={`/preview/products/${product.id}`}>
                    <img
                      src={product.image}
                      alt={product.title}
                      width="110"
                      height="143"
                    />
                  </Link>
                  <div>
                    <Link to={`/preview/products/${product.id}`}>
                      <h2>{product.title}</h2>
                    </Link>
                    <p>Size: {line.size}</p>
                    <p>
                      {previewMoney(product.price)}{' '}
                      {product.compareAtPrice && (
                        <s>{previewMoney(product.compareAtPrice)}</s>
                      )}
                    </p>
                    <div className="t77-preview-quantity">
                      <button
                        aria-label={`Decrease quantity of ${product.title}, size ${line.size}`}
                        disabled={line.quantity <= 1}
                        onClick={() =>
                          bag.update(
                            line.productId,
                            line.size,
                            line.quantity - 1,
                          )
                        }
                      >
                        −
                      </button>
                      <span aria-live="polite">{line.quantity}</span>
                      <button
                        aria-label={`Increase quantity of ${product.title}, size ${line.size}`}
                        disabled={line.quantity >= 20}
                        onClick={() =>
                          bag.update(
                            line.productId,
                            line.size,
                            line.quantity + 1,
                          )
                        }
                      >
                        +
                      </button>
                      <button
                        onClick={() => bag.update(line.productId, line.size, 0)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <strong>{previewMoney(product.price * line.quantity)}</strong>
                </li>
              );
            })}
          </ul>
          <div className="t77-preview-cart-summary">
            <h2>Order summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>{previewMoney(previewTotal(bag.lines))}</strong>
            </div>
            <p>
              Example prices. Shipping and taxes are not calculated in this
              preview.
            </p>
            <button disabled>Checkout unavailable in preview</button>
            <Link to="/collections/all?preview=1">Add another piece ↗</Link>
          </div>
        </div>
      ) : (
        <div className="t77-collection-empty">
          <h2>Your next favourite is waiting.</h2>
          <p>Choose a test piece and size to see it here.</p>
          <Link to="/collections/all?preview=1">Explore the collection ↗</Link>
        </div>
      )}
    </div>
  );
}
