const express = require("express");
const router = express.Router();
const proxyController = require("../controllers/proxyController");
const { validateToken } = require("../middleware/auth");
const SERVICES = require("../config/services");

Object.entries(SERVICES).forEach(([serviceName, serviceConfig]) => {

  if (serviceConfig.requireAuth) {
    router.use(`/${serviceName}/*`, validateToken, proxyController.createProxy(serviceName));
    router.use(`/${serviceName}`, validateToken, proxyController.createProxy(serviceName));
  } else {
    router.use(`/${serviceName}/*`, proxyController.createProxy(serviceName));
    router.use(`/${serviceName}`, proxyController.createProxy(serviceName));
  }
});

module.exports = router;