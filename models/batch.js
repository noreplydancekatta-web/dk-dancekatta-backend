const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  studioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Studio',
    required: true,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch', // ✅ Corrected to reference the Branch model
    required: true,
  },
  batchName: {
    type: String,
    required: true
  },
  style: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DanceStyle',
    required: true,
  },
  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true,
  },
  trainer: {
    type: mongoose.Schema.Types.Mixed, // Allow both string and ObjectId
    required: false
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  days: {
    type: [String],
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  enrolled_students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  fee: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.models.Batch || mongoose.model('Batch', batchSchema);
