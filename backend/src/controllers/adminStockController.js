const { pool } = require('../config/db');

// POST /api/admin/shops/:id/stock
const addStock = async (req, res) => {
    const { id } = req.params; // Shop ID
    const { commodity, quantity } = req.body;

    if (!commodity || !quantity) {
        return res.status(400).json({ message: 'Provide commodity and quantity' });
    }

    try {
        // We use the `ration_items` table. 
        // If the shop doesn't have an entry yet, create it.
        // Columns are: shop_id, remaining_rice_amount, remaining_wheat_amount, etc.
        // We need to map commodity string to column name.

        let column = '';
        if (commodity.toLowerCase() === 'rice') column = 'remaining_rice_amount';
        else if (commodity.toLowerCase() === 'wheat') column = 'remaining_wheat_amount';
        else if (commodity.toLowerCase() === 'sugar') column = 'remaining_sugar_amount';
        else if (commodity.toLowerCase() === 'kerosene') column = 'remaining_kerosene_amount';
        else return res.status(400).json({ message: 'Invalid commodity type' });

        const query = `
            INSERT INTO ration_items (shop_id, ${column}, last_updated)
            VALUES ($1, $2, NOW())
            ON CONFLICT (shop_id)
            DO UPDATE SET ${column} = ration_items.${column} + $2, last_updated = NOW()
            RETURNING *;
        `;

        const result = await pool.query(query, [id, quantity]);

        res.json({
            message: `Added ${quantity} to ${commodity}`,
            stock: result.rows[0]
        });

    } catch (error) {
        console.error('Stock Update Error:', error);
        res.status(500).json({ message: 'Server error updating stock' });
    }
};

module.exports = { addStock };
