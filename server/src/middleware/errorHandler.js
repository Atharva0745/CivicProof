/**
 * Centralized error handler
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for development
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.url} - ${err.stack || err.message}`);
  }

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    const message = `Resource not found with identifier of '${err.value}'`;
    return res.status(404).json({ success: false, message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value entered for '${field}'. Please provide a unique value.`;
    return res.status(400).json({ success: false, message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    return res.status(400).json({ success: false, message });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Authentication token expired.' });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: `File size exceeds the permitted limit of ${process.env.MAX_FILE_SIZE_MB || 10}MB.`
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
