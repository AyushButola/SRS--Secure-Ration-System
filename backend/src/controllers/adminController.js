const { pool } = require('../config/db');

const getPendingShops = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM ration_shops WHERE status = 'PENDING'");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const approveShop = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE ration_shops SET status = 'APPROVED' WHERE shop_id = $1", [id]);
        res.json({ message: 'Shop Approved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateShopStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'SUSPENDED', 'APPROVED'

    if (!['APPROVED', 'SUSPENDED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        await pool.query("UPDATE ration_shops SET status = $1 WHERE shop_id = $2", [status, id]);
        res.json({ message: `Shop status updated to ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllShops = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM ration_shops ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getPendingShops, approveShop, updateShopStatus, getAllShops };
