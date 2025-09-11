const pool = require("../db");
const axios = require("axios");
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
    } ``
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

        if (sharesRes.rowCount == 0) {
            return res.status(400).json({ error: "No expense share found" });
        }

        const axios = require("axios");

        if (status === "ACKED" && userId == sharesRes.rows[0].owed_to_user_id) {
            // 1. Update expense_share status
            await pool.query(
                `UPDATE expense_share SET status = $1 WHERE id = $2`,
                [status, shareId]
            );

            try {
                // 2. Call Notification Service to delete notification
                const notifRes = await axios.delete(
                    "http://notification:3003/notifications/delete",
                    {
                        data: {
                            userId: userId,   // owed_to_user_id
                            shareId: shareId  // expense_share_id
                        }
                    }
                );

                return res.status(200).json({
                    message: "Acknowledged successfully and notification deleted",
                    shareId,
                    notificationServiceResponse: notifRes.data,
                });
            } 
            catch (err) {
                console.error("Error calling Notification Service:", err.message);

                // Still return success for ACK, but notify about notification failure
                return res.status(200).json({
                    message: "Acknowledged successfully, but notification deletion failed",
                    shareId,
                    error: err.message,
                });
            }
        }



        if (status == "PAID" && userId == sharesRes.rows[0].participant_id) {
            await pool.query(
                `UPDATE expense_share SET status = $1 WHERE id = $2`,
                [status, shareId]
            );

            // Call notification service
            try {
                await axios.post("http://notification:3003/notifications/createNotification", {
                    userId: sharesRes.rows[0].owed_to_user_id,
                    shareId: shareId,
                });

                return res.status(201).json({ message: "Updation successful & notification sent" });
            } 
            catch (notifyErr) {

                return res.status(201).json({
                    message: "Updation successful but notification failed",
                    error: notifyErr.message
                });
            }
        }

        return res.status(403).json({ error: "Not authorized to view this expense" });


    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update share status" });
    }
};

exports.moneyToPay = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: "startDate and endDate are required" });
        }

        // parse & normalize to cover the whole days
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        start.setHours(0, 0, 0, 0);            // beginning of startDate
        end.setHours(23, 59, 59, 999);        // end of endDate

        const result = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_to_pay
             FROM expense_share
             WHERE participant_id = $1
             AND status != 'ACKED'
             AND created_at BETWEEN $2 AND $3`,
            [userId, start.toISOString(), end.toISOString()]
        );

        res.json({
            userId,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            moneyToPay: result.rows[0].total_to_pay
        });
    } catch (err) {
        console.error("Error in moneyToPay:", err);
        res.status(500).json({ error: "Failed to calculate money to pay" });
    }
};

exports.moneyToReceive = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: "startDate and endDate are required" });
        }

        // parse & normalize to cover the whole days
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const result = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_to_receive
             FROM expense_share
             WHERE owed_to_user_id = $1
             AND status != 'ACKED'
             AND created_at BETWEEN $2 AND $3`,
            [userId, start.toISOString(), end.toISOString()]
        );

        res.json({
            userId,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            moneyToReceive: result.rows[0].total_to_receive
        });
    } catch (err) {
        console.error("Error in moneyToReceive:", err);
        res.status(500).json({ error: "Failed to calculate money to receive" });
    }
};
