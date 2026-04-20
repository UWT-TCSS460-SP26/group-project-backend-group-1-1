import { Router } from 'express';
import { getHello, postHello, putHello, patchHello, deleteHello } from '../../controllers/hello';
import { logger } from '../../middleware/logger';

const helloRouter = Router();

// v2 adds route-level logging middleware — same handlers as v1
helloRouter.get('/', logger, getHello);
helloRouter.post('/', logger, postHello);
helloRouter.put('/', logger, putHello);
helloRouter.patch('/', logger, patchHello);
helloRouter.delete('/', logger, deleteHello);

export { helloRouter };
