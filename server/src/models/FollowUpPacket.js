const mongoose = require('mongoose');

const followUpPacketSchema = new mongoose.Schema(
  {
    packetId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authority: {
      type: String,
      default: 'BMC'
    },
    officialReference: {
      type: String,
      default: 'Not recorded'
    },
    subject: {
      type: String,
      required: true
    },
    neutralDraftText: {
      type: String,
      required: true
    },
    incidentSnapshot: {
      title: String,
      category: String,
      addressLabel: String,
      ward: String,
      coordinates: [Number],
      reportedAt: Date,
      currentStatus: String
    },
    evidenceList: [
      {
        kind: String,
        url: String,
        uploadedAt: Date,
        caption: String
      }
    ],
    officialChannelLinks: [
      {
        name: String,
        url: String,
        description: String
      }
    ]
  },
  {
    timestamps: true
  }
);

followUpPacketSchema.index({ incidentId: 1 });
followUpPacketSchema.index({ generatedBy: 1 });

module.exports = mongoose.model('FollowUpPacket', followUpPacketSchema);
