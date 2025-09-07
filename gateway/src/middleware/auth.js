const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

let PUBLIC_KEY;
try {
  const publicKeyPath =
    process.env.PUBLIC_KEY_PATH || path.join(__dirname, "../keys/public.pem");
  PUBLIC_KEY = fs.readFileSync(publicKeyPath, "utf8");
  console.log("✅ Public key loaded successfully");
} catch (error) {
  console.error("❌ Failed to load public key:", error.message);
  process.exit(1);
}

const validateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access token required",
        code: "MISSING_TOKEN",
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ["RS256"],
    });

    if (!decoded.id || !decoded.email) {
      return res.status(401).json({
        error: "Invalid token payload",
        code: "INVALID_PAYLOAD",
      });
    }

    req.headers["x-user-id"] = decoded.id.toString();
    req.headers["x-user-email"] = decoded.email;
    req.headers["x-user-verified"] = "true";
    req.headers["x-token-issued-at"] = decoded.iat?.toString();
    req.headers["x-token-expires-at"] = decoded.exp?.toString();
    req.headers["x-gateway-timestamp"] = new Date().toISOString();

    req.user = {
      id: decoded.id,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (error) {
    console.error("Token validation error:", error.message);

    const errorMap = {
      TokenExpiredError: {
        status: 401,
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      },
      JsonWebTokenError: {
        status: 401,
        message: "Invalid token",
        code: "INVALID_TOKEN",
      },
      NotBeforeError: {
        status: 401,
        message: "Token not active yet",
        code: "TOKEN_NOT_ACTIVE",
      },
    };

    const errorInfo = errorMap[error.name] || {
      status: 401,
      message: "Authentication failed",
      code: "AUTH_FAILED",
    };

    return res.status(errorInfo.status).json({
      error: errorInfo.message,
      code: errorInfo.code,
    });
  }
};

module.exports = {
  validateToken,
};
