import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { createReview } from '../../controllers/reviews/createReview';
import { getReview } from '../../controllers/reviews/getReview';
import { listReviews } from '../../controllers/reviews/listReviews';
import { updateReview } from '../../controllers/reviews/updateReview';
import { deleteReview } from '../../controllers/reviews/deleteReview';
import { getMyReviews } from '../../controllers/reviews/getMyReviews';
import { validate } from '../../middleware/validate';
import { numericIdSchema } from '../../lib/schemas/common';
import {
  createReviewSchema,
  updateReviewSchema,
  listRatingReviewQuerySchema,
  mediaItemParamsSchema,
} from '../../lib/schemas/ratingReviewSchemas';

const router = Router();

// Public reads
router.get(
  '/media/:mediaType/:tmdbId',
  validate({ params: mediaItemParamsSchema, query: listRatingReviewQuerySchema }),
  listReviews
);

// Authenticated self route — must be before /:id
router.get('/me', requireAuth, getMyReviews);

router.get('/:id', validate({ params: numericIdSchema }), getReview);

// Protected writes
router.post('/', requireAuth, validate({ body: createReviewSchema }), createReview);
router.put(
  '/:id',
  requireAuth,
  validate({ params: numericIdSchema, body: updateReviewSchema }),
  updateReview
);
router.delete('/:id', requireAuth, validate({ params: numericIdSchema }), deleteReview);

export { router as reviewsRouter };
