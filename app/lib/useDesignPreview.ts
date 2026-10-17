import {useLocation, useMatches} from 'react-router';
export function useDesignPreview() {
  const {pathname} = useLocation();
  const matches = useMatches();
  return (
    pathname.startsWith('/preview/') ||
    matches.some(
      ({data}) =>
        !!data &&
        typeof data === 'object' &&
        'preview' in data &&
        data.preview === true,
    )
  );
}
