import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { createReview } from '../../controllers/reviews/createReview';
import { getReview } from '../../controllers/reviews/getReview';
import { listReviews } from '../../controllers/reviews/listReviews';
import { updateReview } from '../../controllers/reviews/updateReview';
import { deleteReview } from '../../controllers/reviews/deleteReview';
import { getMyReviews } from '../../controllers/reviews/getMyReviews';

const router = Router();

// Public reads
router.get('/media/:mediaType/:tmdbId', listReviews);

// Authenticated self route — must be before /:id
router.get('/me', requireAuth, getMyReviews);

router.get('/:id', getReview);

// Protected writes
router.post('/', requireAuth, createReview);
router.put('/:id', requireAuth, updateReview);
router.delete('/:id', requireAuth, deleteReview);

export { router as reviewsRouter };
