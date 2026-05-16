import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory to validate request parts against Zod schemas.
 * Replaces the validated part (body, query, or params) with the parsed/transformed version.
 */
export const validate =
  (schemas: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        const validatedQuery = await schemas.query.parseAsync(req.query);
        Object.assign(req.query, validatedQuery);
      }
      if (schemas.params) {
        const validatedParams = await schemas.params.parseAsync(req.params);
        Object.assign(req.params, validatedParams);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          errors: error.flatten().fieldErrors,
        });
      }
      next(error);
    }
  };
