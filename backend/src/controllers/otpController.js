const db = require('../config/db');
const otpGenerator = require('otp-generator');
const fs = require('fs');
const path = require('path');

const logDebug = (msg) => {
    const logPath = path.join(__dirname, '../../backend_Debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    console.log(msg);
};

// Generate OTP for beneficiary
const generateOTP = async (req, res) => {
    const { beneficiaryId } = req.body;

    if (!beneficiaryId) {
        return res.status(400).json({ error: 'Beneficiary ID required' });
    }

    // Generate 6-digit OTP (Numeric only)
    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

    try {
        // Store OTP in database
        // Delete existing OTPs for this user first
        await db.query('DELETE FROM otp_codes WHERE beneficiary_id = $1', [beneficiaryId]);

        await db.query(
            `INSERT INTO otp_codes (beneficiary_id, otp_code, expires_at) 
             VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
            [beneficiaryId, otp]
        );

        logDebug(`[OTP-GEN] Generated for ${beneficiaryId}: ${otp}`);
        res.json({ otp, otpId: 'generated' });
    } catch (err) {
        console.error('[OTP-GEN] Error:', err);
        res.status(500).json({ error: 'Database write failed', details: err.message });
    }
};

// Admin Trigger OTP
const triggerOTP = async (req, res) => {
    const { beneficiaryId } = req.body;

    if (!beneficiaryId) {
        return res.status(400).json({ error: 'Beneficiary ID required' });
    }

    try {
        // 1. Check if beneficiary exists
        const userCheck = await db.query('SELECT mobile_number FROM beneficiaries WHERE beneficiary_id = $1', [beneficiaryId]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Beneficiary not found' });
        }

        const mobileNumber = userCheck.rows[0].mobile_number;

        // 2. Generate OTP
        const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        // 3. Store in DB
        await db.query('DELETE FROM otp_codes WHERE beneficiary_id = $1', [beneficiaryId]);

        await db.query(
            `INSERT INTO otp_codes (beneficiary_id, otp_code, expires_at) 
             VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
            [beneficiaryId, otp]
        );

        // 4. Simulate Sending SMS (Log it)
        const logMsg = `[ADMIN-TRIGGER] OTP for ${beneficiaryId} (Mobile: ${mobileNumber}): ${otp}`;
        logDebug(logMsg);

        res.json({ success: true, message: 'OTP sent successfully (Simulated)', otpId: 'generated' });

    } catch (err) {
        console.error('[ADMIN-TRIGGER] Error:', err);
        res.status(500).json({ error: 'Failed to trigger OTP', details: err.message });
    }
};

// Verify OTP
const verifyOTP = async (req, res) => {
    const { beneficiaryId, otp } = req.body;

    if (!beneficiaryId || !otp) {
        return res.status(400).json({ error: 'Beneficiary ID and OTP required' });
    }

    try {
        const cleanId = beneficiaryId.trim();
        const cleanOtp = otp.toString().trim();

        const result = await db.query(
            'SELECT * FROM otp_codes WHERE beneficiary_id = $1 AND otp_code = $2 AND expires_at > NOW()',
            [cleanId, cleanOtp]
        );

        if (result.rows.length > 0) {
            logDebug(`[OTP-VERIFY] Success for ${cleanId}`);
            // OTP is valid, delete it to prevent reuse
            await db.query('DELETE FROM otp_codes WHERE beneficiary_id = $1', [cleanId]);
            res.json({ valid: true });
        } else {
            logDebug(`[OTP-VERIFY] Failed for ${cleanId}. No match found (Expired or Wrong).`);
            res.json({ valid: false });
        }
    } catch (err) {
        console.error('[OTP-VERIFY] Error:', err);
        res.status(500).json({ error: 'Verification Failed' });
    }
};

// Get Current Valid OTP
const getCurrentOTP = async (req, res) => {
    const { id } = req.user; // From authenticateToken middleware

    try {
        const result = await db.query(
            'SELECT * FROM otp_codes WHERE beneficiary_id = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [id]
        );

        if (result.rows.length > 0) {
            res.json({ otp: result.rows[0].otp_code, valid: true });
        } else {
            res.json({ otp: null, valid: false, message: 'No active OTP found. Ask Admin to send one.' });
        }
    } catch (err) {
        console.error('[GET-OTP] Error:', err);
        res.status(500).json({ error: 'Failed to fetch OTP' });
    }
};

module.exports = {
    generateOTP,
    verifyOTP,
    triggerOTP,
    getCurrentOTP
};