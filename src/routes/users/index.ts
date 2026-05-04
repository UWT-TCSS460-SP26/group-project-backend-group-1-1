import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { addSubjectId } from '../../controllers/users/addSubjectId';

const router = Router();

router.post('/add-subject-id', requireAuth, addSubjectId);

export { router as usersRouter };