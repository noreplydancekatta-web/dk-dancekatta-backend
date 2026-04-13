const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  studioId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Studio', required: true },
  batchId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
