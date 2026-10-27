const Incident = require('../models/Incident');
const Evidence = require('../models/Evidence');
const AuditEvent = require('../models/AuditEvent');
const Feedback = require('../models/Feedback');
const { logAudit } = require('../services/auditService');
const { emitIncidentEvent } = require('../services/notification');
const { findPotentialDuplicates } = require('../services/duplicateDetection');
const storageService = require('../services/storage');

// @desc    Create new civic incident report
// @route   POST /api/incidents
// @access  Private (Citizen)
const createIncident = async (req, res, next) => {
  try {
    const { title, description, category, parsedCoordinates, addressLabel, ward, visibility } = req.body;
    const [longitude, latitude] = parsedCoordinates;

    // Check for potential duplicate incidents nearby within 100 meters
    const duplicateCandidates = await findPotentialDuplicates({
      longitude,
      latitude,
      category,
      maxDistanceMeters: 100
    });

    const incident = await Incident.create({
      title,
      description,
      category,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      addressLabel,
      ward,
      visibility: visibility || 'public',
      status: 'Submitted',
      reporterId: req.user._id,
      possibleDuplicateOf: duplicateCandidates.length > 0 ? duplicateCandidates[0]._id : null
    });

    // If initial photo was uploaded via multipart
    if (req.file) {
      const fileMeta = await storageService.saveFile(req.file);
      const evidence = await Evidence.create({
        incidentId: incident._id,
        uploadedBy: req.user._id,
        kind: 'before_photo',
        storageKey: fileMeta.storageKey,
        publicUrl: fileMeta.publicUrl,
        contentHash: fileMeta.contentHash,
        caption: req.body.caption || 'Initial report evidence photo',
        metadata: {
          fileSize: fileMeta.fileSize,
          mimeType: fileMeta.mimeType,
          originalFilename: fileMeta.originalFilename
        }
      });
      incident.evidenceIds.push(evidence._id);
      await incident.save();
    }

    // Append-only audit record
    await logAudit({
      incidentId: incident._id,
      actorId: req.user._id,
      action: 'INCIDENT_CREATED',
      newValue: {
        title: incident.title,
        category: incident.category,
        ward: incident.ward,
        status: incident.status
      },
      note: 'Incident created by citizen'
    });

    // Broadcast real-time event
    emitIncidentEvent('incident:created', incident, incident._id);

    res.status(201).json({
      success: true,
      data: incident,
      duplicateWarnings: duplicateCandidates.length > 0 ? duplicateCandidates : []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all public incidents with search and filters
// @route   GET /api/incidents
// @access  Public
const getIncidents = async (req, res, next) => {
  try {
    const { category, status, ward, search, page = 1, limit = 20 } = req.query;

    const query = {};

    // Filter by visibility (private incidents only viewable by creator/admin)
    if (!req.user || req.user.role === 'citizen') {
      query.visibility = { $in: ['public', 'redacted_public'] };
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (ward) {
      query.ward = new RegExp(`^${ward}$`, 'i');
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { addressLabel: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await Incident.countDocuments(query);
    const incidents = await Incident.find(query)
      .populate('evidenceIds')
      .populate('reporterId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      count: incidents.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      data: incidents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Geospatial search for nearby incidents
// @route   GET /api/incidents/nearby
// @access  Public
const getNearbyIncidents = async (req, res, next) => {
  try {
    const { lng, lat, radius = 1000, category } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({
        success: false,
        message: 'Query parameters lng (longitude) and lat (latitude) are required.'
      });
    }

    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);
    const maxDist = Math.max(10, parseInt(radius, 10) || 1000);

    if (isNaN(longitude) || isNaN(latitude)) {
      return res.status(400).json({
        success: false,
        message: 'Query parameters lng (longitude) and lat (latitude) must be valid numbers.'
      });
    }

    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDist
        }
      },
      visibility: { $in: ['public', 'redacted_public'] }
    };

    if (category) {
      query.category = category;
    }

    const incidents = await Incident.find(query)
      .populate('evidenceIds')
      .populate('reporterId', 'name')
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get incident by ID with timeline & privacy rules
// @route   GET /api/incidents/:id
// @access  Public / Authenticated
const getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('evidenceIds')
      .populate('reporterId', 'name email')
      .populate('officialComplaintId')
      .populate('possibleDuplicateOf', 'title category status');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    // Determine authorization level
    const isOwner = req.user && req.user._id.toString() === incident.reporterId._id.toString();
    const isModeratorOrAdmin = req.user && ['moderator', 'admin'].includes(req.user.role);

    // Private incident restriction
    if (incident.visibility === 'private' && !isOwner && !isModeratorOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This incident record is private.'
      });
    }

    // Fetch public/authorized audit timeline
    const timeline = await AuditEvent.find({ incidentId: incident._id })
      .populate('actorId', 'name role')
      .sort({ createdAt: 1 })
      .lean();

    const incidentData = incident.toObject();

    // Redaction for public/unauthorized viewers
    if (!isOwner && !isModeratorOrAdmin) {
      if (incidentData.officialComplaintId) {
        delete incidentData.officialComplaintId.officialReference;
        delete incidentData.officialComplaintId.notes;
      }
      if (incidentData.reporterId) {
        delete incidentData.reporterId.email;
      }
      // If redacted public visibility, redact exact coordinates
      if (incidentData.visibility === 'redacted_public' && incidentData.location?.coordinates) {
        incidentData.location.coordinates = [
          Math.round(incidentData.location.coordinates[0] * 100) / 100,
          Math.round(incidentData.location.coordinates[1] * 100) / 100
        ];
      }
    }

    res.status(200).json({
      success: true,
      data: incidentData,
      timeline
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit own report before review
// @route   PATCH /api/incidents/:id
// @access  Private (Owner / Moderator)
const updateIncident = async (req, res, next) => {
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
        message: 'You are not authorized to update this incident report.'
      });
    }

    // Owners can only edit while in 'Submitted' or 'UnderReview' status
    if (isOwner && !['Submitted', 'UnderReview'].includes(incident.status)) {
      return res.status(400).json({
        success: false,
        message: 'This report has progressed in the workflow and can no longer be directly edited.'
      });
    }

    const previousValue = {
      title: incident.title,
      description: incident.description,
      addressLabel: incident.addressLabel,
      category: incident.category
    };

    const allowedUpdates = ['title', 'description', 'addressLabel', 'category', 'ward', 'visibility'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        incident[field] = req.body[field];
      }
    });

    await incident.save();

    await logAudit({
      incidentId: incident._id,
      actorId: req.user._id,
      action: 'INCIDENT_UPDATED',
      previousValue,
      newValue: {
        title: incident.title,
        description: incident.description,
        addressLabel: incident.addressLabel,
        category: incident.category
      },
      note: 'Incident details edited'
    });

    emitIncidentEvent('incident:updated', incident, incident._id);

    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suggest duplicate incident
// @route   POST /api/incidents/:id/duplicate-suggestion
// @access  Private
const suggestDuplicate = async (req, res, next) => {
  try {
    const { targetIncidentId, reason } = req.body;

    const source = await Incident.findById(req.params.id);
    const target = await Incident.findById(targetIncidentId);

    if (!source || !target) {
      return res.status(404).json({ success: false, message: 'Incident(s) not found' });
    }

    source.possibleDuplicateOf = target._id;
    await source.save();

    await logAudit({
      incidentId: source._id,
      actorId: req.user._id,
      action: 'DUPLICATE_SUGGESTED',
      newValue: { targetIncidentId: target._id, reason },
      note: `Duplicate suggested linking to ${target._id}: ${reason || ''}`
    });

    res.status(200).json({
      success: true,
      message: 'Duplicate suggestion recorded for moderator review.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Claim resolution with after-photo
// @route   POST /api/incidents/:id/claim-resolution
// @access  Private (Owner / Moderator / Municipal Officer)
const claimResolution = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const { note } = req.body;
    let evidenceId = null;

    if (req.file) {
      const fileMeta = await storageService.saveFile(req.file);
      const evidence = await Evidence.create({
        incidentId: incident._id,
        uploadedBy: req.user._id,
        kind: 'after_photo',
        storageKey: fileMeta.storageKey,
        publicUrl: fileMeta.publicUrl,
        contentHash: fileMeta.contentHash,
        caption: req.body.caption || 'Resolution / repair evidence after-photo',
        metadata: {
          fileSize: fileMeta.fileSize,
          mimeType: fileMeta.mimeType,
          originalFilename: fileMeta.originalFilename
        }
      });
      incident.evidenceIds.push(evidence._id);
      evidenceId = evidence._id;
    }

    const previousStatus = incident.status;
    incident.status = 'RepairClaimed';
    incident.repairClaimDetails = {
      claimedBy: req.user._id,
      claimedAt: new Date(),
      note: note || 'Repair claimed with evidence photograph',
      evidenceId
    };

    await incident.save();

    await logAudit({
      incidentId: incident._id,
      actorId: req.user._id,
      action: 'RESOLUTION_CLAIMED',
      previousValue: { status: previousStatus },
      newValue: { status: 'RepairClaimed', note },
      note: 'Repair claimed. Uploaded after-photo alone does not constitute proof of completion until verified.'
    });

    emitIncidentEvent('incident:resolution-claimed', incident, incident._id);

    res.status(200).json({
      success: true,
      message: 'Resolution claim recorded. Awaiting community or moderator verification.',
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or dispute claimed resolution
// @route   POST /api/incidents/:id/verification
// @access  Private (Authorized reviewer or Reporter)
const verifyResolution = async (req, res, next) => {
  try {
    const { verdict, note } = req.body; // 'accepted' or 'disputed'

    if (!['accepted', 'disputed'].includes(verdict)) {
      return res.status(400).json({
        success: false,
        message: "Verdict must be either 'accepted' (verified resolved) or 'disputed'."
      });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const isOwner = req.user._id.toString() === incident.reporterId.toString();
    const isModeratorOrAdmin = ['moderator', 'admin'].includes(req.user.role);

    // Only owner or moderator can verify/dispute
    if (!isOwner && !isModeratorOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the reporting citizen or authorized moderators may verify or dispute this resolution.'
      });
    }

    const previousStatus = incident.status;
    const newStatus = verdict === 'accepted' ? 'VerifiedResolved' : 'Disputed';

    incident.status = newStatus;
    incident.verificationDetails = {
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      verdict,
      note: note || (verdict === 'accepted' ? 'Work verified resolved' : 'Work disputed by citizen')
    };

    await incident.save();

    await logAudit({
      incidentId: incident._id,
      actorId: req.user._id,
      action: verdict === 'accepted' ? 'VERIFIED_RESOLVED' : 'RESOLUTION_DISPUTED',
      previousValue: { status: previousStatus },
      newValue: { status: newStatus, verdict, note },
      note: `Resolution claim ${verdict} by ${req.user.role} (${req.user.name})`
    });

    emitIncidentEvent('incident:verification-updated', incident, incident._id);

    res.status(200).json({
      success: true,
      message: `Resolution status updated to ${newStatus}.`,
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dispute resolution / Reopen report
// @route   POST /api/incidents/:id/reopen
// @access  Private (Reporter or Moderator)
const reopenIncident = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const isOwner = req.user._id.toString() === incident.reporterId.toString();
    const isModeratorOrAdmin = ['moderator', 'admin'].includes(req.user.role);

    if (!isOwner && !isModeratorOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to reopen this incident report.'
      });
    }

    const previousStatus = incident.status;
    incident.status = 'Reopened';
    await incident.save();

    await logAudit({
      incidentId: incident._id,
      actorId: req.user._id,
      action: 'INCIDENT_REOPENED',
      previousValue: { status: previousStatus },
      newValue: { status: 'Reopened', reason },
      note: `Incident reopened: ${reason || 'Issue resurfaced or incomplete'}`
    });

    emitIncidentEvent('incident:status-changed', incident, incident._id);

    res.status(200).json({
      success: true,
      message: 'Incident reopened successfully.',
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report abuse or incorrect information
// @route   POST /api/incidents/:id/feedback
// @access  Private
const submitFeedback = async (req, res, next) => {
  try {
    const { type, message } = req.body;

    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: 'Feedback type and message details are required.'
      });
    }

    const feedback = await Feedback.create({
      incidentId: req.params.id,
      userId: req.user._id,
      type,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Feedback received for moderation review.',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
