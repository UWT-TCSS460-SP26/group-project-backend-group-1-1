import { Router } from 'express';
import { getMovie } from '../../controllers/movies/getMovie';
import { getPopularMovies } from '../../controllers/movies/getPopularMovies';
import { searchMovies } from '../../controllers/movies/searchMovies';

const router = Router();

router.get('/popular', getPopularMovies);
router.get('/search', searchMovies);
router.get('/:id', getMovie);

export { router as moviesRouter };
