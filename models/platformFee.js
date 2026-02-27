const mongoose = require("mongoose");

const platformFeeSchema = new mongoose.Schema(
  {
    feePercent: { type: Number, required: true },
    gstPercent: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlatformFee", platformFeeSchema);
