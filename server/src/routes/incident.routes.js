const express = require('express');
const router = express.Router();
const {
  createIncident,
  getIncidents,
  getNearbyIncidents,
  getIncidentById,
  updateIncident,
  suggestDuplicate,
  claimResolution,
  verifyResolution,
  reopenIncident,
  submitFeedback
} = require('../controllers/incident.controller');
const { protect, optionalAuth } = require('../middleware/auth');
const { validateIncidentInput } = require('../middleware/validate');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimit');

// Nested evidence routes
const evidenceRouter = require('./evidence.routes');
router.use('/:id/evidence', evidenceRouter);

// Geospatial search
router.get('/nearby', getNearbyIncidents);

// Base incident collection
router
  .route('/')
  .get(optionalAuth, getIncidents)
  .post(protect, uploadLimiter, upload.single('photo'), validateIncidentInput, createIncident);

// Single incident and lifecycle actions
router
  .route('/:id')
  .get(optionalAuth, getIncidentById)
  .patch(protect, updateIncident);

// Duplicate suggestion
router.post('/:id/duplicate-suggestion', protect, suggestDuplicate);

// Resolution claim and verification workflow
router.post('/:id/claim-resolution', protect, uploadLimiter, upload.single('photo'), claimResolution);
router.post('/:id/verification', protect, verifyResolution);
router.post('/:id/reopen', protect, reopenIncident);

// Feedback / abuse reporting
router.post('/:id/feedback', protect, submitFeedback);

module.exports = router;
