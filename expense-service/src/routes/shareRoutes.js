const express = require("express");
const router = express.Router();
const shareController = require("../controllers/shareController");

router.get("/", shareController.listShares);

router.patch("/:id", shareController.updateShareStatus);

router.get("/toPay", shareController.moneyToPay);

router.get("/toReceive", shareController.moneyToReceive);

module.exports = router;