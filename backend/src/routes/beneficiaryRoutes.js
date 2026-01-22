const express = require('express');
const router = express.Router();
const { getBeneficiary } = require('../controllers/beneficiaryController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/:id', authenticateToken, getBeneficiary);

module.exports = router;
