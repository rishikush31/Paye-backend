const pool = require("../db");
const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "name, email and password required" });

  try {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Invalid email format" });

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (existing.rows.length)
      return res.status(400).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);

    const r = await pool.query(
      "INSERT INTO users (name, email, password_hash, google_id) VALUES ($1, $2, $3, NULL) RETURNING id, email",
      [name, email, hash]
    );

    const user = result.rows[0];
    const payload = { id: user.id, email: user.email };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });

  try {
    const r = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    if (!r.rows.length)
      return res.status(400).json({ error: "Invalid credentials" });

    const user = r.rows[0];
    if (!user.password_hash)
      return res.status(400).json({
        error: "Account exists via Google. Use gateway flow to set password.",
      });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const payload = { id: r.rows[0].id, email: r.rows[0].email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    res.json({
      id: r.rows[0].id,
      email: r.rows[0].email,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};

exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Missing token" });

  try {
    const publicKeyPath = path.join(__dirname, "keys", "public.pem");
    const PUBLIC_KEY = fs.readFileSync(publicKeyPath, "utf8");
    const payload = jwt.verify(refreshToken, PUBLIC_KEY, {
      algorithms: ["RS256"],
    });
    const accessToken = generateAccessToken({
      id: payload.id,
      email: payload.email,
    });
    res.json({ accessToken });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Refresh token expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    res.status(401).json({ error: "Token verification failed" });
  }
};

exports.googleAuthHandler = (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    const payload = {
      id: user.id,
      email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Google auth handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
