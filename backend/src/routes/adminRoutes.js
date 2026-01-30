const express = require('express');
const router = express.Router();
const { getStats, getLedger, getConflicts, getBeneficiaries, searchBeneficiary } = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/stats', verifyAdmin, getStats);
router.get('/ledger', verifyAdmin, getLedger);
router.get('/conflicts', verifyAdmin, getConflicts);
router.get('/beneficiaries', verifyAdmin, getBeneficiaries);
router.get('/search-beneficiary/:id', verifyAdmin, searchBeneficiary);

module.exports = router;
