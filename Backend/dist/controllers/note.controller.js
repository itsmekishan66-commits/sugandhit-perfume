import { seedPaletteStock, getPaletteStock } from '../services/note.service.js';
export const seed = async (_req, res) => {
    try {
        await seedPaletteStock();
        res.json({ success: true, message: 'Palette seeded' });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
export const getPalette = async (_req, res) => {
    try {
        const palette = await getPaletteStock();
        res.json({ success: true, palette });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
