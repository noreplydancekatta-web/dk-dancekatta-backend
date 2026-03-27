const express = require('express');
const router = express.Router();
const Announcement = require('../models/announcement.model');
const User = require('../models/User');
const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// GET announcements for enrolled student only
// ─────────────────────────────────────────────
router.get('/student/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
                           .populate('enrolled_batches');

    if (!user || !user.enrolled_batches || user.enrolled_batches.length === 0) {
      return res.status(200).json([]);
    }

    const batch    = user.enrolled_batches[0];
    const studioId = batch.studioId;
    const batchId  = batch._id;

    // ✅ FIX: port changed from 5000 → 4000 (DanceCount's correct port)
    const response = await fetch(
      `http://147.93.19.17:4000/announcements/student/${studioId}/${batchId}`
    );

    if (!response.ok) {
      throw new Error(`DanceCount API error: ${response.status}`);
    }

    const announcements = await response.json();
    res.status(200).json(announcements);

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
    // ✅ FIX: studioId and batchId now properly destructured
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
      studioId,
      batchId: batchId || null,
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