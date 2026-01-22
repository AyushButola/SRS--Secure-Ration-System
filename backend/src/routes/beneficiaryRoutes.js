const express = require('express');
const router = express.Router();
const { createBeneficiary, getBeneficiary } = require('../controllers/beneficiaryController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protected routes (Require login)
router.post('/create', verifyToken, createBeneficiary);
router.get('/:id', verifyToken, getBeneficiary);

module.exports = router;
