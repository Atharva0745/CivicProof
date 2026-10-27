const express = require('express');
const router = express.Router();
const { getSummary, getRecurringHotspots } = require('../controllers/dashboard.controller');

router.get('/summary', getSummary);
router.get('/recurring-hotspots', getRecurringHotspots);

module.exports = router;
