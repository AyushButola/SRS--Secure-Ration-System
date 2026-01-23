const express = require('express');
const router = express.Router();
const { getBeneficiary, getBeneficiaryTransactions, getBeneficiaryEntitlements } = require('../controllers/beneficiaryController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/:id', authenticateToken, getBeneficiary);
router.get('/:id/entitlements', authenticateToken, getBeneficiaryEntitlements);
router.get('/:id/transactions', authenticateToken, getBeneficiaryTransactions);

module.exports = router;
