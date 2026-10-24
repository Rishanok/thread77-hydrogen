import {useState} from 'react';
import {Link, useLoaderData, useNavigate} from 'react-router';
import type {Route} from './+types/preview.products.$id';
import {previewProducts, previewMoney} from '~/lib/previewProducts';
import {usePreviewBag} from '~/lib/previewBag';
import {SCRAPED_PRODUCTS} from '~/data/scrapedProducts';
import {
  ProductGallery,
  ProductHeading,
  ProductIcon,
  ProductInformation,
  ProductPurchase,
  ProductShare,
  ProductSizeGuide,
  type ProductPhoto,
} from '~/components/ProductExperience';

export const meta: Route.MetaFunction = ({data}) => [
  {title: `${data?.product.title || 'Preview product'} | Thread77`},
  {name: 'robots', content: 'noindex, nofollow'},
];

export function loader({params}: Route.LoaderArgs) {
  const product = previewProducts.find((item) => item.id === params.id);
  if (!product) throw new Response('Preview product not found', {status: 404});
  const catalogProduct = SCRAPED_PRODUCTS.find(
    (item) => item.featuredImage?.url === product.image,
  );
  const images: ProductPhoto[] =
    catalogProduct?.media.nodes
      .filter((media) => media.image?.url)
      .map((media) => ({
        url: String(media.image.url),
        altText: String(media.image.altText || product.title),
      })) || [];
  return {
    product,
    images: images.length
      ? images
      : [{url: product.image, altText: product.title}],
    descriptionHtml: catalogProduct?.descriptionHtml || '',
  };
}

export default function PreviewProduct() {
  const data = useLoaderData<typeof loader>();
  return <PreviewProductDetails key={data.product.id} {...data} />;
}

function PreviewProductDetails({
  product,
  images,
  descriptionHtml,
}: ReturnType<typeof loader>) {
  const [size, setSize] = useState(product.sizes[0] || '');
  const [quantity, setQuantity] = useState(1);
  const bag = usePreviewBag();
  const navigate = useNavigate();
  const related = [
    ...previewProducts.filter(
      (item) => item.id !== product.id && item.category === product.category,
    ),
    ...previewProducts.filter((item) => item.category !== product.category),
  ].slice(0, 4);
  const addButton = (
    <button
      type="button"
      className="t77-pdp-add-btn"
      disabled={!size}
      onClick={() => {
        if (!size) return;
        bag.add(product.id, size, quantity);
        void navigate('/preview/cart');
      }}
    >
      <ProductIcon name="bag" />
      Add to bag
      <ProductIcon name="arrow" />
    </button>
  );

  return (
    <div className="t77-pdp">
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
        <ProductGallery images={images} title={product.title} />
        <div className="t77-pdp-panel">
          <ProductHeading
            title={product.title}
            category={product.category}
            price={previewMoney(product.price)}
            compareAtPrice={
              product.compareAtPrice
                ? previewMoney(product.compareAtPrice)
                : null
            }
            salePercent={
              product.compareAtPrice
                ? Math.round((1 - product.price / product.compareAtPrice) * 100)
                : undefined
            }
            preview
          />
          <div className="t77-pdp-option-section">
            <div className="t77-pdp-option-label-row">
              <span>
                Select size <strong>{size}</strong>
              </span>
              <ProductSizeGuide />
            </div>
            <div className="t77-pdp-sizes-grid" role="group" aria-label="Size">
              {product.sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`t77-pdp-size-btn ${size === option ? 'is-selected' : ''}`}
                  aria-pressed={size === option}
                  aria-label={`Size: ${option}`}
                  onClick={() => setSize(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <ProductPurchase
            quantity={quantity}
            onQuantityChange={setQuantity}
            addButton={addButton}
            price={previewMoney(product.price * quantity)}
            selection={`Size ${size}`}
          />
          <div className="t77-pdp-preview-note" role="note">
            <span>Design preview · No real orders</span>
            <Link to="/preview/cart">Your preview bag ({bag.count}) ↗</Link>
          </div>
          <ProductInformation
            description={
              descriptionHtml ? (
                <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
              ) : (
                <p>
                  A piece from the Thread77 preview collection. Explore the
                  details and find your everyday fit.
                </p>
              )
            }
            preview
          />
          <ProductShare />
        </div>
      </div>
      {related.length > 0 && (
        <section
          className="t77-pdp-related"
          aria-labelledby="pdp-related-heading"
        >
          <div className="t77-pdp-related-heading">
            <div>
              <p className="t77-pdp-eyebrow">KEEP EXPLORING</p>
              <h2 id="pdp-related-heading">Your next rotation.</h2>
            </div>
            <Link to="/collections/all?preview=1">
              Shop all <ProductIcon name="arrow" />
            </Link>
          </div>
          <div className="t77-pdp-related-grid">
            {related.map((item) => (
              <Link
                key={item.id}
                to={`/preview/products/${item.id}`}
                className="t77-pdp-related-card"
              >
                <div>
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="t77-pdp-related-card__image--front"
                  />
                  {item.secondaryImage ? (
                    <img
                      src={item.secondaryImage}
                      alt={item.title}
                      loading="lazy"
                      className="t77-pdp-related-card__image--back"
                    />
                  ) : null}
                  <span>
                    <ProductIcon name="arrow" />
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{previewMoney(item.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
