/**
 * Default rows for the frontend /customize page. This file is data only — the DDL and the
 * inserts that write it live in `customization.seed.ts`. Read back per table by
 * `modules/notes/notes.repository.ts`.
 */

export const defaultNotes = [
  { name: 'Bergamot', layer: 'top', icon: '🍋', color: '#F5C542', description: 'Bright, sparkling citrus' },
  { name: 'Lemon', layer: 'top', icon: '🍋', color: '#FBE26A', description: 'Crisp and zesty' },
  { name: 'Mandarin', layer: 'top', icon: '🍊', color: '#F39C4B', description: 'Sweet juicy orange' },
  { name: 'Pink Pepper', layer: 'top', icon: '🌶️', color: '#E5533D', description: 'Warm, spicy sparkle' },
  { name: 'Lavender', layer: 'top', icon: '💜', color: '#A78BFA', description: 'Soothing floral herb' },
  { name: 'White Tea', layer: 'top', icon: '🫖', color: '#CDD6C9', description: 'Light, clean, airy' },
  { name: 'Neroli', layer: 'top', icon: '🍊', color: '#FFE0B2', description: 'Bitter orange blossom' },
  { name: 'Rose', layer: 'heart', icon: '🌹', color: '#E14D7B', description: 'Romantic, velvety petals' },
  { name: 'Jasmine', layer: 'heart', icon: '🌼', color: '#F4E6C2', description: 'Intoxicating white flower' },
  { name: 'Ylang Ylang', layer: 'heart', icon: '🌸', color: '#F6C453', description: 'Exotic, creamy bloom' },
  { name: 'Peony', layer: 'heart', icon: '🌺', color: '#F9A8C8', description: 'Delicate, fresh floral' },
  { name: 'Geranium', layer: 'heart', icon: '🌿', color: '#7AA6C7', description: 'Green, rosy herb' },
  { name: 'Cinnamon', layer: 'heart', icon: '🟤', color: '#B5472B', description: 'Warm baking spice' },
  { name: 'Saffron', layer: 'heart', icon: '🧡', color: '#E07A2F', description: 'Precious, leathery spice' },
  { name: 'Sandalwood', layer: 'base', icon: '🪵', color: '#8B5A2B', description: 'Creamy, woody depth' },
  { name: 'Vanilla', layer: 'base', icon: '🍦', color: '#E8C17A', description: 'Sweet, comforting' },
  { name: 'Musk', layer: 'base', icon: '🤍', color: '#D6CFC4', description: 'Warm, skin-soft' },
  { name: 'Amber', layer: 'base', icon: '🔶', color: '#D97706', description: 'Resinous, golden warmth' },
  { name: 'Cedarwood', layer: 'base', icon: '🌲', color: '#4A5D4E', description: 'Dry, aromatic wood' },
  { name: 'Patchouli', layer: 'base', icon: '🍂', color: '#6B4E3D', description: 'Earthy, mysterious' },
  { name: 'Tonka Bean', layer: 'base', icon: '🫘', color: '#7A5C3A', description: 'Warm, almond-vanilla' },
  { name: 'Oud', layer: 'base', icon: '🪵', color: '#3E2C23', description: 'Rich, smoky agarwood' },
];

export const defaultBases = [
  { name: 'Alcohol Base (EDT)', code: 'alcohol-EDT', description: 'Refreshing, lighter wear — perfect for daytime', extraPrice: '0' },
  { name: 'Alcohol Base (EDP)', code: 'alcohol-EDP', description: 'The classic: balanced, long-lasting elegance', extraPrice: '200' },
  { name: 'Alcohol Base (Parfum)', code: 'alcohol-extrait', description: 'Highest concentration: intense, all-day sillage', extraPrice: '500' },
  { name: 'Oil Base (Roll-on)', code: 'oil-roller', description: 'Skin-friendly, travel-perfect, alcohol-free', extraPrice: '150' },
  { name: 'Oil Base (Pure)', code: 'oil-pure', description: 'Alcohol-free intensive oil; beautiful on skin', extraPrice: '250' },
];

export const defaultSizes = [
  { label: '30 ml', ml: '30ml', price: '399', description: 'Samples & travel' },
  { label: '50 ml', ml: '50ml', price: '699', description: 'Most chosen' },
  { label: '100 ml', ml: '100ml', price: '999', description: 'For the committed' },
];

/**
 * Bottle types shown on the /customize page. Images are plain, unbranded bottles so the
 * blank glass reads as "your perfume goes here" instead of a competitor's product shot.
 */
export const defaultBottleTypes = [
  {
    name: 'Classic Clear Glass',
    code: 'classic',
    description: 'Timeless clear glass with a gold cap',
    image: 'https://unsplash.com/photos/a-clear-glass-bottle-with-a-silver-top-MDMrNFnyFQk?w=800&q=80',
    extraPrice: '0',
  },
  {
    name: 'Matte Black',
    code: 'matte-black',
    description: 'Sleek, modern and understated',
    image: 'https://www.istockphoto.com/photo/elegant-matte-black-perfume-spray-bottle-with-gold-nozzle-and-cap-on-a-dark-wooden-gm2288540930-700383584?utm_source=unsplash&utm_medium=affiliate&utm_campaign=srp_photos_bottom&utm_content=https%3A%2F%2Funsplash.com%2Fs%2Fphotos%2Fperfume-empty-bottle-matte-black&utm_term=perfume+empty+bottle+matte+black%3A%3A%3A%3A5eb97d4b-6ed7-467e-b25e-1bd49c1b1d9b?w=800&q=80',
    extraPrice: '200',
  },
  {
    name: 'Frosted Crystal',
    code: 'frosted',
    description: 'Soft-touch frosted glass with a subtle glow',
    image: 'https://unsplash.com/photos/a-bottle-of-perfume-sitting-on-top-of-a-table-0GwwKISlBpg?w=800&q=80',
    extraPrice: '150',
  },
  {
    name: 'Vintage Amber',
    code: 'vintage-amber',
    description: 'Apothecary-inspired warm amber glass',
    image: 'https://unsplash.com/photos/clear-glass-perfume-bottle-on-brown-textile-D1P-vxlB_K0?w=800&q=80',
    extraPrice: '150',
  },
  {
    name: 'Faceted Crystal',
    code: 'faceted',
    description: 'Cut-crystal gem bottle, gift-worthy',
    image: 'https://unsplash.com/photos/a-perfume-bottle-is-reflected-in-a-mirror-8b5DWgUYOjU?w=800&q=80',
    extraPrice: '200',
  },
];

export const defaultCustomizationSettings = {
  maxNotesPerLayer: 3,
  deliveryFee: '100',
};
