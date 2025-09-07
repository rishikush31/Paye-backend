const errorHandler = (err, req, res, next) => {
  console.error('Gateway Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
  } else if (err.code === 'ECONNREFUSED') {
    status = 503;
    message = 'Service unavailable';
    code = 'SERVICE_UNAVAILABLE';
  } else if (err.code === 'ETIMEDOUT') {
    status = 504;
    message = 'Gateway timeout';
    code = 'GATEWAY_TIMEOUT';
  }

  res.status(status).json({
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.url,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const notFoundHandler = (req, res) => {
  const availableServices = Object.keys(require('../config/services'));
  
  res.status(404).json({
    error: "Route not found",
    code: "ROUTE_NOT_FOUND",
    path: req.url,
    method: req.method,
    availableServices,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
