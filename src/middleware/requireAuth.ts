import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";
import type { Request, Response, NextFunction } from "express";

export const requireAuth = expressjwt({
  secret: jwksRsa.expressJwtSecret({
  jwksUri: `${process.env.AUTH_ISSUER}/.well-known/jwks.json`,
}) as unknown as Parameters<typeof expressjwt>[0]["secret"],
  audience: process.env.API_AUDIENCE,
  issuer: process.env.AUTH_ISSUER,
  algorithms: ["RS256"],
});
type AuthRequest = Request & {
  auth?: {
    role?: string;
  };
};

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (req.auth.role !== role) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
};