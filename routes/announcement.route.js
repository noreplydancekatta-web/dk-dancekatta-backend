const express = require('express');
const router = express.Router();
const Announcement = require('../models/announcement.model');
const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// GET announcements for enrolled student only
// ─────────────────────────────────────────────
router.get('/student/:userId', async (req, res) => {
  try {
    const Transaction = mongoose.model('Transaction');
    const Batch = mongoose.model('Batch');

    // Step 1: Get all transactions for this student
    const transactions = await Transaction.find({
      studentId: req.params.userId,
    });

    console.log(`📦 Transactions found: ${transactions.length}`);

    if (!transactions || transactions.length === 0) {
      return res.status(200).json([]);
    }

    // Step 2: Get all batchIds from transactions
    const batchIds = [...new Set(
      transactions.map(t => t.batchId?.toString()).filter(Boolean)
    )];

    console.log('✅ batchIds:', batchIds);

    // Step 3: Look up those batches to get their studioIds
    const batches = await Batch.find({ _id: { $in: batchIds } });

    console.log(`📦 Batches found: ${batches.length}`);

    // ✅ Convert ObjectId to plain string to match Announcement.studioId (String type)
    const studioIds = [...new Set(
      batches.map(b => b.studioId?.toString()).filter(Boolean)
    )];

    console.log('✅ studioIds (as strings):', studioIds);

    if (studioIds.length === 0) {
      return res.status(200).json([]);
    }

    // Step 4: Fetch announcements
    // Both studioId and batchId in Announcement are Strings, so direct $in match works
    const announcements = await Announcement.find({
      studioId: { $in: studioIds },
      $or: [
        { batchId: null },
        { batchId: { $exists: false } },
        { batchId: '' },
        { batchId: { $in: batchIds } },
      ],
    }).sort({ createdAt: -1 });

    console.log(`📢 Found ${announcements.length} announcements for userId: ${req.params.userId}`);

    const safeAnnouncements = announcements.map(a => ({
      _id:       a._id,
      title:     a.title   || 'No Title',
      message:   a.message || 'No Message',
      studioId:  a.studioId,
      batchId:   a.batchId,
      createdAt: a.createdAt,
    }));

    res.status(200).json(safeAnnouncements);

  } catch (error) {
    console.error('❌ Error fetching student announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements', error: error.message });
  }
});


// ─────────────────────────────────────────────
// GET all announcements
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { studioId } = req.query;
    const filter = studioId ? { studioId } : {};
    const announcements = await Announcement.find(filter).sort({ createdAt: -1 });

    const safeAnnouncements = announcements.map(a => ({
      _id:       a._id,
      title:     a.title   || 'No Title',
      message:   a.message || 'No Message',
      studioId:  a.studioId,
      batchId:   a.batchId,
      createdAt: a.createdAt,
    }));

    res.status(200).json(safeAnnouncements);

  } catch (error) {
    console.error('❌ Error fetching announcements:', error);
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
});


// ─────────────────────────────────────────────
// POST a new announcement
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  console.log('📥 POST /announcements body:', req.body);

  try {
    const { title, message, studioId, batchId, createdAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    if (!studioId) {
      return res.status(400).json({ message: 'studioId is required' });
    }

    const newAnnouncement = new Announcement({
      title,
      message,
      // ✅ Always store as plain string to stay consistent with query
      studioId: studioId.toString(),
      batchId: batchId ? batchId.toString() : null,
      createdAt: createdAt || new Date(),
    });

    const saved = await newAnnouncement.save();

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: saved,
    });

  } catch (error) {
    console.error('❌ Failed to create announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement', error: error.message });
  }
});


// ─────────────────────────────────────────────
// DELETE an announcement
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid announcement ID' });
    }

    const deleted = await Announcement.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement', error: error.message });
  }
});

module.exports = router;
