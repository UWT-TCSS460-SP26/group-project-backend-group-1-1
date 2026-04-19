import { Router } from 'express';
import { helloRouter } from './hello';
import { inputRouter } from './input';
import { movieIDRouter } from '../movieID';
const v2Routes = Router();

v2Routes.use('/hello', helloRouter);
v2Routes.use('/input', inputRouter);
v2Routes.use('/', movieIDRouter);

export { v2Routes };
