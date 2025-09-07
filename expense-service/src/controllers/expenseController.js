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
                `INSERT INTO expense_share (id, expense_id, participant_id, owed_to_user_id, amount) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
                [expense.id, s.participantId || userId, s.owedToUserId, s.amount]
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
                
        const ownerId = req.headers['x-user-id'];
        const expenseId = req.params.id;

        const expenseRes = await pool.query(
            `SELECT * FROM expenses WHERE id = $1`,
            [expenseId]
        );

        if (expenseRes.rowCount === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }

        const expense = expenseRes.rows[0];

        // check if user is a participant
        if (expense.owner_id !== ownerId) {
            const participantRes = await pool.query(
                `SELECT * FROM expense_share WHERE expense_id = $1 AND participant_id = $2 LIMIT 1`,
                [expenseId, ownerId]
            );

            if (participantRes.rowCount === 0) {
                return res.status(403).json({ error: "Not authorized to view this expense" });
            }

            return res.status(201).json({ expense, shares: participantRes.rows });

        }

        const sharesRes = await pool.query(
            `SELECT * FROM expense_share WHERE expense_id = $1`,
            [expenseId]
        );

        res.status(201).json({ expense, shares: sharesRes.rows });

    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch expense" });
    }
};