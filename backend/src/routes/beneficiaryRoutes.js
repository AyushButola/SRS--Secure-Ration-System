const express = require('express');
const router = express.Router();
const { createBeneficiary, getBeneficiary, getBeneficiaryCode } = require('../controllers/beneficiaryController');
const { getEntitlements } = require('../controllers/entitlementController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public / Non-Protected (for Demo simplicity or specific flows)
// Place specific sub-paths BEFORE the generic /:id if possible, though /:id won't eat /:id/code usually.

// router.get('/:id/code', verifyToken, getBeneficiaryCode); // Original
router.get('/:id/code', getBeneficiaryCode); // Open for Demo

// Protected
router.post('/create', verifyToken, createBeneficiary);
router.get('/:id/entitlements', getEntitlements);
router.get('/:id', verifyToken, getBeneficiary);

module.exports = router;
