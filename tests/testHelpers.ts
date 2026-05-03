import jwt from 'jsonwebtoken';

/**
 * Mints a JWT directly using the JWT_SECRET for testing purposes.
 * This avoids hitting the /auth/dev-login endpoint in every test.
 */
export const generateTestToken = (payload: { sub: string; email?: string; role?: string }) => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign(
    {
      email: 'test@example.com',
      role: 'user',
      ...payload,
    },
    secret,
    { expiresIn: '1h' }
  );
};
