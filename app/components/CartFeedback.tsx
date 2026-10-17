export type CartResult = {
  cart?: {id: string} | null;
  errors?: Array<{message: string}>;
  warnings?: Array<{message: string}>;
};

export function CartFeedback({result}: {result?: CartResult}) {
  if (!result) return null;
  return (
    <div aria-live="polite">
      {[...new Set(result.errors?.map(({message}) => message))].map(
        (message) => (
          <p role="alert" key={`error-${message}`}>
            {message}
          </p>
        ),
      )}
      {[...new Set(result.warnings?.map(({message}) => message))].map(
        (message) => (
          <p role="status" key={`warning-${message}`}>
            {message}
          </p>
        ),
      )}
    </div>
  );
}
