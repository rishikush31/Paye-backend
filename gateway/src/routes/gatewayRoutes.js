const express = require('express');
const router = express.Router();
const serviceProxy = require('../utils/serviceProxy');
const authMiddleware = require('../middleware/authMiddleware');
require('dotenv').config();

// -------------------- Auth Routes (Public) --------------------
// No authentication required for login or refresh
router.use('/auth', (req, res) => {
    serviceProxy(process.env.AUTH_SERVICE_URL, req, res);
});

// -------------------- Expense Routes (Protected) --------------------
router.use('/expense', authMiddleware, (req, res) => {
    serviceProxy(process.env.EXPENSE_SERVICE_URL, req, res);
});

// -------------------- Notification Routes (Protected) --------------------
router.use('/notification', authMiddleware, (req, res) => {
    serviceProxy(process.env.NOTIFICATION_SERVICE_URL, req, res);
});

module.exports = router;
