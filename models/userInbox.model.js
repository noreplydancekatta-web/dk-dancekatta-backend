const mongoose = require('mongoose');

const UserInboxSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  seenAnnouncements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Announcement'
  }]
}, { timestamps: true });

module.exports = mongoose.model('UserInbox', UserInboxSchema);