import {
  Form,
  Link,
  useLocation,
  useSearchParams,
  useNavigation,
} from 'react-router';

type Facet = {
  id: string;
  label: string;
  type: string;
  values: Array<{id: string; label: string; count: number; input: unknown}>;
};
const encode = (input: unknown) =>
  typeof input === 'string' ? input : JSON.stringify(input);
export function CatalogControls({
  facets = [],
  count = 0,
}: {
  facets?: Facet[];
  count?: number;
}) {
  const [params] = useSearchParams();
  const {pathname} = useLocation();
  const navigation = useNavigation();
  return (
    <div className="t77-live-catalog-toolbar">
      <span>{count} pieces on this page</span>
      <details className="t77-filter-panel">
        <summary>
          Filter & sort <span aria-hidden="true">+</span>
        </summary>
        <Form
          method="get"
          action={pathname}
          className="catalog-controls"
          key={params.toString()}
        >
          <label>
            Sort by{' '}
            <select name="sort" defaultValue={params.get('sort') || 'newest'}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="title">Name: A–Z</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              name="available"
              value="true"
              defaultChecked={params.get('available') === 'true'}
            />{' '}
            In stock only
          </label>
          <label>
            Minimum price{' '}
            <input
              type="number"
              name="min"
              min="0"
              step="0.01"
              defaultValue={params.get('min') || ''}
            />
          </label>
          <label>
            Maximum price{' '}
            <input
              type="number"
              name="max"
              min="0"
              step="0.01"
              defaultValue={params.get('max') || ''}
            />
          </label>
          {facets
            .filter((facet) => facet.type === 'LIST')
            .map((facet) => {
              const values = facet.values.filter((value) =>
                /"(variantOption|productType|productVendor|tag)"/.test(
                  encode(value.input),
                ),
              );
              if (!values.length) return null;
              return (
                <details key={facet.id}>
                  <summary>{facet.label}</summary>
                  {values.map((value) => (
                    <label key={value.id}>
                      <input
                        type="checkbox"
                        name="filter"
                        value={encode(value.input)}
                        defaultChecked={params
                          .getAll('filter')
                          .includes(encode(value.input))}
                      />{' '}
                      {value.label} ({value.count})
                    </label>
                  ))}
                </details>
              );
            })}
          <button type="submit" disabled={navigation.state !== 'idle'}>
            Apply
          </button>
          <Link to={pathname}>Clear filters</Link>
        </Form>
      </details>
    </div>
  );
}
