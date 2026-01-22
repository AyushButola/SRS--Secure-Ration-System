const express = require('express');
const router = express.Router();
const { createBeneficiary, getBeneficiary } = require('../controllers/beneficiaryController');
const { getEntitlements } = require('../controllers/entitlementController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protected routes (Require login)
router.post('/create', verifyToken, createBeneficiary);
router.get('/:id', verifyToken, getBeneficiary);
router.get('/:id/entitlements', getEntitlements); // TODO: Add verifyToken later if needed

module.exports = router;
