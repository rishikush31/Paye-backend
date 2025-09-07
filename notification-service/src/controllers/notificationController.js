const pool = require("../db");

// GET /notifications?user=me → list my notifications (paginated)
exports.getMyNotifications = async (req, res) => {
  try {

    // insert in req
    const userId = req.headers['x-user-id'];
    const { limit = 10, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
        
    const userId = req.headers['x-user-id'];
    const notifId = req.params.id;
    
    // Ensure notification belongs to the user
    const check = await pool.query(
      `SELECT id FROM notifications WHERE id = $1 AND user_id = $2`,
      [notifId, userId]
    );

    if (check.rowCount === 0) {
      return res.status(403).json({ error: "Not authorized to delete this notification" });
    }

    // Delete notification
    await pool.query(`DELETE FROM notifications WHERE id = $1`, [notifId]);

    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

// Create a notification
exports.createNotification = async (req, res) => {
  try {
    const { userId, shareId } = req.body;

    if (!userId || !shareId) {
      return res.status(400).json({ error: "userId and shareId are required" });
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, expense_share_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, shareId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
};
