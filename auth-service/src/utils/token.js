const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const PRIVATE_KEY = fs.readFileSync(
  path.join(__dirname, "../keys/private.pem"),
  "utf8"
);

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

function generateAccessToken(payload) {
  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: ACCESS_TOKEN_EXPIRY,
});
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

module.exports = { generateAccessToken, generateRefreshToken };
