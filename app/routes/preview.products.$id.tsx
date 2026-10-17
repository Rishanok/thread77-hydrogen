import {useState} from 'react';
import {Link, useLoaderData, useNavigate} from 'react-router';
import type {Route} from './+types/preview.products.$id';
import {previewProducts, previewMoney} from '~/lib/previewProducts';
import {usePreviewBag} from '~/lib/previewBag';

export const meta: Route.MetaFunction = () => [
  {title: 'Test product | Thread77'},
  {name: 'robots', content: 'noindex, nofollow'},
];

export function loader({params}: Route.LoaderArgs) {
  const product = previewProducts.find((item) => item.id === params.id);
  if (!product) throw new Response('Preview product not found', {status: 404});
  return {product};
}

export default function PreviewProduct() {
  const {product} = useLoaderData<typeof loader>();
  return <PreviewProductDetails key={product.id} product={product} />;
}

function PreviewProductDetails({
  product,
}: {
  product: (typeof previewProducts)[number];
}) {
  const [size, setSize] = useState(product.sizes[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const bag = usePreviewBag();
  const navigate = useNavigate();

  const emiAmount = Math.round(product.price / 3);

  const handleAddToBag = () => {
    if (!size) return;
    for (let i = 0; i < quantity; i++) {
      bag.add(product.id, size);
    }
    void navigate('/preview/cart');
  };

  const handleBuyNow = () => {
    handleAddToBag();
  };

  return (
    <div className="t77-pdp">
      <div className="t77-collection-notice" role="note" style={{marginBottom: '20px'}}>
        <span>
          Interactive test product · Example prices · No real order will be placed.
        </span>
        <Link to="/preview/cart">Preview bag ({bag.count}) ↗</Link>
      </div>

      <nav className="t77-pdp-breadcrumb" aria-label="Breadcrumb">
        <Link to="/?preview=1">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/collections/${product.category.toLowerCase()}?preview=1`}>
          {product.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.title}</span>
      </nav>

      <div className="t77-pdp-layout">
        {/* Left: Gallery Column */}
        <div className="t77-pdp-gallery">
          <div className="t77-pdp-gallery-item">
            <img
              src={product.image}
              alt={product.title}
              loading="eager"
            />
          </div>
        </div>

        {/* Right: Sticky Panel */}
        <div className="t77-pdp-panel">
          <div className="t77-pdp-header">
            <h1>{product.title}</h1>
            <div className="t77-pdp-price">
              <span>{previewMoney(product.price)}</span>
              {product.compareAtPrice && (
                <s style={{marginLeft: '10px', color: '#888', fontWeight: 400}}>
                  {previewMoney(product.compareAtPrice)}
                </s>
              )}
            </div>
          </div>

          {/* EMI Banner */}
          <div className="t77-pdp-emi-strip">
            <span className="t77-pdp-emi-badge">NEW</span>
            <span className="t77-pdp-emi-text">
              or <strong>₹{emiAmount}/month</strong> (3 months) No Cost EMI on UPI
            </span>
            <button
              type="button"
              className="t77-pdp-emi-btn"
              onClick={handleBuyNow}
            >
              Buy On EMI
            </button>
          </div>

          {/* Size Section */}
          <div className="t77-pdp-option-section">
            <div className="t77-pdp-option-label-row">
              <span>
                SIZE: <strong>{size}</strong>
              </span>
              <button
                type="button"
                className="t77-pdp-size-guide-btn"
                onClick={() => setIsSizeGuideOpen(true)}
              >
                Size Guide
              </button>
            </div>

            <div className="t77-pdp-sizes-grid">
              {product.sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`t77-pdp-size-btn ${size === option ? 'is-selected' : ''}`}
                  onClick={() => setSize(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Stepper & Add to Cart */}
          <div className="t77-pdp-actions-row">
            <div className="t77-pdp-stepper">
              <button
                type="button"
                className="t77-pdp-stepper-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="t77-pdp-stepper-value">{quantity}</span>
              <button
                type="button"
                className="t77-pdp-stepper-btn"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="t77-pdp-add-btn"
              onClick={handleAddToBag}
            >
              Add to Bag — {previewMoney(product.price * quantity)}
            </button>
          </div>

          {/* Buy it now */}
          <button
            type="button"
            className="t77-pdp-buy-now-btn"
            onClick={handleBuyNow}
          >
            Buy it now
          </button>

          {/* Accordions */}
          <div className="t77-pdp-accordions">
            <details className="t77-pdp-accordion-item" open>
              <summary className="t77-pdp-accordion-trigger">
                <span>Description</span>
                <span className="t77-pdp-accordion-chevron">⌵</span>
              </summary>
              <div className="t77-pdp-accordion-content">
                <p>
                  Elevated relaxed streetwear silhouette crafted with premium heavyweight cotton. Designed for comfort and effortless everyday layering.
                </p>
              </div>
            </details>

            <details className="t77-pdp-accordion-item">
              <summary className="t77-pdp-accordion-trigger">
                <span>Care Product</span>
                <span className="t77-pdp-accordion-chevron">⌵</span>
              </summary>
              <div className="t77-pdp-accordion-content">
                <p>
                  Machine wash cold with like colors. Turn inside out before washing to protect tone. Do not bleach. Air dry or tumble dry low.
                </p>
                <p style={{marginTop: '8px'}}>
                  <strong>Fabric:</strong> 100% Heavyweight Cotton (420 GSM)
                </p>
                <p style={{marginTop: '4px'}}>
                  <strong>Fit:</strong> Relaxed Boxy Streetwear Cut
                </p>
              </div>
            </details>

            <details className="t77-pdp-accordion-item">
              <summary className="t77-pdp-accordion-trigger">
                <span>Shipping and Returns</span>
                <span className="t77-pdp-accordion-chevron">⌵</span>
              </summary>
              <div className="t77-pdp-accordion-content">
                <p>
                  Dispatched within 24-48 business hours. Standard pan-India delivery arrives in 3-5 working days. Express shipping available at checkout.
                </p>
                <p style={{marginTop: '8px'}}>
                  Hassle-free 7-day exchange and returns on all unworn items with tags attached.
                </p>
              </div>
            </details>
          </div>

          {/* Share Strip */}
          <div className="t77-pdp-share-strip">
            <span className="t77-pdp-share-label">SHARE:</span>
            <div className="t77-pdp-share-icons">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(product.title + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="t77-pdp-share-btn"
                title="Share on WhatsApp"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(product.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="t77-pdp-share-btn"
                title="Share on X"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <button
                type="button"
                className="t77-pdp-share-btn"
                title={copied ? 'Copied!' : 'Copy link'}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    void navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
              >
                {copied ? '✓' : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sizing Modal */}
      {isSizeGuideOpen && (
        <div
          className="t77-size-guide-overlay"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="t77-size-guide-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                }}
              >
                Size Guide
              </h3>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>
            <p
              style={{
                fontSize: '0.8rem',
                color: '#666',
                marginTop: '6px',
                marginBottom: '16px',
              }}
            >
              Measurements in inches. Regular relaxed streetwear fit.
            </p>
            <table className="t77-size-guide-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Chest / Waist</th>
                  <th>Length</th>
                  <th>Shoulder / Rise</th>
                  <th>Sleeve / Hem</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>S / 28</td><td>38" / 29"</td><td>28" / 41"</td><td>19" / 11.5"</td><td>9" / 19"</td></tr>
                <tr><td>M / 30</td><td>40" / 31"</td><td>29" / 42"</td><td>20" / 12.0"</td><td>9.5" / 20"</td></tr>
                <tr><td>L / 32</td><td>42" / 33"</td><td>30" / 42"</td><td>21" / 12.5"</td><td>10" / 21"</td></tr>
                <tr><td>XL / 34</td><td>44" / 35"</td><td>31" / 43"</td><td>22" / 13.0"</td><td>10.5" / 22"</td></tr>
                <tr><td>XXL / 36</td><td>46" / 37"</td><td>32" / 43"</td><td>23" / 13.5"</td><td>11" / 22.5"</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
