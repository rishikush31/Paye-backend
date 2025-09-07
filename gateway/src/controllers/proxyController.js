const { createProxyMiddleware } = require("http-proxy-middleware");
const SERVICES = require("../config/services");

function createProxy(serviceName) {
  const serviceConfig = SERVICES[serviceName];

  if (!serviceConfig) {
    return (req, res) => {
      res.status(404).json({
        error: "Service not found",
        serviceName,
        availableServices: Object.keys(SERVICES),
      });
    };
  }

  const proxyOptions = {
    target: serviceConfig.url,
    changeOrigin: true,
    timeout: serviceConfig.timeout || 5000,
    pathRewrite: {
      [`^/${serviceName}`]: "",
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${serviceName}:`, {
        message: err.message,
        code: err.code,
        url: req.url,
        timestamp: new Date().toISOString(),
      });

      if (!res.headersSent) {
        res.status(502).json({
          error: "Bad gateway",
          message: `Could not connect to ${serviceName}`,
          code: "BAD_GATEWAY",
        });
      }
    },
  };

  return createProxyMiddleware(proxyOptions);
}

module.exports = { createProxy };
