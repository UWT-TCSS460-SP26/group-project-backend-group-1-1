import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";

export const requireAuth = expressjwt({
  secret: jwksRsa.expressJwtSecret({
  jwksUri: `${process.env.AUTH_ISSUER}/.well-known/jwks.json`,
}) as unknown as Parameters<typeof expressjwt>[0]["secret"],
  audience: process.env.API_AUDIENCE,
  issuer: process.env.AUTH_ISSUER,
  algorithms: ["RS256"],
});