import 'dotenv/config';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 4000,

  DATABASE_URL:
    process.env.DATABASE_URL ||
    `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'sugandhit_perfume'}`,

  JWT_SECRET: process.env.JWT_SECRET || 'sugandhit_jwt_secret',

  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET_KEY: process.env.CLOUDINARY_API_SECRET_KEY || '',
} as const;
