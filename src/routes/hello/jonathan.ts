// Return a JSON greeting

import { Request, Response } from 'express';

export const jonathan = (request: Request, response: Response) => {
  response.json({ message: 'Hello, Jonathan!' });
};
