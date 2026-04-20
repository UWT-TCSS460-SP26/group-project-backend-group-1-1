import { Router } from 'express';
import { v1Routes } from './v1';
import { v2Routes } from './v2';
import { protectedRoutes } from './protected';

const routes = Router();

routes.use('/v1', v1Routes);
routes.use('/v2', v2Routes);
routes.use(protectedRoutes);

export { routes };
