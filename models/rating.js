const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  review: { type: String },
  createdAt: { type: Date, default: Date.now }
});

ratingSchema.index({ userId: 1, batchId: 1 }, { unique: true }); // prevent duplicate ratings

module.exports = mongoose.model('Rating', ratingSchema);