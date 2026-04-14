const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Transaction = require('../models/transaction');
const Batch = require('../models/batch');
const Studio = require('../models/studio');
const DanceStyle = require('../models/danceStyleModel');
const Level = require('../models/Level');
const PlatformFee = require("../models/platformFee");
const User = require("../models/User");
const Coupon = require("../models/couponModel");
const { sendEnrollmentEmail } = require("../utils/enrollmentEmailService"); // ✅ NEW

// ✅ GET enrolled batches for a user with style & level names
router.get('/enrolled/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const transactions = await Transaction.find({
      studentId: new mongoose.Types.ObjectId(studentId)
    }).sort({ transactionDate: -1 }).lean();

    if (!transactions || transactions.length === 0) {
      return res.json([]);
    }

    const batchIds = transactions.map(txn => txn.batchId);
    const batches = await Batch.find({ _id: { $in: batchIds } }).lean();

    const studioIds = batches.map(b => b.studioId);
    const studios = await Studio.find({ _id: { $in: studioIds } }).lean();

    const styleIds = [...new Set(batches.map(b => b.style.toString()))];
    const levelIds = [...new Set(batches.map(b => b.level.toString()))];

    const styles = await DanceStyle.find({ _id: { $in: styleIds } }).lean();
    const levels = await Level.find({ _id: { $in: levelIds } }).lean();

    const styleMap = styles.reduce((map, style) => {
      map[style._id.toString()] = style.name;
      return map;
    }, {});

    const levelMap = levels.reduce((map, level) => {
      map[level._id.toString()] = level.name;
      return map;
    }, {});

    const result = transactions.map(txn => {
      const batch = batches.find(b => b._id.toString() === txn.batchId.toString());
      const studio = batch ? studios.find(s => s._id.toString() === batch.studioId.toString()) : null;

      if (!batch) return null;

      return {
        transactionId: txn._id,
        batchName: batch.batchName,
        style: styleMap[batch.style.toString()] || 'Unknown Style',
        level: levelMap[batch.level.toString()] || 'Unknown Level',
        fee: batch.fee,
        fromDate: batch.fromDate,
        toDate: batch.toDate,
        studioName: studio?.studioName || 'Unknown Studio',
        studioId: batch.studioId,
        batchId: batch._id,
        platformFeePercent: txn.platformFeePercent,
        gstPercent: txn.gstPercent,
        discountPercent: txn.discountPercent || 0,
        discountAmount: txn.discountAmount || 0,
        paymentAmount: txn.paymentDetails.amountPaid,
        paymentDate: txn.paymentDetails.paymentDate,
        paymentMethod: txn.paymentDetails.paymentMethod,
        paymentStatus: txn.paymentDetails.paymentStatus,
        razorpayPaymentId: txn.paymentDetails.transactionId,
        enrolled_students: batch.enrolled_students || [],
      };
    }).filter(Boolean);

    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching enrolled batches:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ✅ GET latest platform fee + gst
router.get("/platformfee/latest", async (req, res) => {
  try {
    const platformFee = await PlatformFee.findOne().sort({ createdAt: -1 });
    if (!platformFee) {
      return res.status(404).json({ message: "No platform fee config found" });
    }
    res.json(platformFee);
  } catch (err) {
    console.error("❌ Error fetching platform fee:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ POST / — Create transaction + enroll student + send email
router.post("/", async (req, res) => {
  try {
    const { studentId, batchId, couponCode, paymentDetails } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: "Invalid studentId or batchId" });
    }

    const batch = await Batch.findById(batchId)
      .populate('style', 'name')
      .populate('level', 'name')
      .populate('studioId', 'studioName');
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // --- Update enrolled_students in batch ---
    if (!batch.enrolled_students.some(id => id.equals(user._id))) {
      batch.enrolled_students.push(user._id);
      console.log(`🔹 Adding student ${user._id} to batch ${batch._id}`);
    } else {
      console.log(`ℹ️ Student ${user._id} already in batch ${batch._id}`);
    }
    await batch.save();

    // --- Update enrolled_batches in user ---
    if (!user.enrolled_batches.some(id => id.equals(batch._id))) {
      user.enrolled_batches.push(batch._id);
      console.log(`🔹 Adding batch ${batch._id} to student ${user._id}`);
    } else {
      console.log(`ℹ️ Batch ${batch._id} already in student ${user._id}`);
    }
    await user.save();

    // --- Fetch latest platform fee + GST ---
    const platformFee = await PlatformFee.findOne().sort({ createdAt: -1 });
    const feePercent = platformFee ? platformFee.feePercent : 5;
    const gstPercent = platformFee ? platformFee.gstPercent : 18;

    // --- Calculate discount if coupon exists ---
    let discountPercent = 0;
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ couponCode, isActive: true });
      if (coupon) {
        discountPercent = coupon.discountPercent;
        discountAmount = (batch.fee * discountPercent) / 100;
      }
    }

    // --- Save transaction ---
    const txn = new Transaction({
      studentId,
      batchId,
      couponCode: couponCode || null,
      discountPercent,
      discountAmount,
      platformFeePercent: feePercent,
      gstPercent,
      paymentDetails,
    });
    await txn.save();

    // ✅ Send enrollment confirmation email (non-blocking)
    if (user.email) {
      sendEnrollmentEmail({
        studentEmail: user.email,
        studentName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        batchName: batch.batchName,
        studioName: batch.studioId?.studioName || 'DanceKatta Studio',
        styleName: batch.style?.name || '',
        levelName: batch.level?.name || '',
        fromDate: batch.fromDate,
        toDate: batch.toDate,
        amountPaid: paymentDetails.amountPaid,
        paymentId: paymentDetails.transactionId,
        paymentMethod: paymentDetails.paymentMethod,
      }).catch(err => console.error("Enrollment email failed:", err.message));
    }

    // --- Return updated batch with enrolled students ---
    const updatedBatch = await Batch.findById(batch._id)
      .populate('enrolled_students', 'firstName lastName email mobile');

    res.status(201).json({
      message: "Transaction & enrollment updated successfully",
      txn,
      batch: updatedBatch,
    });
  } catch (err) {
    console.error("❌ Error creating transaction:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

module.exports = router;