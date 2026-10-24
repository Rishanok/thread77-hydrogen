import {Link} from 'react-router';
import {previewProducts, previewMoney} from '~/lib/previewProducts';

export function PreviewCard({index}: {index: number}) {
  const item = previewProducts[index % previewProducts.length];
  return (
    <article className="t77-preview-card">
      <div className="t77-preview-card-image">
        <Link to={`/preview/products/${item.id}`}>
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            width="600"
            height="780"
            className="t77-preview-card__image--front"
          />
          {item.secondaryImage ? (
            <img
              src={item.secondaryImage}
              alt={item.title}
              loading="lazy"
              width="600"
              height="780"
              className="t77-preview-card__image--back"
            />
          ) : null}
        </Link>
        <span>{item.compareAtPrice ? 'Sale · Sample' : 'Test product'}</span>
        <details className="t77-preview-options">
          <summary aria-label={`Preview quick add for ${item.title}`}>
            +
          </summary>
          <div>
            <strong>{previewMoney(item.price)}</strong>
            <p>Choose your size on the test product page.</p>
            <Link to={`/preview/products/${item.id}`}>Select size ↗</Link>
          </div>
        </details>
      </div>
      <Link to={`/preview/products/${item.id}`}>
        <h3>{item.title}</h3>
      </Link>
      <div className="t77-preview-price">
        {previewMoney(item.price)}{' '}
        {item.compareAtPrice && <s>{previewMoney(item.compareAtPrice)}</s>}
      </div>
      <p>Example price · Test product</p>
    </article>
  );
}
