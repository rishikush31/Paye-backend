const SERVICES = {
  auth: {
    name: "Authentication Service",
    url: process.env.AUTH_SERVICE_URL || "http://auth:3001",
    requireAuth: false,
    timeout: 10000,
    publicRoutes: [
      "/signup",
      "/login",
      "/refresh",
      "/google",
      "/google/callback",
      "/google/failed",
      "/logout",
    ],
  },
  user: {
    name: "User Service",
    url: process.env.AUTH_SERVICE_URL || "http://auth:3001",
    requireAuth: true,
    timeout: 5000,
  },
  expenses: {
    name: "Expense Service",
    url: process.env.EXPENSE_SERVICE_URL || "http://expense:3002",
    requireAuth: true,
    timeout: 5000,
  },
  shares: {
    name: "Share Service",
    url: process.env.EXPENSE_SERVICE_URL || "http://expense:3002",
    requireAuth: true,
    timeout: 5000,
  },
  notifications: {
    name: "Notification Service",
    url: process.env.NOTIFICATION_SERVICE_URL || "http://notification:3003",
    requireAuth: true,
    timeout: 5000,
  },
};

module.exports = SERVICES;
