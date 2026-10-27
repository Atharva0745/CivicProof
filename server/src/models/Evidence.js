const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    kind: {
      type: String,
      enum: ['before_photo', 'after_photo', 'other'],
      default: 'before_photo',
      required: true
    },
    storageKey: {
      type: String,
      required: true
    },
    publicUrl: {
      type: String,
      required: true
    },
    capturedAt: {
      type: Date,
      default: Date.now
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [300, 'Caption cannot exceed 300 characters'],
      default: ''
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    contentHash: {
      type: String,
      required: true
    },
    metadata: {
      fileSize: Number,
      mimeType: String,
      originalFilename: String
    }
  },
  {
    timestamps: true
  }
);

evidenceSchema.index({ incidentId: 1 });
evidenceSchema.index({ uploadedBy: 1 });
evidenceSchema.index({ contentHash: 1 });

module.exports = mongoose.model('Evidence', evidenceSchema);
