const express = require('express');
const router = express.Router();
const { getStats, getLedger, getConflicts } = require('../controllers/adminController');

router.get('/stats', getStats);
router.get('/ledger', getLedger);
router.get('/conflicts', getConflicts);

module.exports = router;
