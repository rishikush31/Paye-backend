const pool = require("../db");
const bcrypt = require("bcrypt");

exports.createExpense = async (req, res) => {

    try {
        const ownerId = req.headers['x-user-id'];
        const { title, currency, totalAmount, note, shares } = req.body;

        // --- Validation ---
        if (!title || !currency || !totalAmount || !Array.isArray(shares)) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (totalAmount <= 0) {
            return res.status(400).json({ error: "totalAmount must be > 0" });
        }

        // Normalize shares → fill missing owedToUserId
        const normalizedShares = shares.map((s) => ({
            participantId: s.participantId,
            owedToUserId: s.owedToUserId || ownerId,
            amount: Number(s.amount || 0),
        }));

        // Check sum of shares
        const totalShares = normalizedShares.reduce((sum, s) => sum + s.amount, 0);
        if (totalShares !== Number(totalAmount)) {
            return res
                .status(400)
                .json({ error: "Sum of shares must equal totalAmount" });
        }

        // --- Insert expense ---
        const expenseRes = await pool.query(
            `INSERT INTO expenses (id, owner_id, title, currency, total_amount, note) 
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
       RETURNING *`,
            [ownerId, title, currency, totalAmount, note || null]
        );
        const expense = expenseRes.rows[0];

        // --- Insert shares (one by one loop) ---
        for (const s of normalizedShares) {
            await pool.query(
                `INSERT INTO expense_share (id, expense_id, participant_id, owed_to_user_id, amount, status) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
                [
                    expense.id,
                    s.participantId || userId,
                    s.owedToUserId,
                    s.amount,
                    s.owedToUserId === (s.participantId || userId) ? "ACKED" : "PENDING"
                ]
            );
        }

        res.status(201).json({ expense });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create expense" });
    }

};

exports.listExpenses = async (req, res) => {
    try {

        const ownerId = req.headers['x-user-id'];
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT * FROM expenses 
       WHERE owner_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
            [ownerId, limit, offset]
        );

        res.status(201).json({ expenses: result.rows, page, limit });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
}

exports.getExpenseById = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const expenseId = req.params.id;

        // 1. Fetch expense
        const expenseRes = await pool.query(
            `SELECT * FROM expenses WHERE id = $1`,
            [expenseId]
        );

        if (expenseRes.rowCount === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }

        const expense = expenseRes.rows[0];

        // 2. Check ownership or participation
        let isAuthorized = false;

        if (expense.owner_id === userId) {
            isAuthorized = true;
        } else {
            const participantRes = await pool.query(
                `SELECT 1 FROM expense_share WHERE expense_id = $1 AND participant_id = $2 LIMIT 1`,
                [expenseId, userId]
            );

            if (participantRes.rowCount > 0) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ error: "Not authorized to view this expense" });
        }

        // 3. Fetch all shares (since user is authorized)
        const sharesRes = await pool.query(
            `SELECT * FROM expense_share WHERE expense_id = $1`,
            [expenseId]
        );

        res.status(200).json({ expense, shares: sharesRes.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch expense" });
    }
};

// use this if created_at is TIMESTAMP (with or without timezone)
exports.totalExpense = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    let { startDate, endDate } = req.body;

    if (!userId) return res.status(400).json({ error: "Missing x-user-id header" });
    if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate required" });

    // Parse and normalize to day boundaries (UTC)
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    const endExclusive = new Date(endDate);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1); // next day
    endExclusive.setUTCHours(0, 0, 0, 0);

    const result = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_expense
       FROM expenses
       WHERE owner_id = $1
         AND created_at >= $2
         AND created_at < $3`,
      [userId, start.toISOString(), endExclusive.toISOString()]
    );

    return res.json({
      userId,
      startDate: start.toISOString(),
      endDate: new Date(endExclusive.getTime() - 1).toISOString(), // endDate back to end-of-day for response
      totalExpense: result.rows[0].total_expense,
    });
  } catch (err) {
    console.error("getTotalExpense error:", err);
    res.status(500).json({ error: "Failed to calculate total expense" });
  }
};

