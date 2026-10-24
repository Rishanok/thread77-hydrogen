import type {HomeScreenQuery} from 'storefrontapi.generated';
export type HomeProduct = NonNullable<
  HomeScreenQuery['collection']
>['products']['nodes'][number];
export const JEANS_ANGLES = ['right-side', 'three-quarter', 'front'] as const;
export const HANGER_POSITIONS = 5;

export type JeansAngle = (typeof JEANS_ANGLES)[number];

/** Render the entire uploaded image, including its hanger. */
export interface JeansFrame {
  src: string;
  width: number;
  height: number;
}

export interface HangingJeans {
  id: string;
  title: string;
  description: string;
  productUrl?: string;
  product?: HomeProduct;
  supportingText?: string;
  preview?: boolean;
  frames: Record<JeansAngle, JeansFrame>;
}

export type JeansRail = readonly HangingJeans[];

const jeanOneFrames: HangingJeans['frames'] = {
  'right-side': {
    src: '/products/jean-1/right-transparent.png',
    width: 500,
    height: 935,
  },
  'three-quarter': {
    src: '/products/jean-1/three-quarter-transparent.png',
    width: 500,
    height: 935,
  },
  front: {
    src: '/products/jean-1/front-transparent.png',
    width: 500,
    height: 935,
  },
};

function suppliedFrame(jean: number, view: string, height: number): JeansFrame {
  return {
    src: `/products/jean-${jean}/${view}-transparent.png`,
    width: 500,
    height,
  };
}

const jeanTwoFrames: HangingJeans['frames'] = {
  'right-side': suppliedFrame(2, 'side', 934),
  'three-quarter': suppliedFrame(2, 'three-quarter', 935),
  front: suppliedFrame(2, 'front', 935),
};

const jeanThreeFrames: HangingJeans['frames'] = {
  'right-side': suppliedFrame(3, 'side', 934),
  'three-quarter': suppliedFrame(3, 'three-quarter', 935),
  front: suppliedFrame(3, 'front', 934),
};

function previewPosition(position: number): HangingJeans {
  return {
    id: `jean-${position}-preview`,
    title: `Preview ${String(position).padStart(2, '0')}`,
    description: `Preview position ${position}, temporarily showing Jean 1 washed denim.`,
    supportingText: 'Jean 1 artwork / preview',
    preview: true,
    frames: jeanOneFrames,
  };
}

/** Replace each preview's frames and add its real product URL when supplied. */
export const hangingJeans: JeansRail = [
  {
    id: 'jean-1',
    title: 'Washed denim',
    description:
      'Blue wide-leg denim with a faded wash, contrast stitching and a clip hanger.',
    supportingText: 'Wide leg / faded wash',
    frames: jeanOneFrames,
  },
  {
    id: 'jean-2',
    title: 'Charcoal denim',
    description:
      'Charcoal wide-leg denim with faded panels, subtle fabric texture and a clip hanger.',
    supportingText: 'Wide leg / charcoal wash',
    frames: jeanTwoFrames,
  },
  {
    id: 'jean-3',
    title: 'Gothic denim',
    description:
      'Black wide-leg denim with gothic graphics, chains, red stars and a clip hanger.',
    supportingText: 'Wide leg / graphic details',
    frames: jeanThreeFrames,
  },
  previewPosition(4),
];

/** Preload the entire short reveal; preview positions share decoded images. */
export const jeansViewPreloads = [
  ...new Set(
    hangingJeans.flatMap((garment) =>
      JEANS_ANGLES.map((angle) => garment.frames[angle].src),
    ),
  ),
].map((href) => ({rel: 'preload', as: 'image', href}));

type ProductImage = HomeProduct['images']['nodes'][number];

function imageAngle(image: ProductImage): JeansAngle | undefined {
  // Explicit alt text takes priority over a filename's angle.
  for (const label of [
    image.altText ?? '',
    image.url.split('?')[0].split('/').pop() ?? '',
  ]) {
    if (
      /(?:^|[-_\s])(?:three[-_\s]?quarter|quarter|3[-_]4)(?:[-_\s.]|$)/i.test(
        label,
      )
    )
      return 'three-quarter';
    if (/(?:^|[-_\s])front(?:[-_\s.]|$)/i.test(label)) return 'front';
    if (/(?:^|[-_\s])(?:side|right)(?:[-_\s.]|$)/i.test(label))
      return 'right-side';
  }
}

/** Prefer named angles; otherwise use the first three uploads in gallery order. */
export function collectionGarments(products: HomeProduct[]): HangingJeans[] {
  return products.map((product) => {
    const images = [
      ...new Map(
        product.images.nodes.map((image) => [image.url, image]),
      ).values(),
    ];
    const named = (angle: JeansAngle) =>
      images.find((image) => imageAngle(image) === angle);
    const unlabelled = images.filter((image) => !imageAngle(image)).slice(0, 3);
    const side =
      named('right-side') ??
      unlabelled[0] ??
      named('three-quarter') ??
      images[0];
    const front =
      named('front') ??
      unlabelled.filter((image) => image !== side).at(-1) ??
      named('three-quarter') ??
      side;
    const middle =
      named('three-quarter') ??
      unlabelled.find((image) => image !== side && image !== front) ??
      side;
    const frame = (image: ProductImage | undefined): JeansFrame => {
      const width = image?.width || 500;
      const height = image?.height || 935;
      return {src: image?.url || '/favicon.svg', width, height};
    };
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      productUrl: `/products/${product.handle}`,
      product,
      frames: {
        'right-side': frame(side),
        'three-quarter': frame(middle),
        front: frame(front),
      },
    };
  });
}

/** Repeat the collection in order to fill the rail without duplicating products in Shopify. */
export function fillJeansRail(garments: JeansRail): HangingJeans[] {
  if (!garments.length) return [];
  return Array.from(
    {length: HANGER_POSITIONS},
    (_, position) => garments[position % garments.length],
  );
}
