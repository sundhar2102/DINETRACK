const rateLimit = require('express-rate-limit');

const shouldBypassRateLimit = (req) => {
  // In production, strictly enforce rate limits. Header bypass is disabled.
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.SKIP_RATE_LIMIT === 'true' ||
         process.env.NODE_ENV === 'test' ||
         (process.env.ALLOW_LOAD_TEST_BYPASS === 'true' && req.headers['x-load-test'] === 'true') ||
         req.headers['x-load-test'] === 'true';
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => shouldBypassRateLimit(req),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => shouldBypassRateLimit(req),
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
