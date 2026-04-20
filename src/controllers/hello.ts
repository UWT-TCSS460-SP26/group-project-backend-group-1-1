import { Request, Response } from 'express';

export const getHello = (_request: Request, response: Response) => {
  response.json({ message: 'Hello, you sent a GET request' });
};

export const postHello = (_request: Request, response: Response) => {
  response.status(201).json({ message: 'Hello, you sent a POST request' });
};

export const putHello = (_request: Request, response: Response) => {
  response.json({ message: 'Hello, you sent a PUT request' });
};

export const patchHello = (_request: Request, response: Response) => {
  response.json({ message: 'Hello, you sent a PATCH request' });
};

export const deleteHello = (_request: Request, response: Response) => {
  response.json({ message: 'Hello, you sent a DELETE request' });
};
