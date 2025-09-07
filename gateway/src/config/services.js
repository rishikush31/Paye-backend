const SERVICES = {
  auth: {
    name: "Authentication Service",
    url: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
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
    url: process.env.EXPENSE_SERVICE_URL || "http://localhost:3001",
    requireAuth: true,
    timeout: 5000,
  },
  expenses: {
    name: "Expense Service",
    url: process.env.EXPENSE_SERVICE_URL || "http://localhost:3002",
    requireAuth: true,
    timeout: 5000,
  },
  notifications: {
    name: "Notification Service",
    url: process.env.BUDGET_SERVICE_URL || "http://localhost:3003",
    requireAuth: true,
    timeout: 5000,
  },
};

module.exports = SERVICES;
