const crypto = require('crypto');

/**
 * Generates a SHA-256 hash for the given data.
 * @param {object|string} data - The data to hash. If object, it will be JSON stringified (sorted keys for consistency).
 * @param {string} prevHash - The hash of the previous transaction.
 * @returns {string} - The hex string of the hash.
 */
const generateHash = (data, prevHash) => {
    // Ensure consistent ordering of object keys for deterministic hashing
    const stringData = typeof data === 'object'
        ? JSON.stringify(data, Object.keys(data).sort())
        : data.toString();

    const content = prevHash + stringData;

    return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Verifies if the hash matches the content.
 * @param {string} hash - The hash to verify.
 * @param {object|string} data - The original data.
 * @param {string} prevHash - The previous hash.
 * @returns {boolean}
 */
const verifyHash = (hash, data, prevHash) => {
    const calculatedHash = generateHash(data, prevHash);
    return calculatedHash === hash;
};

module.exports = {
    generateHash,
    verifyHash
};
