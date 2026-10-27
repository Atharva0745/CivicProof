const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['incorrect_location', 'duplicate', 'resolved', 'abuse', 'other'],
      required: true
    },
    message: {
      type: String,
      required: [true, 'Please provide feedback details'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: ['new', 'reviewing', 'closed'],
      default: 'new'
    }
  },
  {
    timestamps: true
  }
);

feedbackSchema.index({ incidentId: 1 });
feedbackSchema.index({ status: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
