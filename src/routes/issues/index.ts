import { Router } from 'express';
import { createIssue } from '../../controllers/issues/createIssue';
import { getIssue } from '../../controllers/issues/getIssue';
import { getIssues } from '../../controllers/issues/getIssues';
import { updateIssue } from '../../controllers/issues/updateIssue';
import { deleteIssue } from '../../controllers/issues/deleteIssue';
import { requireAuth, requireRoleAtLeast } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import {
  createIssueSchema,
  updateIssueSchema,
  listIssuesSchema,
} from '../../lib/schemas/issueSchemas';
import { numericIdSchema } from '../../lib/schemas/common';

const router = Router();

// Public submission — no requireAuth.
router.post('/', validate({ body: createIssueSchema }), createIssue);

// Admin-gated read routes
router.get(
  '/',
  ...requireAuth,
  requireRoleAtLeast('Admin'),
  validate({ query: listIssuesSchema }),
  getIssues
);
router.get(
  '/:id',
  ...requireAuth,
  requireRoleAtLeast('Admin'),
  validate({ params: numericIdSchema }),
  getIssue
);
router.patch(
  '/:id',
  ...requireAuth,
  requireRoleAtLeast('Admin'),
  validate({ params: numericIdSchema, body: updateIssueSchema }),
  updateIssue
);
router.delete(
  '/:id',
  ...requireAuth,
  requireRoleAtLeast('Admin'),
  validate({ params: numericIdSchema }),
  deleteIssue
);

export { router as issuesRouter };
