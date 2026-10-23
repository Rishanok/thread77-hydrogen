import type {HomeScreenQuery} from 'storefrontapi.generated';
export type HomeProduct = NonNullable<HomeScreenQuery['collection']>['products']['nodes'][number];
export const JEANS_ANGLES = ['right-side', 'three-quarter', 'front'] as const;

export type JeansAngle = (typeof JEANS_ANGLES)[number];

/** Pixel coordinates refer to the original, unmodified transparent PNG. */
export interface JeansFrame {
  src: string;
  width: number;
  height: number;
  pivot: {x: number; y: number};
  /** Distance from the suspension pivot to the lowest hem, in source pixels. */
  hangingLength: number;
  /** Hide only the source upper hook where the scene already supplies one. */
  cropTop: number;
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
    pivot: {x: 249.5, y: 100},
    hangingLength: 821,
    cropTop: 100,
  },
  'three-quarter': {
    src: '/products/jean-1/three-quarter-transparent.png',
    width: 500,
    height: 935,
    pivot: {x: 251.5, y: 100},
    hangingLength: 815,
    cropTop: 100,
  },
  front: {
    src: '/products/jean-1/front-transparent.png',
    width: 500,
    height: 935,
    pivot: {x: 251, y: 100},
    hangingLength: 813,
    cropTop: 100,
  },
};

/** Match the shortened stem to the scene swivel, with a common hem height. */
function suppliedFrame(
  jean: number,
  view: string,
  height: number,
  pivotX: number,
  hemY: number,
): JeansFrame {
  return {
    src: `/products/jean-${jean}/${view}-transparent.png`,
    width: 500,
    height,
    pivot: {x: pivotX, y: 100},
    hangingLength: hemY - 100,
    cropTop: 100,
  };
}

const jeanTwoFrames: HangingJeans['frames'] = {
  'right-side': suppliedFrame(2, 'side', 934, 251, 928),
  'three-quarter': suppliedFrame(2, 'three-quarter', 935, 251.5, 920),
  front: suppliedFrame(2, 'front', 935, 250, 917),
};

const jeanThreeFrames: HangingJeans['frames'] = {
  'right-side': suppliedFrame(3, 'side', 934, 248, 907),
  'three-quarter': suppliedFrame(3, 'three-quarter', 935, 251.5, 896),
  front: suppliedFrame(3, 'front', 934, 250, 887),
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

/** Hanger uploads use the same 500 × 935 canvas and hook pivot as the supplied art. */
export function collectionGarments(products: HomeProduct[]): HangingJeans[] {
  return products.map((product) => {
    const images = product.images.nodes;
    const front = images.find((image) => image.altText?.trim().toLowerCase() === 'hanger-front') ?? images[0];
    const frame = (tag: string): JeansFrame => {
      const image = images.find((item) => item.altText?.trim().toLowerCase() === tag) ?? front;
      const prepared = image?.altText?.trim().toLowerCase().startsWith('hanger-');
      const width = image?.width || 500;
      const height = image?.height || 935;
      return {src: image?.url || '/favicon.svg', width, height,
        pivot: {x: width / 2, y: prepared ? height * 100 / 935 : 0},
        hangingLength: prepared ? height * 821 / 935 : height,
        cropTop: prepared ? height * 100 / 935 : 0};
    };
    return {id: product.id, title: product.title, description: product.description,
      productUrl: `/products/${product.handle}`, product,
      frames: {'right-side': frame('hanger-side'), 'three-quarter': frame('hanger-three-quarter'), front: frame('hanger-front')}};
  });
}
