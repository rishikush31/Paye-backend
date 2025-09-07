const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Only gateway-injected userId is allowed
router.post("/set-password", userController.setPassword);

module.exports = router;
