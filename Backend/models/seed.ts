import 'dotenv/config';
import { sql } from 'drizzle-orm';
import db from '../config/db.js';
import { notes, perfumebases } from './schema.js';

const count = async () => {
  const { rows } = await db.execute(sql`select (select count(*) from notes) + (select count(*) from perfumebases) as total`);
  return Number(rows[0].total);
};

try {
  const total = await count();
  if (total > 0) {
    console.log(`Palette already seeded (${total} rows).`);
    process.exit(0);
  }

  const defaultNotes = [
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
  await db.insert(notes).values(defaultNotes);

  const defaultBases = [
    { name: 'Alcohol Base (EDT)', code: 'alcohol-EDT', description: 'Refreshing, lighter wear — perfect for daytime', extraPrice: '0' },
    { name: 'Alcohol Base (EDP)', code: 'alcohol-EDP', description: 'The classic: balanced, long-lasting elegance', extraPrice: '200' },
    { name: 'Alcohol Base (Parfum)', code: 'alcohol-extrait', description: 'Highest concentration: intense, all-day sillage', extraPrice: '500' },
    { name: 'Oil Base (Roll-on)', code: 'oil-roller', description: 'Skin-friendly, travel-perfect, alcohol-free', extraPrice: '150' },
    { name: 'Oil Base (Pure)', code: 'oil-pure', description: 'Alcohol-free intensive oil; beautiful on skin', extraPrice: '250' },
  ];
  await db.insert(perfumebases).values(defaultBases);

  console.log('Palette seeded ✓');
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
