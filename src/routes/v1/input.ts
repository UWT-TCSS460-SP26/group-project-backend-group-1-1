import { Router } from 'express';
import { searchByQuery, getUserById, createUser, echoHeaders } from '../../controllers/input';

const inputRouter = Router();

inputRouter.get('/search', searchByQuery);
inputRouter.get('/users/:id', getUserById);
inputRouter.post('/users', createUser);
inputRouter.get('/headers', echoHeaders);

export { inputRouter };
