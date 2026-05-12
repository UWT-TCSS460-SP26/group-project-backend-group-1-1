import { Router } from 'express';
import { createIssue } from '../../controllers/issues/createIssue';
import { getIssue } from '../../controllers/issues/getIssue';
import { getIssues } from '../../controllers/issues/getIssues';
import { updateIssue } from '../../controllers/issues/updateIssue';
import { deleteIssue } from '../../controllers/issues/deleteIssue';
import { requireAuth, requireRoleAtLeast } from '../../middleware/requireAuth';

const router = Router();

// Public submission — no requireAuth.
router.post('/', createIssue);

// Admin-gated read routes
router.get('/', ...requireAuth, requireRoleAtLeast('Admin'), getIssues);
router.get('/:id', ...requireAuth, requireRoleAtLeast('Admin'), getIssue);
router.patch('/:id', ...requireAuth, requireRoleAtLeast('Admin'), updateIssue);
router.delete('/:id', requireAuth, requireRoleAtLeast('Admin'), deleteIssue);

export { router as issuesRouter };
