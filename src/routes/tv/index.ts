import { Router } from 'express';
import { getTVShow } from '../../controllers/tv/getTVShow';
import { getPopularTV } from '../../controllers/tv/getPopularTV';
import { searchTV } from '../../controllers/tv/searchTV';
import { getTVDetails } from '../../controllers/tv/getTVDetails';

const router = Router();

router.get('/popular', getPopularTV);
router.get('/search', searchTV);
router.get('/:id', getTVShow);
router.get('/:id/details', getTVDetails);

export { router as tvRouter };
