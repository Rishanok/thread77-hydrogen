export type CartResult = {
  cart?: {id: string} | null;
  errors?: Array<{message: string}>;
  warnings?: Array<{message: string}>;
};

export function CartFeedback({
  result,
  context = 'cart',
  onChooseOption,
}: {
  result?: CartResult;
  context?: 'cart' | 'add';
  onChooseOption?: () => void;
}) {
  const [dismissedResult, setDismissedResult] = useState<CartResult>();
  const errors = [...new Set(result?.errors?.map(({message}) => message))];
  const warnings = [...new Set(result?.warnings?.map(({message}) => message))];
  if (
    !result ||
    result === dismissedResult ||
    (!errors.length && !warnings.length)
  )
    return null;
  return (
    <div className="cart-feedback">
      {[
        ...errors.map((message) => ({message, warning: false})),
        ...warnings.map((message) => ({message, warning: true})),
      ].map(({message, warning}) => {
        const unavailable =
          context === 'add' &&
          !warning &&
          /no longer available|sold out in this option/i.test(message);
        const title = warning
          ? 'Your bag has an update'
          : unavailable
            ? 'This option is unavailable'
            : context === 'add'
              ? 'Couldn’t add to your bag'
              : 'Couldn’t update your bag';
        const description = unavailable
          ? 'Choose another size or colour, or explore the collection to find your next favourite.'
          : message;
        return (
          <div
            key={`${warning}-${message}`}
            className={`cart-feedback__notice${warning ? ' cart-feedback__notice--warning' : ''}`}
            role={warning ? 'status' : 'alert'}
          >
            <span className="cart-feedback__icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6m0 3v1" />
              </svg>
            </span>
            <div className="cart-feedback__content">
              <p className="cart-feedback__title">{title}</p>
              <p className="cart-feedback__description">{description}</p>
              {unavailable && (
                <div className="cart-feedback__actions">
                  {onChooseOption && (
                    <button
                      type="button"
                      onClick={() => {
                        setDismissedResult(result);
                        onChooseOption();
                      }}
                    >
                      Choose another option <span aria-hidden="true">↑</span>
                    </button>
                  )}
                  <Link to="/collections/all">
                    Explore collection <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              )}
            </div>
            <button
              type="button"
              className="cart-feedback__dismiss"
              aria-label="Dismiss notification"
              onClick={(event) => {
                event.currentTarget
                  .closest('form')
                  ?.querySelector<HTMLButtonElement>('button[type="submit"]')
                  ?.focus();
                setDismissedResult(result);
              }}
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="m6 6 12 12M6 18 18 6" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
import {useState} from 'react';
import {Link} from 'react-router';
