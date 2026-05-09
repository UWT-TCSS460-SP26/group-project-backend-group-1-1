const jwt = require('jsonwebtoken');

class UnauthorizedError extends Error {}

module.exports = {
  expressjwt: (options) => (req, _res, next) => {
    const header = req.headers && req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      if (options?.credentialsRequired === false) {
        return next();
      }
      return next(new UnauthorizedError('No authorization token was found'));
    }

    const token = header.slice(7);
    try {
      req.auth = jwt.decode(token);
      if (!req.auth && options?.credentialsRequired !== false) {
        return next(new UnauthorizedError('Invalid token'));
      }
      next();
    } catch {
      if (options?.credentialsRequired === false) {
        return next();
      }
      next(new UnauthorizedError('Invalid token'));
    }
  },
  UnauthorizedError,
};
