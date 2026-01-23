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
        // Since beneficiary_id might not have a UNIQUE constraint in the schema,
        // we DELETE existing OTPs for this user first, then INSERT.
        await db.query('DELETE FROM otp_codes WHERE beneficiary_id = $1', [beneficiaryId]);

        await db.query(
            `INSERT INTO otp_codes (beneficiary_id, otp_code, expires_at) 
             VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
            [beneficiaryId, otp]
        );


        logDebug(`[OTP-GEN] Generated for ${beneficiaryId}: ${otp} (Type: ${typeof otp})`);
        res.json({ otp, otpId: 'generated' });
    } catch (err) {
        console.error('[OTP-GEN] Error:', err);
        // If DB fails, we technically can't verify it later unless we have a backup store.
        // For debugging, we return it, but verification will fail.
        res.status(500).json({ error: 'Database write failed', details: err.message });
    }
};

// Verify OTP
const verifyOTP = async (req, res) => {
    const { beneficiaryId, otp } = req.body;

    console.log(`[OTP-VERIFY] Request: ${beneficiaryId} - ${otp}`);

    if (!beneficiaryId || !otp) {
        return res.status(400).json({ error: 'Beneficiary ID and OTP required' });
    }

    try {
        // Trim inputs
        const cleanId = beneficiaryId.trim();
        const cleanOtp = otp.toString().trim();

        console.log(`[OTP-VERIFY] Checking DB for: ID='${cleanId}', OTP='${cleanOtp}'`);

        logDebug(`[OTP-VERIFY] Checking DB for: ID='${cleanId}', OTP='${cleanOtp}' (Type: ${typeof cleanOtp})`);

        // Check for ANY OTP for this user to debug
        const debugCheck = await db.query('SELECT * FROM otp_codes WHERE beneficiary_id = $1', [cleanId]);
        if (debugCheck.rows.length > 0) {
            logDebug(`[OTP-VERIFY] Found ${debugCheck.rows.length} existing OTPs for user: ${JSON.stringify(debugCheck.rows)}`);
        } else {
            logDebug(`[OTP-VERIFY] No OTPs found for user '${cleanId}'.`);
            // debug: dump entire table
            const all = await db.query('SELECT * FROM otp_codes');
            logDebug(`[OTP-VERIFY-DEBUG] Full Table Dump: ${JSON.stringify(all.rows)}`);
        }

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

module.exports = {
    generateOTP,
    verifyOTP
};