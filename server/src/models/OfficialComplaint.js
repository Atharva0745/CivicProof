const mongoose = require('mongoose');

const officialComplaintSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true
    },
    authority: {
      type: String,
      enum: ['BMC', 'Maharashtra grievance portal', 'other'],
      default: 'BMC',
      required: true
    },
    officialReference: {
      type: String,
      required: [true, 'Official complaint reference number or token is required'],
      trim: true
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    officialChannelUrl: {
      type: String,
      trim: true,
      default: 'https://portal.mcgm.gov.in/'
    },
    statusReportedByUser: {
      type: String,
      trim: true,
      default: 'Registered on official portal'
    },
    lastCheckedByUserAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

officialComplaintSchema.index({ incidentId: 1 });
officialComplaintSchema.index({ createdBy: 1 });

module.exports = mongoose.model('OfficialComplaint', officialComplaintSchema);
