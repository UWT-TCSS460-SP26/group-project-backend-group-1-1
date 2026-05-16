import { z } from 'zod';
import { tmdbIdSchema, mediaTypeSchema, paginationSchema } from './common';

export const createRatingSchema = z.object({
  tmdbId: tmdbIdSchema,
  mediaType: mediaTypeSchema,
  score: z.number().int().min(0).max(10),
});

export const updateRatingSchema = z.object({
  score: z.number().int().min(0).max(10),
});

export const createReviewSchema = z.object({
  tmdbId: tmdbIdSchema,
  mediaType: mediaTypeSchema,
  title: z.string().trim().optional(),
  body: z
    .string()
    .trim()
    .min(1, 'Review body cannot be empty')
    .max(5000, 'Review body cannot exceed 5000 characters'),
});

export const updateReviewSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(), // In the DB it's description, in the body of createReview it was 'body'
});

export const listRatingReviewQuerySchema = paginationSchema;

export const mediaItemParamsSchema = z.object({
  mediaType: mediaTypeSchema,
  tmdbId: tmdbIdSchema,
});
