import { z } from 'zod';
import { paginationSchema } from './common';

export const createIssueSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  description: z.string().trim().min(1, 'description is required'),
  stepsToReproduce: z.string().trim().optional().nullable(),
  reporterEmail: z.string().trim().email().or(z.literal('')).optional().nullable(),
});

export const updateIssueSchema = z
  .object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX', 'DUPLICATE']).optional(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    stepsToReproduce: z.string().trim().optional().nullable(),
    reporterEmail: z.string().trim().email().or(z.literal('')).optional().nullable(),
  })
  .strict();

export const listIssuesSchema = paginationSchema.extend({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX', 'DUPLICATE']).optional(),
});
