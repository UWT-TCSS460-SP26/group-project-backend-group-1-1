import { Router } from 'express';
import { getHello, postHello, putHello, patchHello, deleteHello } from '../../controllers/hello';

const helloRouter = Router();

helloRouter.get('/', getHello);
helloRouter.post('/', postHello);
helloRouter.put('/', putHello);
helloRouter.patch('/', patchHello);
helloRouter.delete('/', deleteHello);

export { helloRouter };
