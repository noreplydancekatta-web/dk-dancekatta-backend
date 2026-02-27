const mongoose = require('mongoose');

const studioSchema = new mongoose.Schema({
  studioName: String,
  registeredAddress: String,
  contactEmail: String,
  contactNumber: String,
  gstNumber: String,
  panNumber: String,
  aadharFrontPhoto: { type: String, default: "" },
  aadharBackPhoto: { type: String, default: "" },
  bankAccountNumber: String,
  bankIfscCode: String,
  studioIntroduction: String,
  studioPhotos: [{ type: String }],
  logoUrl: { type: String, default: "" },
  studioWebsite: String,
  studioFacebook: String,
  studioYoutube: String,
  studioInstagram: String,
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ✅ NEW RATING FIELDS
  ratingBreakdown: {
    type: Map,
    of: Number,
    default: {}
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

// ✅ CORRECT EXPORT (IMPORTANT)
module.exports = mongoose.models.Studio || mongoose.model('Studio', studioSchema);