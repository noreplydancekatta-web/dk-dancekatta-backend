const express = require('express');
const router = express.Router();
const UserInbox = require('../models/userInbox.model');

// ✅ GET seen announcements for a user
router.get('/:userId', async (req, res) => {
  try {
    const inbox = await UserInbox.findOne({ userId: req.params.userId });
    res.json(inbox || { seenAnnouncements: [] });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching inbox', error: err });
  }
});

// ✅ POST mark an announcement as seen
router.post('/seen', async (req, res) => {
  const { userId, announcementId } = req.body;

  try {
    let inbox = await UserInbox.findOne({ userId });
    if (!inbox) {
      inbox = new UserInbox({ userId, seenAnnouncements: [announcementId] });
    } else if (!inbox.seenAnnouncements.includes(announcementId)) {
      inbox.seenAnnouncements.push(announcementId);
    }
    await inbox.save();
    res.json({ message: 'Announcement marked as seen' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update inbox', error: err });
  }
});

module.exports = router;