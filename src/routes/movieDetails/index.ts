import { Router } from 'express';
import { getEnrichedMovieOrShow } from '../../controllers/movieDetails/getEnrichedMovieOrShow';

const router = Router();
router.get('/:mediaType/:id/enriched', getEnrichedMovieOrShow);
export { router as movieDetailsRouter };
