const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const gatewayRoutes = require("./routes/gateway");
const proxyRoutes = require("./routes/proxy");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 1000,
  message: { error: "Too many requests from this IP" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/*
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
*/

app.use("/", gatewayRoutes);
app.use("/", proxyRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.GATEWAY_PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV}`);
  console.log(`📋 Available services: ${Object.keys(require('./config/services')).join(', ')}`);
});

module.exports = app;