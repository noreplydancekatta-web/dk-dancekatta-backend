const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  studioId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Studio'
  },
  // Support both old and new field names
  branchName: {
    type: String,
    required: false // Make it optional to support old data
  },
  name: {
    type: String,
    required: false // Support old field name
  },
  branchAddress: {
    type: String,
    required: false // Make it optional to support old data
  },
  address: {
    type: String,
    required: false // Support old field name
  },

  area: {
    type: String,
    required: false,  // optional field
    default: 'Unknown Area' // optional default value
  },

  branchCity: {
    type: String,
    required: false
  },
  city: {
    type: String,
    required: false // Support old field name
  },
  branchState: {
    type: String,
    required: false
  },
  state: {
    type: String,
    required: false // Support old field name
  },
  branchPincode: {
    type: String,
    required: false
  },
  pincode: {
    type: String,
    required: false // Support old field name
  },
  contactNumber: {
    type: String,
    required: false
  },
  contactNo: {
    type: String,
    required: false // Support old field name
  },
  branchEmail: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false // Support old field name
  },
  mapLink: {
    type: String,
    default: ''
  },
   // ✅ Image logic
    branchImage: {
      type: String, // will store relative/absolute path or URL
      default: ''   // safe default if no image uploaded
    },
    image: {
            type: String,
            required: false, // or true, depending on your needs
        },

  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to populate studio info if needed
branchSchema.virtual('studio', {
  ref: 'Studio',
  localField: 'studioId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Branch', branchSchema);
