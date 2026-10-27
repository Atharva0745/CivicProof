const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'civicproof_super_secret_jwt_key_mumbai_2026_change_in_production';

/**
 * Extracts Bearer token from Authorization header or cookie
 */
const extractToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
};

/**
 * Protect routes - Require valid JWT
 */
const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please authenticate to access this resource.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

/**
 * Optional authentication - attaches req.user if token is present, does not reject if absent
 */
const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    req.user = user || null;
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = { protect, optionalAuth, extractToken };
