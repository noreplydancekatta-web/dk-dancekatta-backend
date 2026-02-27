const express = require('express');
const router = express.Router();
const Announcement = require('../models/announcement.model');

// GET all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });

    // Sanitize nulls
    const safeAnnouncements = announcements.map(a => ({
      _id: a._id,
      title: a.title || "No Title",
      message: a.message || "No Message",
      createdAt: a.createdAt,
      __v: a.__v
    }));

    res.json(safeAnnouncements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error });
  }
});

// ✅ POST a new announcement
router.post('/', async (req, res) => {
  try {
    const { title, message, createdAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const newAnnouncement = new Announcement({
      title,
      message,
      createdAt: createdAt || new Date()
    });

    const saved = await newAnnouncement.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement', error });
  }
});

module.exports = router;