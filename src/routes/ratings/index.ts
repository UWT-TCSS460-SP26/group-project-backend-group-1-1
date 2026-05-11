import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { createRating } from '../../controllers/ratings/createRating';
import { getRating } from '../../controllers/ratings/getRating';
import { listRatings } from '../../controllers/ratings/listRatings';
import { updateRating } from '../../controllers/ratings/updateRating';
import { deleteRating } from '../../controllers/ratings/deleteRating';
import { getUserRatedItems } from '../../controllers/ratings/getUserRatedItems';
import { getTopRated } from '../../controllers/ratings/getTopRated';
import { getMostReviewed } from '../../controllers/ratings/getMostReviewed';

const router = Router();

// Public reads
router.get('/top-rated', getTopRated);
router.get('/most-reviewed', getMostReviewed);
router.get('/media/:mediaType/:tmdbId', listRatings);
router.get('/me/items', requireAuth, getUserRatedItems);
router.get('/:id', getRating);


// Protected writes — ownership check lives inside each handler
router.post('/', requireAuth, createRating);
router.put('/:id', requireAuth, updateRating);
router.delete('/:id', requireAuth, deleteRating);


export { router as ratingsRouter };
