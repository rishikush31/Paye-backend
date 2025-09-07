const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.get("/search", userController.searchUsers);
router.post("/set-password", userController.setPassword);

module.exports = router;
