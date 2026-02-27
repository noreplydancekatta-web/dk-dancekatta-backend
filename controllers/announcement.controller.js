// controllers/announcement.controller.js
const Announcement = require('../models/announcement.model');

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, createdAt } = req.body;

    const newAnnouncement = new Announcement({
      title,
      message,
      createdAt: createdAt || new Date()
    });

    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (err) {
    res.status(500).json({ message: "Failed to create announcement", error: err });
  }
};