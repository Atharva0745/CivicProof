const Incident = require('../models/Incident');
const Evidence = require('../models/Evidence');
const storageService = require('../services/storage');
const { logAudit } = require('../services/auditService');
const { emitIncidentEvent } = require('../services/notification');

// @desc    Add evidence photo or link to incident
// @route   POST /api/incidents/:id/evidence
// @access  Private (Owner / Moderator / Reviewer)
const addEvidence = async (req, res, next) => {
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
        message: 'You are not authorized to attach evidence to this incident report.'
      });
    }

    let fileMeta;
    const kind = req.body.kind || 'before_photo';
    const caption = req.body.caption || '';

    if (req.file) {
      // File uploaded via multipart form
      fileMeta = await storageService.saveFile(req.file);
    } else if (req.body.publicUrl) {
      // External image URL provided
      fileMeta = storageService.createMetadataFromUrl(req.body.publicUrl, caption);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please attach an image file or provide a valid publicUrl.'
      });
    }

    const evidence = await Evidence.create({
      incidentId: incident._id,
      uploadedBy: req.user._id,
      kind,
      storageKey: fileMeta.storageKey,
      publicUrl: fileMeta.publicUrl,
      contentHash: fileMeta.contentHash,
      caption,
      reviewStatus: isModeratorOrAdmin ? 'accepted' : 'pending',
      metadata: {
        fileSize: fileMeta.fileSize,
        mimeType: fileMeta.mimeType,
        originalFilename: fileMeta.originalFilename
      }
    });

    incident.evidenceIds.push(evidence._id);
    await incident.save();

    await logAudit({
      incidentId: incident._id,
      actorId: req.user._id,
      action: 'EVIDENCE_ADDED',
      newValue: {
        evidenceId: evidence._id,
        kind,
        contentHash: fileMeta.contentHash
      },
      note: `Added ${kind} evidence: ${caption || 'No caption'}`
    });

    emitIncidentEvent('incident:updated', incident, incident._id);

    res.status(201).json({
      success: true,
      data: evidence
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all evidence for an incident
// @route   GET /api/incidents/:id/evidence
// @access  Public / Private
const getIncidentEvidence = async (req, res, next) => {
  try {
    const evidenceList = await Evidence.find({ incidentId: req.params.id })
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: evidenceList.length,
      data: evidenceList
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addEvidence,
  getIncidentEvidence
};
