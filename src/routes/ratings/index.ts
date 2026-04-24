import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { createRating } from '../../controllers/ratings/createRating';
import { getRating } from '../../controllers/ratings/getRating';
import { listRatings } from '../../controllers/ratings/listRatings';
import { updateRating } from '../../controllers/ratings/updateRating';
import { deleteRating } from '../../controllers/ratings/deleteRating';

const router = Router();

// Public reads
router.get('/media/:mediaType/:tmdbId', listRatings);
router.get('/:id', getRating);

// Protected writes — ownership check lives inside each handler
router.post('/', requireAuth, createRating);
router.put('/:id', requireAuth, updateRating);
router.delete('/:id', requireAuth, deleteRating);

export { router as ratingsRouter };
