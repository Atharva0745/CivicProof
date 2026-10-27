const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an incident title'],
      trim: true,
      maxlength: [140, 'Title cannot exceed 140 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Please specify an issue category'],
      enum: ['pothole', 'garbage', 'drainage', 'streetlight', 'other']
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'GeoJSON coordinates [longitude, latitude] are required'],
        validate: {
          validator: function (val) {
            return (
              Array.isArray(val) &&
              val.length === 2 &&
              val[0] >= -180 &&
              val[0] <= 180 &&
              val[1] >= -90 &&
              val[1] <= 90
            );
          },
          message: 'Coordinates must be valid [longitude (-180 to 180), latitude (-90 to 90)]'
        }
      }
    },
    addressLabel: {
      type: String,
      required: [true, 'Address label or landmark is required'],
      trim: true,
      maxlength: [250, 'Address cannot exceed 250 characters']
    },
    ward: {
      type: String,
      required: [true, 'Mumbai ward is required (e.g., Ward A, Ward K/East, etc.)'],
      trim: true
    },
    status: {
      type: String,
      enum: [
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
      ],
      default: 'Submitted'
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    evidenceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence'
      }
    ],
    possibleDuplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null
    },
    officialComplaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OfficialComplaint',
      default: null
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'redacted_public'],
      default: 'public'
    },
    assignedModeratorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    repairClaimDetails: {
      claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      claimedAt: { type: Date },
      note: { type: String },
      evidenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }
    },
    verificationDetails: {
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: { type: Date },
      verdict: { type: String, enum: ['accepted', 'disputed'] },
      note: { type: String }
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere index for geospatial proximity searches
incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ category: 1, status: 1 });
incidentSchema.index({ ward: 1, status: 1 });
incidentSchema.index({ reporterId: 1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
