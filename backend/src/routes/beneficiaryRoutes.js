const express = require('express');
const router = express.Router();
const { getBeneficiary } = require('../controllers/beneficiaryController');

router.get('/:id', getBeneficiary);

module.exports = router;
