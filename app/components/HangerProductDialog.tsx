import {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link} from 'react-router';
import {Money} from '@shopify/hydrogen';
import type {HomeProduct} from '~/data/hangingJeans';
import {productState} from '~/lib/launch';
import {AddToCartButton} from './AddToCartButton';

export function HangerProductDialog({product, onClose}: {product: HomeProduct; onClose: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const variants = product.variants.nodes;
  const [variantId, setVariantId] = useState(variants.length === 1 ? variants[0].id : '');
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const variant = variants.find((item) => item.id === variantId);
  const state = productState(product);
  const images = product.images.nodes;
  const image = images[imageIndex];
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);
  return createPortal(
    <dialog ref={dialog} className="hanger-dialog" aria-labelledby={titleId}
      onCancel={onClose} onClose={onClose}
      onClick={(event) => {if (event.target === event.currentTarget) onClose();}}>
      <div className="hanger-dialog__panel">
        <button type="button" className="hanger-dialog__close" onClick={onClose} autoFocus aria-label="Close product details">✕</button>
        <div className="hanger-dialog__gallery">
          {image ? <img className="hanger-dialog__image" src={image.url} alt={product.title} /> : <p>Image coming soon</p>}
          <div className="hanger-dialog__thumbnails" aria-label="Product images">
            {images.map((item, index) => <button key={item.url} type="button" aria-label={`View image ${index + 1}`} aria-pressed={imageIndex === index} onClick={() => setImageIndex(index)}><img src={item.url} alt="" loading="lazy" /></button>)}
          </div>
        </div>
        <div className="hanger-dialog__details">
          <p className="hanger-dialog__eyebrow">THREAD77 / THE COLLECTION</p>
          <h2 id={titleId}>{product.title}</h2>
          {variant ? <Money data={variant.price} /> : <p>Select an option to see its price</p>}
          <p className="hanger-dialog__description">{product.description}</p>
          <label htmlFor={`${titleId}-variant`}>Size / colour</label>
          <select id={`${titleId}-variant`} value={variantId} onChange={(event) => {
            setVariantId(event.target.value); setAdded(false);
            const next = variants.find((item) => item.id === event.target.value);
            const index = images.findIndex((item) => item.url === next?.image?.url);
            if (index >= 0) setImageIndex(index);
          }}>
            <option value="" disabled>Choose your option</option>
            {variants.map((item) => <option key={item.id} value={item.id} disabled={!item.availableForSale}>{item.title === 'Default Title' ? 'One size' : item.title}{!item.availableForSale ? ' — Sold out' : ''}</option>)}
          </select>
          <AddToCartButton className="hanger-dialog__add" disabled={!variant?.availableForSale || state !== 'available'} lines={variant ? [{merchandiseId: variant.id, quantity: 1}] : []} onSuccess={() => setAdded(true)}>
            {state === 'coming_soon' ? 'Coming soon' : state === 'sold_out' ? 'Sold out' : !variant ? 'Choose an option' : 'Add to bag'}
          </AddToCartButton>
          {added && <p role="status">Added to your bag. <Link to="/cart" onClick={onClose}>View bag & checkout →</Link></p>}
          {product.variants.pageInfo.hasNextPage && <p>More options are available on the full product page.</p>}
          <Link to={`/products/${product.handle}`} onClick={onClose}>Full product details ↗</Link>
        </div>
      </div>
    </dialog>, document.body,
  );
}
