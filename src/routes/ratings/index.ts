import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { createRating } from '../../controllers/ratings/createRating';
import { getRating } from '../../controllers/ratings/getRating';
import { listRatings } from '../../controllers/ratings/listRatings';
import { updateRating } from '../../controllers/ratings/updateRating';
import { deleteRating } from '../../controllers/ratings/deleteRating';
import { getMyRatings } from '../../controllers/ratings/getMyRatings';
import { getUserRatedItems } from '../../controllers/ratings/getUserRatedItems';
import { getTopRated } from '../../controllers/ratings/getTopRated';
import { getMostReviewed } from '../../controllers/ratings/getMostReviewed';
import { validate } from '../../middleware/validate';
import { numericIdSchema } from '../../lib/schemas/common';
import {
  createRatingSchema,
  updateRatingSchema,
  listRatingReviewQuerySchema,
  mediaItemParamsSchema,
} from '../../lib/schemas/ratingReviewSchemas';

const router = Router();

// Public reads
router.get('/top-rated', getTopRated);
router.get('/most-reviewed', getMostReviewed);
router.get(
  '/media/:mediaType/:tmdbId',
  validate({ params: mediaItemParamsSchema, query: listRatingReviewQuerySchema }),
  listRatings
);

// Authenticated self route — must be before /:id
router.get('/me', requireAuth, getMyRatings);

router.get('/me/items', requireAuth, getUserRatedItems);
router.get('/:id', validate({ params: numericIdSchema }), getRating);

// Protected writes
router.post('/', requireAuth, validate({ body: createRatingSchema }), createRating);
router.put(
  '/:id',
  requireAuth,
  validate({ params: numericIdSchema, body: updateRatingSchema }),
  updateRating
);
router.delete('/:id', requireAuth, validate({ params: numericIdSchema }), deleteRating);

export { router as ratingsRouter };
