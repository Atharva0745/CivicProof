const express = require('express');
const router = express.Router();
const {
  assignIncident,
  updateStatus,
  mergeIncidents,
  getAdminQueue,
  getFeedbackQueue,
  updateFeedbackStatus
} = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Restrict all admin/moderator routes
router.use(protect, authorize('moderator', 'admin'));

router.get('/incidents', getAdminQueue);
router.patch('/incidents/:id/assign', assignIncident);
router.patch('/incidents/:id/status', updateStatus);
router.post('/incidents/:id/merge', mergeIncidents);

// Moderation feedback queue
router.get('/feedback', getFeedbackQueue);
router.patch('/feedback/:id', updateFeedbackStatus);

module.exports = router;
