import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { createReview } from '../../controllers/reviews/createReview';
import { getReview } from '../../controllers/reviews/getReview';
import { listReviews } from '../../controllers/reviews/listReviews';
import { updateReview } from '../../controllers/reviews/updateReview';
import { deleteReview } from '../../controllers/reviews/deleteReview';

const router = Router();

// Public reads
router.get('/media/:mediaType/:tmdbId', listReviews);
router.get('/:id', getReview);

// Protected writes — ownership / admin check lives inside each handler
router.post('/', requireAuth, createReview);
router.put('/:id', requireAuth, updateReview);
router.delete('/:id', requireAuth, deleteReview);

export { router as reviewsRouter };
