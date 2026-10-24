import {useEffect, useRef} from 'react';
import type {FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {CartFeedback, type CartResult} from './CartFeedback';

type Props = {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onSuccess?: () => void;
  className?: string;
  onChooseOption?: () => void;
};

export function AddToCartButton(props: Props) {
  return (
    <CartForm
      key={props.lines
        .map((line) => `${line.merchandiseId}:${line.quantity}`)
        .join('|')}
      route="/cart"
      inputs={{lines: props.lines}}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher) => <SubmitButton {...props} fetcher={fetcher} />}
    </CartForm>
  );
}

function SubmitButton({
  fetcher,
  analytics,
  children,
  disabled,
  lines,
  onSuccess,
  className,
  onChooseOption,
}: Props & {
  fetcher: FetcherWithComponents<CartResult>;
}) {
  const pending = useRef(false);
  useEffect(() => {
    if (fetcher.state !== 'idle') {
      pending.current = true;
      return;
    }
    if (!pending.current) return;
    pending.current = false;
    if (
      fetcher.data?.cart &&
      !fetcher.data.errors?.length &&
      !fetcher.data.warnings?.length
    )
      onSuccess?.();
  }, [fetcher.state, fetcher.data, onSuccess]);
  return (
    <>
      <input
        name="analytics"
        type="hidden"
        value={JSON.stringify(analytics) || ''}
      />
      <button
        type="submit"
        className={className}
        disabled={disabled || !lines.length || fetcher.state !== 'idle'}
      >
        {fetcher.state !== 'idle' ? 'Adding…' : children}
      </button>
      {fetcher.state === 'idle' && (
        <CartFeedback
          result={fetcher.data}
          context="add"
          onChooseOption={onChooseOption}
        />
      )}
    </>
  );
}
