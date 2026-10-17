import type {ReactNode} from 'react';
import {Form, Link, useSearchParams} from 'react-router';
import {homePreview} from '~/data/homePreview';
import {PreviewCard} from './PreviewCard';

export const previewCategories = [
  {handle: 'all', title: 'All pieces', image: 0},
  {handle: 'tees', title: 'Tees', image: 1},
  {handle: 'jeans', title: 'Jeans', image: 3},
  {handle: 'shirts', title: 'Shirts', image: 8},
  {handle: 'layers', title: 'Layers', image: 6},
];

function categoryFor(title: string) {
  if (/jeans/i.test(title)) return 'jeans';
  if (/hoodie/i.test(title)) return 'layers';
  if (/t[ -]?shirt|t-ees|tee/i.test(title)) return 'tees';
  return 'shirts';
}

export function CollectionLayout({
  title,
  description,
  preview = false,
  children,
}: {
  title: string;
  description: string;
  preview?: boolean;
  count?: number;
  children: ReactNode;
}) {
  return (
    <div className="t77-collection-page">
      <nav className="t77-collection-breadcrumb" aria-label="Breadcrumb">
        <Link to={preview ? '/?preview=1' : '/'}>Home</Link>
        <span>/</span>
        <Link to={preview ? '/collections?preview=1' : '/collections'}>
          Collections
        </Link>
        <span>/</span>
        <span aria-current="page">{title}</span>
      </nav>
      <header className="t77-collection-heading">
        <div>
          <span>THE THREAD77 WARDROBE</span>
          <h1>{title}</h1>
        </div>
        <p>{description}</p>
      </header>
      {preview && (
        <div className="t77-collection-notice" role="note">
          <span>
            Design preview · Sample pieces, not available to purchase.
          </span>
          <Link to="/collections/all?preview=0">View live catalogue ↗</Link>
        </div>
      )}
      {children}
      <div className="t77-collection-signoff">
        <span>Made for your everyday rotation.</span>
        <Link to={preview ? '/?preview=1' : '/'}>Discover Thread77 ↗</Link>
      </div>
    </div>
  );
}

export function PreviewCollection({
  category: fixedCategory,
}: {category?: string} = {}) {
  const [params] = useSearchParams();
  const category = fixedCategory || params.get('category') || 'all';
  const sort = params.get('sort') || 'newest';
  const items = homePreview
    .map((item, index) => ({...item, index}))
    .filter(
      (item) => category === 'all' || categoryFor(item.title) === category,
    );
  if (sort === 'title') items.sort((a, b) => a.title.localeCompare(b.title));
  return (
    <>
      <nav className="t77-collection-tabs" aria-label="Product category">
        {previewCategories.map((item) => (
          <Link
            key={item.handle}
            to={
              ['jeans', 'tees'].includes(item.handle)
                ? `/collections/${item.handle}?preview=1&sort=${sort}`
                : `/collections/all?preview=1&category=${item.handle}&sort=${sort}`
            }
            aria-current={category === item.handle ? 'page' : undefined}
          >
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="t77-collection-toolbar">
        <span>{items.length} sample pieces</span>
        <Form method="get" className="t77-collection-sort">
          <input type="hidden" name="preview" value="1" />
          <input type="hidden" name="category" value={category} />
          <label htmlFor="preview-sort">Sort by</label>
          <select id="preview-sort" name="sort" defaultValue={sort} key={sort}>
            <option value="newest">Featured</option>
            <option value="title">Name: A–Z</option>
          </select>
          <button type="submit">Apply</button>
        </Form>
      </div>
      {items.length ? (
        <div className="t77-collection-grid">
          {items.map((item) => (
            <PreviewCard key={item.index} index={item.index} />
          ))}
        </div>
      ) : (
        <CollectionEmpty />
      )}
    </>
  );
}

export function CollectionEmpty() {
  const [params] = useSearchParams();
  const filtered = ['min', 'max', 'available', 'filter', 'category'].some(
    (key) => !!params.get(key),
  );
  return (
    <div className="t77-collection-empty" role="status">
      <span aria-hidden="true">↗</span>
      <h2>
        {filtered ? 'A little too specific?' : 'New pieces are on their way.'}
      </h2>
      <p>
        {filtered
          ? 'Try removing a filter to see more of the collection.'
          : 'The collection will appear here when products are released.'}
      </p>
      <Link to={filtered ? '?sort=newest' : '/'}>
        {filtered ? 'Clear filters' : 'Explore Thread77'} ↗
      </Link>
    </div>
  );
}
