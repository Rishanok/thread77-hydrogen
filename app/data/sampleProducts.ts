import {SCRAPED_PRODUCTS, type ScrapedProduct} from './scrapedProducts';

export type SampleProduct = ScrapedProduct;

// Export all 126 scraped products as the primary catalog
export const SAMPLE_PRODUCTS: SampleProduct[] = SCRAPED_PRODUCTS;
