const Incident = require('../models/Incident');
const OfficialComplaint = require('../models/OfficialComplaint');
const FollowUpPacket = require('../models/FollowUpPacket');
const { generateFollowUpPacket } = require('../services/followUpPacket');
const { logAudit } = require('../services/auditService');
const { emitIncidentEvent } = require('../services/notification');

// @desc    Record official channel, reference and submission date
// @route   POST /api/incidents/:id/official-complaints
// @access  Private (Owner / Moderator)
const recordOfficialComplaint = async (req, res, next) => {
  try {
    const { authority, officialReference, submittedAt, officialChannelUrl, notes, statusReportedByUser } = req.body;

    if (!officialReference) {
      return res.status(400).json({
        success: false,
        message: 'Official complaint reference number or token is required.'
      });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const isOwner = req.user._id.toString() === incident.reporterId.toString();
    const isModeratorOrAdmin = ['moderator', 'admin'].includes(req.user.role);

    if (!isOwner && !isModeratorOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to record an official complaint for this incident.'
      });
    }

    const complaint = await OfficialComplaint.create({
      incidentId: incident._id,
      authority: authority || 'BMC',
      officialReference,
      submittedAt: submittedAt || new Date(),
      officialChannelUrl: officialChannelUrl || 'https://portal.mcgm.gov.in/',
      statusReportedByUser: statusReportedByUser || 'Registered on official portal',
      notes: notes || '',
      createdBy: req.user._id
    });

    // Update incident status to OfficialComplaintRecorded
    const previousStatus = incident.status;
    incident.officialComplaintId = complaint._id;
    if (['Submitted', 'UnderReview', 'ReadyForOfficialSubmission'].includes(incident.status)) {
      incident.status = 'OfficialComplaintRecorded';
    }
    await incident.save();

    await logAudit({
      incidentId: incident._id,
      actorId: req.user._id,
      action: 'OFFICIAL_COMPLAINT_RECORDED',
      previousValue: { status: previousStatus },
      newValue: {
        authority: complaint.authority,
        status: incident.status,
        officialComplaintId: complaint._id
      },
      note: `Official reference recorded by user for ${complaint.authority}. (User-entered, not independently verified by CivicProof with BMC).`
    });

    emitIncidentEvent('incident:status-changed', incident, incident._id);

    res.status(201).json({
      success: true,
      message: 'Official complaint reference recorded successfully.',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    View references belonging to authorized user
// @route   GET /api/incidents/:id/official-complaints
// @access  Private (Owner / Moderator / Admin)
const getOfficialComplaints = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const isOwner = req.user._id.toString() === incident.reporterId.toString();
    const isModeratorOrAdmin = ['moderator', 'admin'].includes(req.user.role);

    if (!isOwner && !isModeratorOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Official complaint references are restricted to the reporting citizen and moderators.'
      });
    }

    const complaints = await OfficialComplaint.find({ incidentId: req.params.id })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add user-reported status update
// @route   PATCH /api/official-complaints/:id/status-note
// @access  Private (Owner / Moderator)
const updateStatusNote = async (req, res, next) => {
  try {
    const { statusReportedByUser, notes } = req.body;

    const complaint = await OfficialComplaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Official complaint record not found' });
    }

    const incident = await Incident.findById(complaint.incidentId);
    const isOwner = incident && req.user._id.toString() === incident.reporterId.toString();
    const isModeratorOrAdmin = ['moderator', 'admin'].includes(req.user.role);

    if (!isOwner && !isModeratorOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this complaint status.'
      });
    }

    const previousStatus = complaint.statusReportedByUser;
    if (statusReportedByUser) {
      complaint.statusReportedByUser = statusReportedByUser;
    }
    if (notes !== undefined) {
      complaint.notes = notes;
    }
    complaint.lastCheckedByUserAt = new Date();
    await complaint.save();

    if (incident) {
      await logAudit({
        incidentId: incident._id,
        actorId: req.user._id,
        action: 'OFFICIAL_STATUS_UPDATED',
        previousValue: { userReportedStatus: previousStatus },
        newValue: { userReportedStatus: complaint.statusReportedByUser, notes: complaint.notes },
        note: 'Citizen updated the status reported on the official portal.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Official complaint status note updated.',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate a follow-up draft and evidence list
// @route   POST /api/incidents/:id/follow-up-packet
// @access  Private (Owner / Moderator)
const createFollowUpPacket = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id).populate('evidenceIds');
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const isOwner = req.user._id.toString() === incident.reporterId.toString();
    const isModeratorOrAdmin = ['moderator', 'admin'].includes(req.user.role);

    if (!isOwner && !isModeratorOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to generate escalation packet for this incident.'
      });
    }

    const officialComplaint = await OfficialComplaint.findOne({ incidentId: incident._id }).sort({
      createdAt: -1
    });

    const packet = await generateFollowUpPacket({
      incident,
      officialComplaint,
      user: req.user
    });

    // Update incident status to FollowUpPrepared if appropriate
    if (['OfficialComplaintRecorded', 'Disputed', 'FollowUpNeeded'].includes(incident.status)) {
      incident.status = 'FollowUpPrepared';
      await incident.save();

      await logAudit({
        incidentId: incident._id,
        actorId: req.user._id,
        action: 'FOLLOW_UP_PREPARED',
        newValue: { packetId: packet.packetId },
        note: 'Generated follow-up escalation dossier for citizen submission.'
      });

      emitIncidentEvent('incident:status-changed', incident, incident._id);
    }

    res.status(201).json({
      success: true,
      message: 'Follow-up escalation packet generated.',
      data: packet
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve generated packet
// @route   GET /api/incidents/:id/follow-up-packet/:packetId
// @access  Private (Owner / Moderator)
const getFollowUpPacket = async (req, res, next) => {
  try {
    const packet = await FollowUpPacket.findOne({
      packetId: req.params.packetId,
      incidentId: req.params.id
    });

    if (!packet) {
      return res.status(404).json({
        success: false,
        message: 'Escalation packet not found'
      });
    }

    const incident = await Incident.findById(packet.incidentId);
    const isOwner = incident && req.user._id.toString() === incident.reporterId.toString();
    const isModeratorOrAdmin = ['moderator', 'admin'].includes(req.user.role);

    if (!isOwner && !isModeratorOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to report owner and moderators.'
      });
    }

    res.status(200).json({
      success: true,
      data: packet
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordOfficialComplaint,
  getOfficialComplaints,
  updateStatusNote,
  createFollowUpPacket,
  getFollowUpPacket
};
