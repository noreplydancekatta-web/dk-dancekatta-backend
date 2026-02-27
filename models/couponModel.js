const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
  },
  discountPercent: {
    type: Number,
    required: true,
  },
  couponType: {
    type: String,
    enum: ["PlatformWide", "StudioSpecific"],
    default: "PlatformWide",
  },
  studioID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Studio",
    default: null,
  },
  startDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;