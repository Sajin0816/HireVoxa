export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  const statusCode = err.statusCode || err.status || (res.statusCode !== 200 ? res.statusCode : 500);

  // Prevent information disclosure: do not leak raw stack traces or internal server driver internals
  const isInternal = statusCode >= 500;
  const safeMessage = isInternal && process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred on the server'
    : (err.message || 'An unexpected error occurred on the server');

  res.status(statusCode).json({
    success: false,
    error: safeMessage
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
}
