import { z } from 'zod';

export const movieParamsSchema = z.object({
  id: z.string().min(1),
});

export const movieQuerySchema = z.object({
  language: z.string().optional().default('en-US'),
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1).default(1)),
});

export const searchMovieQuerySchema = movieQuerySchema.extend({
  query: z.string().trim().min(1, 'Query parameter is required'),
});

export const tvParamsSchema = z.object({
  id: z.string().min(1),
});

export const tvQuerySchema = z.object({
  language: z.string().optional().default('en-US'),
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1).default(1)),
});

export const searchTVQuerySchema = tvQuerySchema.extend({
  query: z.string().trim().min(1, 'Query parameter is required'),
});

export const enrichedParamsSchema = z.object({
  mediaType: z.enum(['movie', 'tv']),
  id: z.string().min(1),
});
