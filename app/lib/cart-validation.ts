export function safeLocalRedirect(value: unknown, fallback = '/cart') {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\r\n]/.test(value)
  )
    return fallback;
  return value;
}

export function validCartLines(lines: unknown, update = false): boolean {
  if (!Array.isArray(lines) || !lines.length || lines.length > 250)
    return false;
  return lines.every((value) => {
    if (!value || typeof value !== 'object') return false;
    const line = value as Record<string, unknown>;
    return (
      typeof line.quantity === 'number' &&
      Number.isSafeInteger(line.quantity) &&
      line.quantity >= (update ? 0 : 1) &&
      (update
        ? typeof line.id === 'string' &&
          line.id.startsWith('gid://shopify/CartLine/')
        : typeof line.merchandiseId === 'string' &&
          /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(line.merchandiseId))
    );
  });
}
