import { Router } from 'express';
import { searchByQuery, getUserById, createUser, echoHeaders } from '../../controllers/input';
import {
  validateSearchQuery,
  validateNumericId,
  validateUserBody,
} from '../../middleware/validation';

const inputRouter = Router();

// v2 adds validation middleware — same controllers as v1
inputRouter.get('/search', validateSearchQuery, searchByQuery);
inputRouter.get('/users/:id', validateNumericId, getUserById);
inputRouter.post('/users', validateUserBody, createUser);
inputRouter.get('/headers', echoHeaders);

export { inputRouter };
