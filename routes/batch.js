// In routes/batch.js

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Batch = require('../models/batch');
const Studio = require('../models/studio');
const Transaction = require('../models/transaction');
const User = require('../models/User');
const PlatformFee = require('../models/platformFee');


// ✅ Helper: Validate ObjectId
const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;

// ✅ Helper: Enrich Batch Object - FINAL AND DEFINITIVE FIX
const enrichBatch = (batch) => {
  console.log('🔄 Enriching batch:', batch.batchName);

  // Use a temporary variable to access the populated branch data correctly
  const branchData = batch.branch;

  console.log('📦 Branch data:', JSON.stringify(branchData, null, 2));
  console.log('🧐 Direct access batch.branch.image before assignment:', branchData?.image);

  // Prepend the base URL to the image path if it exists
  const branchImage = branchData?.image ? `https://dancekatta-otp-test.onrender.com${branchData.image}` : null;

  const enriched = {
    ...batch.toObject(),
    studioName: batch.studioId?.studioName || 'Studio',
    studioId: batch.studioId?._id || null,
    branchAddress: branchData?.branchAddress || branchData?.address || 'N/A',
    branchCity: branchData?.branchCity || branchData?.city || 'N/A',
    branchName: branchData?.branchName || branchData?.name || batch.batchName || 'N/A',
    branchContactNo: branchData?.contactNumber || branchData?.contactNo || 'N/A',
    styleName: batch.style?.name || '',
    levelName: batch.level?.name || '',
    trainerName: batch.trainer
      ? typeof batch.trainer === 'string'
        ? batch.trainer
        : batch.trainer.firstName
          ? `${batch.trainer.firstName} ${batch.trainer.lastName}`.trim()
          : (batch.trainer.name || 'Unknown Trainer')
      : 'Unknown Trainer',
    // ✅ The Final Fix: Assign the correct, full image URL
    image: branchImage,
  };

  console.log('✅ Enriched branch image:', enriched.image);
  return enriched;
};


