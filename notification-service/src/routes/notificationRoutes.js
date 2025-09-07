const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// Get all notifications for logged-in user (paginated optional)
router.get("/", notificationController.getMyNotifications);

// Delete a notification (must belong to user)
router.delete("/:id", notificationController.deleteNotification);

router.post("/createNotification", notificationController.createNotification);

module.exports = router;
