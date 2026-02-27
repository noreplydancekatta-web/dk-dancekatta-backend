const mongoose = require('mongoose');

const paymentDetailsSchema = new mongoose.Schema({
  amountPaid: { type: Number, required: true },
  paymentMethod: { type: String, required: true }, // e.g., 'Razorpay'
  paymentStatus: { type: String, required: true }, // e.g., 'Success', 'Failed'
  paymentDate: { type: Date, default: Date.now },
  transactionId: { type: String, required: true }, // Razorpay or internal TXN ID
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  couponCode: { type: String, default: null },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  platformFeePercent: { type: Number, default: 5 },
  gstPercent: { type: Number, default: 18 },
  paymentDetails: { type: paymentDetailsSchema, required: true },
  transactionDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);