// ✅ GET /api/batches/filter — Filter batches by multiple criteria
router.get('/filter', async (req, res) => {
  const { style, level, studioId, branchId, days } = req.query;

  try {
    const query = {};

    if (style && style !== 'All Styles') {
      const styleIds = style.split(',').map(id => id.trim());
      if (styleIds.some(id => !isValidObjectId(id))) {
        return res.status(400).json({ message: 'Invalid style ID' });
      }
      query.style = { $in: styleIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (level && level !== 'All Levels') {
      const levelIds = level.split(',').map(id => id.trim());
      if (levelIds.some(id => !isValidObjectId(id))) {
        return res.status(400).json({ message: 'Invalid level ID' });
      }
      query.level = { $in: levelIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (branchId && branchId !== 'All Locations') {
      if (isValidObjectId(branchId)) {
        query.branch = new mongoose.Types.ObjectId(branchId);
      } else {
        query.branch = branchId;
      }
    }

    if (days && days !== 'All Days') {
      const daysArray = days.split(',').map(d => d.trim());
      query.days = { $in: daysArray };
    }

    if (studioId && studioId !== 'All Studios') {
      const studioIds = studioId.split(',').map(id => id.trim());
      if (studioIds.some(id => !isValidObjectId(id))) {
        return res.status(400).json({ message: 'Invalid studio ID' });
      }
      query.studioId = { $in: studioIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    console.log('🔍 Batch filter query:', JSON.stringify(query, null, 2));

    const batches = await Batch.find(query)
      .populate('studioId', 'studioName')
      .populate('branch', 'branchName branchAddress branchCity branchState contactNumber mapLink name address contactNo image')
      .populate('style', 'name')
      .populate('level', 'name')
      .populate('trainer', 'firstName lastName name')
      .populate('enrolled_students', 'firstName lastName email mobile');

    console.log('📊 Found batches:', batches.length);

    batches.forEach((batch, index) => {
      console.log(`📦 Batch ${index + 1}:`, batch.batchName);
      console.log('📦 Branch data:', JSON.stringify(batch.branch, null, 2));
    });

    const enriched = batches.map(enrichBatch);
    res.status(200).json(enriched);
  } catch (error) {
    console.error('❌ Error fetching filtered batches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET /api/batches/all — Get all batches
router.get('/all', async (req, res) => {
  try {
    const batches = await Batch.find({})
      .populate('studioId', 'studioName')
      .populate('branch', 'branchName branchAddress branchCity branchState contactNumber mapLink name address contactNo image')
      .populate('style', 'name')
      .populate('level', 'name')
      .populate('trainer', 'firstName lastName name')
      .populate('enrolled_students', 'firstName lastName email mobile');

    const enriched = batches.map(enrichBatch);
    res.status(200).json(enriched);
  } catch (error) {
    console.error('❌ Error fetching all batches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET /api/batches — Alias for all batches
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find({})
      .populate('studioId', 'studioName')
      .populate('branch', 'branchName branchAddress branchCity branchState contactNumber mapLink name address contactNo image')
      .populate('style', 'name')
      .populate('level', 'name')
      .populate('trainer', 'firstName lastName name')
      .populate('enrolled_students', 'firstName lastName email mobile');

    const enriched = batches.map(enrichBatch);
    res.status(200).json(enriched);
  } catch (error) {
    console.error('❌ Error fetching batches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ POST /api/batches/enroll — Enroll a user and create transaction
// ✅ POST /api/batches/enroll — Production-safe enrollment
router.post('/enroll', async (req, res) => {
  const { batchId, userId, paymentDetails } = req.body;

  if (!batchId || !userId || !paymentDetails) {
    return res.status(400).json({ message: 'batchId, userId, and paymentDetails are required' });
  }

  if (!isValidObjectId(batchId) || !isValidObjectId(userId)) {
    return res.status(400).json({ message: 'Invalid batchId or userId' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const batch = await Batch.findById(batchId).session(session);
    if (!batch) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Batch not found' });
    }

    // ✅ Check if batch is already full
    if (batch.enrolled_students.length >= batch.capacity) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Batch capacity reached. Enrollment closed.' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // ✅ Check if user is already enrolled
    const alreadyEnrolled = batch.enrolled_students.some(studentId =>
      studentId.equals(userObjectId)
    );
    if (alreadyEnrolled) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'User already enrolled in this batch' });
    }

    // ✅ Add user to batch
    batch.enrolled_students.push(userObjectId);
    await batch.save({ session });

    // ✅ Fetch latest platform fee + gst
    const platformFee = await PlatformFee.findOne().sort({ createdAt: -1 }).session(session);
    const feePercent = platformFee ? platformFee.feePercent : 5;   // default 5%
    const gstPercent = platformFee ? platformFee.gstPercent : 18;  // default 18%

    // ✅ Create transaction
    const txn = new Transaction({
      studentId: userObjectId,
      batchId: batch._id,
      paymentDetails,
      platformFeePercent: feePercent,
      gstPercent: gstPercent
    });

    await txn.save({ session });

    // ✅ Update user
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { enrolled_batches: batch._id } },
      { session }
    );

    // ✅ Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Fetch the updated batch with populated enrolled_students
    const updatedBatch = await Batch.findById(batch._id)
      .populate('enrolled_students', 'firstName lastName email mobile');

    res.status(200).json({
      message: 'User enrolled and transaction recorded',
      batch: updatedBatch,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error enrolling user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ✅ GET /api/batches/studio/:studioId — Get batches for specific studio
router.get('/studio/:studioId', async (req, res) => {
  try {
    const studioIdParam = req.params.studioId;

    if (!isValidObjectId(studioIdParam)) {
      return res.status(400).json({ message: 'Invalid studioId. Must be a 24-character hex string.' });
    }

    const studioId = new mongoose.Types.ObjectId(studioIdParam);
    const batches = await Batch.find({ studioId })
      .populate('branch', 'branchName branchAddress branchCity branchState contactNumber mapLink name address contactNo image')
      .populate('style', 'name')
      .populate('level', 'name')
      .populate('trainer', 'firstName lastName name')
      .populate('enrolled_students', 'firstName lastName email mobile');

    const enriched = batches.map(enrichBatch);
    res.status(200).json(enriched);
  } catch (error) {
    console.error('❌ Error fetching batches for studio:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET /api/batches/debug/branch/:branchId — Debug branch data
router.get('/debug/branch/:branchId', async (req, res) => {
  try {
    const branchId = req.params.branchId;
    console.log('🔍 Debugging branch ID:', branchId);

    if (!isValidObjectId(branchId)) {
      return res.status(400).json({ message: 'Invalid branch ID format' });
    }

    const Branch = require('../models/branch');
    const branch = await Branch.findById(branchId);

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    console.log('📦 Branch data found:', JSON.stringify(branch, null, 2));
    res.status(200).json(branch);
  } catch (error) {
    console.error('❌ Error debugging branch:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;