const express = require('express');
const router = express.Router();
const { generateOTP, verifyOTP } = require('../controllers/otpController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/generate', authenticateToken, generateOTP);
router.post('/verify', authenticateToken, verifyOTP);

module.exports = router;