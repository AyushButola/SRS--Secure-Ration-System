const express = require('express');
const router = express.Router();
const { syncTransactions } = require('../controllers/syncController');

router.post('/', syncTransactions);

module.exports = router;
