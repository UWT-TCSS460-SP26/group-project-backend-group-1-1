import { z } from 'zod';

export const tmdbIdSchema = z.string().min(1);

export const mediaTypeSchema = z.enum(['movie', 'tv']);

export const paginationSchema = z.object({
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1).default(1)),
  limit: z.preprocess(
    (val) => Math.min(Number(val) || 10, 50),
    z.number().min(1).max(50).default(10)
  ),
});

export const numericIdSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number().int().positive()),
});
