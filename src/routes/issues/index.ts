import { Router } from 'express';
import { createIssue } from '../../controllers/issues/createIssue';

const router = Router();

// Public submission — no requireAuth.
router.post('/', createIssue);

export { router as issuesRouter };
