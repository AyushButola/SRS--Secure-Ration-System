const express = require('express');
const router = express.Router();
const { getStats, getLedger, getConflicts } = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/stats', verifyAdmin, getStats);
router.get('/ledger', verifyAdmin, getLedger);
router.get('/conflicts', verifyAdmin, getConflicts);

module.exports = router;
