export function storefrontMenuUrl(
  url: string | null | undefined,
  domains: Array<string | undefined>,
) {
  if (!url) return null;
  try {
    const parsed = new URL(url, 'https://storefront.local');
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol))
      return null;
    const hosts = domains
      .filter(Boolean)
      .map(
        (domain) =>
          new URL(domain!.startsWith('http') ? domain! : `https://${domain}`)
            .hostname,
      );
    if (
      parsed.hostname === 'storefront.local' ||
      hosts.includes(parsed.hostname)
    ) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
    return parsed.href;
  } catch {
    return null;
  }
}
