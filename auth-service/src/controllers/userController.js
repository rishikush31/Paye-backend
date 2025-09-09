const pool = require("../db");
const bcrypt = require("bcrypt");

exports.getAllUsers = async (req, res) => {

  try {
    const r = await pool.query("SELECT id, name, email FROM users");
    res.json(r.rows);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
  
}

exports.getUserById = async (req, res) => {
  const userId = req.params.id;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const r = await pool.query("SELECT id, name, email FROM users WHERE id=$1", [userId]);
    if (!r.rows.length) return res.status(404).json({ error: "User not found" });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
}


exports.searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: "Missing or empty search query" });
  }

  try {
    const r = await pool.query(
      "SELECT id, name, email FROM users WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY name",
      [`%${q.trim()}%`]
    );
    res.json(r.rows);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: "Search failed" });
  }
}

exports.setPassword = async (req, res) => {

  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(400).json({ error: "Missing userId in headers" });
  const { password } = req.body;
  if (!userId || !password) return res.status(400).json({ error: "Missing userId or password" });

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password_hash=$1 WHERE id=$2", [hash, userId]);
    res.json({ message: "Password set successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to set password" });
  }
};
