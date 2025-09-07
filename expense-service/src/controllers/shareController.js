const pool= require("../db");

exports.listShares = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const sharesRes = await pool.query(
            `SELECT * FROM expense_share WHERE participant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        res.status(201).json({ shares: sharesRes.rows, page, limit });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch shares" });
    }
};

exports.updateShareStatus = async (req, res) => {
    try {

        const userId = req.headers['x-user-id'];
        const shareId = req.params.id;
        const { status } = req.body;

        if (!["ACKED", "PAID"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const sharesRes = await pool.query(
            `SELECT * FROM expense_share WHERE id = $1 LIMIT 1`,
            [shareId]
        );

        if(sharesRes.rowCount == 0){
            return res.status(400).json({ error: "No expense share found" });
        }

        if (status == "ACKED" && userId == sharesRes.rows[0].owed_to_user_id) {
            await pool.query(
                `UPDATE expense_share SET status = $1 WHERE id = $2`,
                [status, shareId]
            );
            return res.status(201).json({message : "Updation successfull"});
        }


        if (status == "PAID" && userId == sharesRes.rows[0].participant_id) {
            await pool.query(
                `UPDATE expense_share SET status = $1 WHERE id = $2`,
                [status, shareId]
            );
            return res.status(201).json({message : "Updation successfull"});
        }

        return res.status(403).json({ error: "Not authorized to view this expense" });


    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update share status" });
    }
};

