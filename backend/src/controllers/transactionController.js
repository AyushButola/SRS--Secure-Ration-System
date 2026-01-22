const Transaction = require('../models/Transaction');

// POST /api/transactions
const createTransaction = async (req, res) => {
    const { beneficiary_id, shop_id, ration_period, commodity, quantity } = req.body;

    // Basic Validation
    if (!beneficiary_id || !shop_id || !ration_period || !commodity || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Create Transaction (Handles Hash Chain internally)
        const newTxn = await Transaction.create({
            beneficiary_id,
            shop_id,
            ration_period,
            commodity,
            quantity
        });

        res.status(201).json(newTxn);
    } catch (err) {
        console.error('Transaction Error:', err);
        res.status(500).json({ error: 'Failed to process transaction' });
    }
};

module.exports = {
    createTransaction
};
