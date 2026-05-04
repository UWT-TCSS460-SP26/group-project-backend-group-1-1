const jwt = require('jsonwebtoken');

class UnauthorizedError extends Error {}

module.exports = {
  expressjwt: () => (req, _res, next) => {
    const header = req.headers && req.headers['authorization'];
    if (header && header.startsWith('Bearer ')) {
      const token = header.slice(7);
      try {
        req.auth = jwt.decode(token);
      } catch {
        req.auth = null;
      }
    }
    next();
  },
  UnauthorizedError,
};
