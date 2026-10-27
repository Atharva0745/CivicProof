const express = require('express');
const router = express.Router({ mergeParams: true });
const { addEvidence, getIncidentEvidence } = require('../controllers/evidence.controller');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimit');

// Mounted on /api/incidents/:id/evidence
router.route('/')
  .get(optionalAuth, getIncidentEvidence)
  .post(protect, uploadLimiter, upload.single('photo'), addEvidence);

module.exports = router;
