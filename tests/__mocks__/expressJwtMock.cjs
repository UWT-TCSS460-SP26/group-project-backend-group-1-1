const jwt = require('jsonwebtoken');

class UnauthorizedError extends Error {}

module.exports = {
  expressjwt: () => (req, _res, next) => {
    const header = req.headers && req.headers['authorization'];
    if (header && header.startsWith('Bearer ')) {
      const token = header.slice(7);
      // eslint-disable-next-line no-empty
      try {
        req.auth = jwt.decode(token);
      } catch {}
    }
    next();
  },
  UnauthorizedError,
};
