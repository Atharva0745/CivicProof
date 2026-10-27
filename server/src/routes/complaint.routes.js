const express = require('express');
const router = express.Router();
const {
  recordOfficialComplaint,
  getOfficialComplaints,
  updateStatusNote,
  createFollowUpPacket,
  getFollowUpPacket
} = require('../controllers/complaint.controller');
const { protect } = require('../middleware/auth');

// Direct route for status updates on complaint records: PATCH /api/official-complaints/:id/status-note
router.patch('/official-complaints/:id/status-note', protect, updateStatusNote);

// Incident-scoped routes
router.post('/incidents/:id/official-complaints', protect, recordOfficialComplaint);
router.get('/incidents/:id/official-complaints', protect, getOfficialComplaints);

// Follow-up escalation packet routes
router.post('/incidents/:id/follow-up-packet', protect, createFollowUpPacket);
router.get('/incidents/:id/follow-up-packet/:packetId', protect, getFollowUpPacket);

module.exports = router;
