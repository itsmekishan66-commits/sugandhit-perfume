import type { CategoryOption, ProductCategory } from './categories.types';

export const PRODUCT_CATEGORIES: ProductCategory[] = ['Men', 'Women', 'Unisex'];

export const FRAGRANCE_FAMILIES: CategoryOption[] = [
  { value: 'Resins', label: '🪵 Oud · Resin' },
  { value: 'Warm & Spicy', label: '🔥 Warm & Spicy' },
  { value: 'Fresh & Aqua', label: '💧 Fresh & Aqua' },
  { value: 'Floral', label: '🌷 Floral' },
  { value: 'Sweet & Gourmand', label: '🍫 Sweet & Gourmand' },
  { value: 'Woody & Vetiver', label: '🌲 Woody & Vetiver' },
];