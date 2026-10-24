/** Map the pointer to the rendered photo, including object-fit: contain padding. */
export function productZoom({
  width,
  height,
  naturalWidth,
  naturalHeight,
  x,
  y,
  panelWidth,
  panelHeight,
}: {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  x: number;
  y: number;
  panelWidth: number;
  panelHeight: number;
}) {
  if (
    [width, height, naturalWidth, naturalHeight, panelWidth, panelHeight].some(
      (value) => !Number.isFinite(value) || value <= 0,
    ) ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  )
    return null;
  const fit = Math.min(width / naturalWidth, height / naturalHeight);
  const renderedWidth = naturalWidth * fit;
  const renderedHeight = naturalHeight * fit;
  const offsetX = (width - renderedWidth) / 2;
  const offsetY = (height - renderedHeight) / 2;
  if (
    x < offsetX ||
    x > offsetX + renderedWidth ||
    y < offsetY ||
    y > offsetY + renderedHeight
  )
    return null;
  const scale = Math.max(
    2.5,
    panelWidth / renderedWidth,
    panelHeight / renderedHeight,
  );
  const lensWidth = panelWidth / scale;
  const lensHeight = panelHeight / scale;
  const left = Math.max(
    0,
    Math.min(x - offsetX - lensWidth / 2, renderedWidth - lensWidth),
  );
  const top = Math.max(
    0,
    Math.min(y - offsetY - lensHeight / 2, renderedHeight - lensHeight),
  );
  return {
    lensX: left + offsetX,
    lensY: top + offsetY,
    lensWidth,
    lensHeight,
    panelWidth,
    panelHeight,
    imageWidth: renderedWidth * scale,
    imageHeight: renderedHeight * scale,
    imageX: -left * scale,
    imageY: -top * scale,
  };
}
