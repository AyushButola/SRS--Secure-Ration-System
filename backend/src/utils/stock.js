const getColumnForCommodity = (commodity) => {
    switch (commodity?.toUpperCase()) {
        case 'RICE': return 'remaining_rice_amount';
        case 'WHEAT': return 'remaining_wheat_amount';
        case 'SUGAR': return 'remaining_sugar_amount';
        case 'KEROSENE': return 'remaining_kerosene_amount';
        default: return null;
    }
};

const deductStock = async (client, shop_id, commodity, quantity) => {
    const column = getColumnForCommodity(commodity);
    if (!column) {
        throw new Error(`Unknown commodity for stock tracking: ${commodity}`);
    }

    const query = `
        UPDATE ration_items 
        SET ${column} = ${column} - $1 
        WHERE shop_id = $2
        RETURNING ${column} as new_balance
    `;

    const res = await client.query(query, [quantity, shop_id]);

    if (res.rows.length === 0) {
        throw new Error(`Shop ${shop_id} not found in ration_items`);
    }

    return res.rows[0].new_balance;
};

const getStock = async (client, shop_id) => {
    const res = await client.query('SELECT * FROM ration_items WHERE shop_id = $1', [shop_id]);
    return res.rows[0];
};

module.exports = { deductStock, getStock };
