const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
      index: true
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },
  {
    timestamps: false
  }
);

auditEventSchema.index({ incidentId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditEvent', auditEventSchema);
