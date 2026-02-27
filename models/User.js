const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: String,
  altMobile: String,
  dateOfBirth: String,
  guardianName: String,
  guardianMobile: String,
  guardianEmail: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  country: String,
  profilePhoto: {
    type: String,
    default: ""
  },
  youtube: String,
  facebook: String,
  instagram: String,
  isProfessional: String,
  experience: String,
  skills: [
    {
      style: String,
      level: String
    }
  ],
  status: {
    type: String,
    enum: ["Active", "Disabled"],
    default: 'Active'
  },
  enrolled_batches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch'
    }
  ],
  isStudioOwner: {
    type: Boolean,
    default: false
  },


  studioCreated: {
    type: Boolean,
    default: false,
  },
  studioStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", null],
    default: null,
  },

  isProfileComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
