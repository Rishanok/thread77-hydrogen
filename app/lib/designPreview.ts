/** Preview follows local browsing and explicit preview links; never enables buying. */
export function isDesignPreview(request: Request) {
  const url = new URL(request.url);
  const explicit = url.searchParams.get('preview');
  if (explicit !== null) return explicit === '1';
  return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
}
