const Incident = require('../models/Incident');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { logAudit } = require('../services/auditService');
const { emitIncidentEvent } = require('../services/notification');

// @desc    Assign internal moderator / queue
// @route   PATCH /api/admin/incidents/:id/assign
// @access  Private (Admin / Moderator)
const assignIncident = async (req, res, next) => {
  try {
    const { moderatorId } = req.body;

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    let assignedUser = null;
    if (moderatorId) {
      assignedUser = await User.findById(moderatorId);
      if (!assignedUser || !['moderator', 'admin'].includes(assignedUser.role)) {
        return res.status(400).json({
          success: false,
          message: 'Target user must have moderator or admin role.'
        });
      }
    }

    const previousMod = incident.assignedModeratorId;
    incident.assignedModeratorId = moderatorId || null;
    await incident.save();

    await logAudit({
      incidentId: incident._id,
      actorId: req.user._id,
      action: 'INCIDENT_ASSIGNED',
      previousValue: { assignedModeratorId: previousMod },
      newValue: { assignedModeratorId: moderatorId },
      note: `Incident assigned to ${assignedUser ? assignedUser.name : 'unassigned'}`
    });

    emitIncidentEvent('incident:assigned', incident, incident._id);

    res.status(200).json({
      success: true,
      message: `Incident assigned to ${assignedUser ? assignedUser.name : 'nobody'}.`,
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change CivicProof status
// @route   PATCH /api/admin/incidents/:id/status
// @access  Private (Admin / Moderator)
const updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    const validStatuses = [
      'Submitted',
      'UnderReview',
      'Duplicate',
      'ReadyForOfficialSubmission',
      'OfficialComplaintRecorded',
      'InProgress',
      'RepairClaimed',
      'VerifiedResolved',
      'Disputed',
      'FollowUpNeeded',
      'FollowUpPrepared',
      'Reopened'
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const previousStatus = incident.status;
    incident.status = status;
    await incident.save();

    await logAudit({
      incidentId: incident._id,
      actorId: req.user._id,
      action: 'STATUS_CHANGED',
      previousValue: { status: previousStatus },
      newValue: { status },
      note: note || `Status changed from ${previousStatus} to ${status} by moderator`
    });

    emitIncidentEvent('incident:status-changed', incident, incident._id);

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Merge duplicate incidents (preserves all evidence & reporters)
// @route   POST /api/admin/incidents/:id/merge
// @access  Private (Admin / Moderator)
const mergeIncidents = async (req, res, next) => {
  try {
    const { targetIncidentId, note } = req.body;

    if (!targetIncidentId) {
      return res.status(400).json({
        success: false,
        message: 'Primary targetIncidentId to merge into is required.'
      });
    }

    const source = await Incident.findById(req.params.id);
    const target = await Incident.findById(targetIncidentId);

    if (!source || !target) {
      return res.status(404).json({ success: false, message: 'Source or target incident not found.' });
    }

    if (source._id.toString() === target._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot merge incident into itself.' });
    }

    // Merge evidence arrays safely
    const uniqueEvidence = Array.from(
      new Set([...target.evidenceIds.map((id) => id.toString()), ...source.evidenceIds.map((id) => id.toString())])
    );
    target.evidenceIds = uniqueEvidence;
    await target.save();

    // Mark source as duplicate
    const prevSourceStatus = source.status;
    source.status = 'Duplicate';
    source.possibleDuplicateOf = target._id;
    await source.save();

    // Audit logs for both records
    await logAudit({
      incidentId: source._id,
      actorId: req.user._id,
      action: 'INCIDENT_MERGED_OUT',
      previousValue: { status: prevSourceStatus },
      newValue: { status: 'Duplicate', targetIncidentId: target._id },
      note: note || `Merged into target incident ${target._id}. Evidence retained.`
    });

    await logAudit({
      incidentId: target._id,
      actorId: req.user._id,
      action: 'INCIDENT_MERGED_IN',
      newValue: { mergedSourceId: source._id },
      note: `Absorbed duplicate incident ${source._id} and consolidated evidence.`
    });

    emitIncidentEvent('incident:status-changed', source, source._id);
    emitIncidentEvent('incident:updated', target, target._id);

    res.status(200).json({
      success: true,
      message: `Incident ${source._id} successfully merged into ${target._id}.`,
      data: {
        primary: target,
        duplicate: source
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get moderation queue with filters
// @route   GET /api/admin/incidents
// @access  Private (Admin / Moderator)
const getAdminQueue = async (req, res, next) => {
  try {
    const { status, ward, unassignedOnly, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    } else {
      // Default to items requiring review or attention
      query.status = { $in: ['Submitted', 'UnderReview', 'RepairClaimed', 'Disputed', 'FollowUpNeeded'] };
    }

    if (ward) {
      query.ward = new RegExp(`^${ward}$`, 'i');
    }

    if (unassignedOnly === 'true') {
      query.assignedModeratorId = null;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Incident.countDocuments(query);
    const incidents = await Incident.find(query)
      .populate('reporterId', 'name email')
      .populate('assignedModeratorId', 'name email')
      .populate('evidenceIds')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      count: incidents.length,
      data: incidents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get moderation feedback queue
// @route   GET /api/admin/feedback
// @access  Private (Admin / Moderator)
const getFeedbackQueue = async (req, res, next) => {
  try {
    const { status = 'new' } = req.query;
    const feedbackList = await Feedback.find({ status })
      .populate('userId', 'name email')
      .populate('incidentId', 'title category ward status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedbackList.length,
      data: feedbackList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update feedback review status
// @route   PATCH /api/admin/feedback/:id
// @access  Private (Admin / Moderator)
const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['new', 'reviewing', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback status.' });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    feedback.status = status;
    await feedback.save();

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignIncident,
  updateStatus,
  mergeIncidents,
  getAdminQueue,
  getFeedbackQueue,
  updateFeedbackStatus
};
