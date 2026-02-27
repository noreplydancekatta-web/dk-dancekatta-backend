const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Studio = require('../models/studio');
const User = require('../models/User');
const Branch = require('../models/branch');
const Batch = require('../models/batch');
const { sendStudioUnderReviewEmail } = require('../utils/studioEmailService');


// -------------------
// POST /api/studios
// Create a new studio
// -------------------
router.post('/', async (req, res) => {
  try {
    const studioData = req.body;

    if (!studioData.ownerId) {
      return res.status(400).json({ message: 'ownerId is required' });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(studioData.ownerId);

    const newStudio = new Studio({
      ...studioData,
      ownerId: ownerObjectId,
      status: 'Pending',
      logoUrl: studioData.logoUrl || '',
      aadharFrontPhoto: studioData.aadharFrontPhoto || '',
      aadharBackPhoto: studioData.aadharBackPhoto || '',
      studioPhotos: studioData.studioPhotos || [],
    });

    const savedStudio = await newStudio.save();

    // ✅ Send Under Review Email (non-blocking)
    if (savedStudio.contactEmail && savedStudio.studioName) {
      sendStudioUnderReviewEmail(
        savedStudio.contactEmail,
        savedStudio.studioName
      ).catch(err =>
        console.error("Email sending failed:", err.message)
      );
    }


    // Update user flags
   await User.findByIdAndUpdate(studioData.ownerId, {
  studioCreated: true,
  studioStatus: savedStudio.status,
  isStudioOwner: false,
});


    res.status(201).json(savedStudio);

  } catch (err) {
    console.error('❌ Error creating studio:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// -------------------
// GET /api/studios
// Fetch all approved studios
// -------------------
router.get('/', async (req, res) => {
  try {
    const studios = await Studio.find({ status: 'Approved' });
    res.status(200).json(studios);
  } catch (err) {
    console.error('❌ Error fetching studios:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// -------------------
// GET /api/studios/all
// Fetch all studios
// -------------------
router.get('/all', async (req, res) => {
  try {
    const studios = await Studio.find();
    res.status(200).json(studios);
  } catch (err) {
    console.error('❌ Error fetching all studios:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// =============================
// ✅ IMPORTANT FIXED ROUTE
// GET /api/studios/user/:userId
// Fetch studio by ownerId
// =============================
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const studio = await Studio.findOne({
      ownerId: new mongoose.Types.ObjectId(userId)
    });

    if (!studio) {
      return res.status(200).json(null);
    }

    res.status(200).json(studio);

  } catch (err) {
    console.error('❌ Error fetching studio by user:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// -------------------
// GET /api/studios/:studioId/details
// -------------------
router.get('/:studioId/details', async (req, res) => {
  const { studioId } = req.params;

  try {
    const branchCount = await Branch.countDocuments({ studioId });
    const batchCount = await Batch.countDocuments({ studioId });

    const firstBranch = await Branch.findOne({ studioId }).select('ownerName');
    const ownerName = firstBranch ? firstBranch.ownerName : null;

    res.status(200).json({
      studioId,
      branchCount,
      batchCount,
      ownerName
    });

  } catch (err) {
    console.error('❌ Error fetching studio details:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// -------------------
// GET /api/studios/:id
// Fetch studio by ID
// -------------------
router.get('/:id', async (req, res) => {
  try {
    const studioId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(studioId)) {
      return res.status(400).json({ message: 'Invalid studio ID format' });
    }

    const studio = await Studio.findById(studioId);
    if (!studio) {
      return res.status(404).json({ message: 'Studio not found' });
    }

    res.status(200).json(studio);

  } catch (err) {
    console.error('❌ Error fetching studio by ID:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// -------------------
// PUT /api/studios/:id/approve
// -------------------
router.put('/:id/approve', async (req, res) => {
  try {
    const updatedStudio = await Studio.findByIdAndUpdate(
      req.params.id,
      { status: 'Approved' },
      { new: true }
    );

    if (!updatedStudio) {
      return res.status(404).json({ message: 'Studio not found' });
    }

    await User.findByIdAndUpdate(updatedStudio.ownerId, {
      role: 'Studio Owner',
      studioStatus: 'Approved',
      isStudioOwner: true,
    });

    res.status(200).json({
      message: 'Studio approved',
      studio: updatedStudio
    });

  } catch (err) {
    console.error('❌ Error approving studio:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// -------------------
// PUT /api/studios/:id/reject
// -------------------
router.put('/:id/reject', async (req, res) => {
  try {
    const updatedStudio = await Studio.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected' },
      { new: true }
    );

    if (!updatedStudio) {
      return res.status(404).json({ message: 'Studio not found' });
    }

    await User.findByIdAndUpdate(updatedStudio.ownerId, {
      studioStatus: 'Rejected',
      isStudioOwner: false,
    });

    res.status(200).json({
      message: 'Studio rejected',
      studio: updatedStudio
    });

  } catch (err) {
    console.error('❌ Error rejecting studio:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});





module.exports = router;
