const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const PUBLIC_KEY = fs.readFileSync(
  path.join(__dirname, "../keys/public.pem"),
  "utf8"
);

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:4000";

async function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(accessToken, PUBLIC_KEY, { algorithms: ["RS256"] });
    req.user = decoded; // attach user info
    return next();      // access token valid → continue

  } catch (err) {
    return res.status(403).json({ error: "Token verification failed", details: err.message });
  }
}


module.exports = authMiddleware;
