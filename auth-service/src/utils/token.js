const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Load private key (RS256)
const PRIVATE_KEY = fs.readFileSync(
  path.join(__dirname, '../keys/private.pem'),
  'utf8'
);

// Token expiry times
const ACCESS_TOKEN_EXPIRY = '15m'; // access token valid for 15 minutes
/**
 * Generate access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

module.exports = { generateAccessToken };
