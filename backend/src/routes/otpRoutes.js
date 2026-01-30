const express = require('express');
const router = express.Router();
const { generateOTP, verifyOTP, triggerOTP, getCurrentOTP } = require('../controllers/otpController');
const { authenticateToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/generate', authenticateToken, generateOTP);
router.post('/verify', authenticateToken, verifyOTP);
router.post('/admin-trigger', verifyAdmin, triggerOTP);
router.get('/current', authenticateToken, getCurrentOTP);

module.exports = router;