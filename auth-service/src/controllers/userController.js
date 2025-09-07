const pool = require("../db");
const bcrypt = require("bcrypt");

// Set password (only gateway-injected userId)
exports.setPassword = async (req, res) => {
  const { userId, password } = req.body; // userId comes from gateway
  if (!userId || !password) return res.status(400).json({ error: "Missing userId or password" });

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password_hash=$1 WHERE id=$2", [hash, userId]);
    res.json({ message: "Password set successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to set password" });
  }
};
