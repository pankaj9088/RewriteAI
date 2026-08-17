export function errorHandler(err, req, res, _next) {
  // In production, log message/code without exposing full user text payloads or credentials
  const errorMessage = err.message || 'An unexpected error occurred during rewriting.';
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const statusCode = err.status || err.statusCode || 500;

  if (process.env.NODE_ENV !== 'production') {
    console.error('[RewriteAI Server Error]', err);
  } else {
    console.error(`[RewriteAI Server Error] Status: ${statusCode}, Code: ${errorCode}, Message: ${errorMessage}`);
  }

  res.status(statusCode).json({
    error: errorMessage,
    code: errorCode,
    timestamp: new Date().toISOString(),
  });
}

