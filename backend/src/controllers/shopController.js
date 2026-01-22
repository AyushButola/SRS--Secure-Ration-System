const db = require('../config/db');

// GET /api/shops/:id/stock
const getShopStock = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            'SELECT * FROM ration_items WHERE shop_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Stock not found for this shop' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Stock Fetch Error:', err);
        res.status(500).json({ error: 'Failed to fetch stock' });
    }
};

module.exports = {
    getShopStock
};
