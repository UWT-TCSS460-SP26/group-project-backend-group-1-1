import { Router } from 'express';
import { createIssue } from '../../controllers/issues/createIssue';
import { getIssue } from '../../controllers/issues/getIssue';
import { getIssues } from '../../controllers/issues/getIssues';
import { requireAuth, requireRoleAtLeast } from '../../middleware/requireAuth';


const router = Router();

// Public submission — no requireAuth.
router.post('/', createIssue);

// Admin-gated read routes
router.get('/', ...requireAuth, requireRoleAtLeast('Admin'), getIssues);
router.get('/:id', ...requireAuth, requireRoleAtLeast('Admin'), getIssue);

export { router as issuesRouter };
