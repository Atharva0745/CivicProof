const AuditEvent = require('../models/AuditEvent');

/**
 * Append-only audit logger for tracking lifecycle changes, verification, and edits
 */
const logAudit = async ({ incidentId, actorId, action, previousValue = null, newValue = null, note = '' }) => {
  try {
    const event = await AuditEvent.create({
      incidentId,
      actorId,
      action,
      previousValue,
      newValue,
      note
    });
    return event;
  } catch (error) {
    console.error('[AuditService] Failed to record audit event:', error.message);
    // Don't crash caller on logging failure, but log to error output
    return null;
  }
};

module.exports = { logAudit };
