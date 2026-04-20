import { Router } from 'express';
import { helloRouter } from './hello';
import { inputRouter } from './input';

const v1Routes = Router();

v1Routes.use('/hello', helloRouter);
v1Routes.use('/input', inputRouter);

export { v1Routes };
