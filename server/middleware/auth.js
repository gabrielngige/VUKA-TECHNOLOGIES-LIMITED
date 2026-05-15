import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token
 * Attaches decoded user data to req.user
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vuka_secret');
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Middleware to check if user is admin
 * Must be used after verifyToken
 */
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

/**
 * Middleware to validate request body
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }

    req.validatedBody = value;
    next();
  };
};

/**
 * Wrapper to catch async errors in route handlers
 * Catches both thrown errors and promise rejections
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Error handling middleware (must be registered last)
 */
export const errorHandler = (err, req, res, next) => {
  // Log complete error details
  const timestamp = new Date().toISOString();
  const requestInfo = {
    timestamp,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
  };

  console.error('━━━━ ERROR OCCURRED ━━━━');
  console.error('Request:', requestInfo);
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  if (err.response?.data) {
    console.error('External API Error:', err.response.data);
  }
  console.error('━━━━━━━━━━━━━━━━━━━━━━━');

  const status = err.status || err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(status).json({
    message: err.message || 'Internal server error',
    timestamp,
    ...(isDevelopment && { error: err.stack, details: err }),
  });
};

export default {
  verifyToken,
  requireAdmin,
  validateRequest,
  asyncHandler,
  errorHandler,
};
