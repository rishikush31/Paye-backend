const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.getAllUsers);
router.get("/search", userController.searchUsers);
router.get("/:id", userController.getUserById);
router.post("/set-password", userController.setPassword);

module.exports = router;
