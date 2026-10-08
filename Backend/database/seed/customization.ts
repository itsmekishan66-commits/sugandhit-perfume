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
    image: 'https://images.unsplash.com/photo-1720423514789-15a33e59fc81?auto=format&fit=crop&w=600&h=800&q=80',
    extraPrice: '0',
  },
  {
    name: 'Matte Black',
    code: 'matte-black',
    description: 'Sleek, modern and understated',
    image: 'https://media.istockphoto.com/id/2288540930/photo/elegant-matte-black-perfume-spray-bottle-with-gold-nozzle-and-cap-on-a-dark-wooden-background.jpg?s=170667a&w=0&k=20&c=HWS8pJZ4wJBOazL278ppF4K9J9YsSSRN-AHoL8NlAms=',
    extraPrice: '200',
  },
  {
    name: 'Frosted Crystal',
    code: 'frosted',
    description: 'Soft-touch frosted glass with a subtle glow',
    image: 'https://images.unsplash.com/photo-1653072000505-9ff8c46fcc52?auto=format&fit=crop&w=600&h=800&q=80',
    extraPrice: '150',
  },
  {
    name: 'Vintage Amber',
    code: 'vintage-amber',
    description: 'Apothecary-inspired warm amber glass',
    image: 'https://images.unsplash.com/photo-1621275155732-2bff82c64fd2?auto=format&fit=crop&w=600&h=800&q=80',
    extraPrice: '150',
  },
  {
    name: 'Faceted Crystal',
    code: 'faceted',
    description: 'Cut-crystal gem bottle, gift-worthy',
    image: 'https://images.unsplash.com/photo-1752214873218-a26640a68fed?auto=format&fit=crop&w=600&h=800&q=80',
    extraPrice: '200',
  },
];

export const defaultCustomizationSettings = {
  maxNotesPerLayer: 3,
  deliveryFee: '100',
};
