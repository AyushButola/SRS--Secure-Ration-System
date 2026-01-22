const crypto = require('crypto');

/**
 * Generates a SHA-256 hash for a transaction node.
 * Formula: SHA256( prevHash + shopId + beneficiaryId + commodity + quantity + timestamp )
 * Note: We can add a 'salt' if needed, but the chain itself provides strong integrity.
 */
const generateHash = (prevHash, txnData) => {
    // Ensure deterministic order of fields
    const { shop_id, beneficiary_id, commodity, quantity, created_at } = txnData;

    // Data string
    const dataString = `${prevHash}|${shop_id}|${beneficiary_id}|${commodity}|${quantity}|${created_at}`;

    return crypto.createHash('sha256').update(dataString).digest('hex');
};

/**
 * Verifies if a given hash is valid for the provided data and previous hash.
 */
const verifyHash = (prevHash, targetHash, txnData) => {
    const calculated = generateHash(prevHash, txnData);
    return calculated === targetHash;
};

module.exports = { generateHash, verifyHash };
