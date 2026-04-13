const express = require('express');
const router = express.Router();
const Announcement = require('../models/announcement.model');
const User = require('../models/User');
const Transaction = require('../models/transaction'); // ✅ matches your actual file: transaction.js
const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// GET announcements for enrolled student only
// KEY FIX: only return announcements created AFTER the student enrolled
//          in that specific batch, so pre-enrollment messages are hidden.
// ─────────────────────────────────────────────
router.get('/student/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
                           .populate('enrolled_batches');

    console.log('🔍 User found:', user?._id);
    console.log('🔍 Enrolled batches:', user?.enrolled_batches?.length);

    if (!user || !user.enrolled_batches || user.enrolled_batches.length === 0) {
      console.log('⚠️ No user or no enrolled batches');
      return res.status(200).json([]);
    }

    // ✅ Fetch the transaction records for this user so we know WHEN they
    //    enrolled in each batch.
    //    Schema uses: studentId, transactionDate, and timestamps:true (createdAt)
    const transactions = await Transaction.find({
      studentId: req.params.userId,   // ← correct field name from schema
    }).lean();

    console.log('🔍 Transactions found:', transactions.length);

    // Build a map: batchId (string) → enrolledAt (Date)
    const enrolledAtMap = {};
    for (const txn of transactions) {
      const batchId = txn.batchId?.toString();
      if (batchId) {
        const existing = enrolledAtMap[batchId];
        const txnDate = new Date(txn.transactionDate || txn.createdAt || 0);
        if (!existing || txnDate < existing) {
          enrolledAtMap[batchId] = txnDate;
        }
      }
    }

    console.log('🔍 Enrollment map:', enrolledAtMap);

    const results = await Promise.allSettled(
      user.enrolled_batches.map(async (batch) => {
        const batchId = batch._id.toString();
        const enrolledAt = enrolledAtMap[batchId] || new Date(0);

        console.log('🔍 Checking batch:', batchId);
        console.log('🔍 Enrolled at:', enrolledAt);
        console.log('🔍 Studio ID:', batch.studioId?.toString());

        // First check all announcements for this batch without date filter
        const allAnnouncementsForBatch = await Announcement.find({
          $or: [
            { batchId: batchId },
            { batchId: batch._id },
            { batchId: null }
          ],
          studioId: batch.studioId?.toString(),
        }).lean();

        console.log('🔍 Total announcements for batch (no date filter):', allAnnouncementsForBatch.length);
        if (allAnnouncementsForBatch.length > 0) {
          console.log('🔍 Sample announcement createdAt:', allAnnouncementsForBatch[0].createdAt);
          console.log('🔍 Is announcement after enrollment?', new Date(allAnnouncementsForBatch[0].createdAt) >= enrolledAt);
        }

        const announcements = await Announcement.find({
          $or: [
            { batchId: batchId },
            { batchId: batch._id },
            { batchId: null }
          ],
          studioId: batch.studioId?.toString(),
          createdAt: { $gte: enrolledAt },
        })
          .sort({ createdAt: -1 })
          .lean();

        console.log('🔍 Announcements found for batch', batchId, ':', announcements.length);
        if (announcements.length > 0) {
          console.log('🔍 First announcement:', announcements[0]);
        }

        return announcements.map(a => ({
          _id:       a._id,
          title:     a.title   || 'No Title',
          message:   a.message || 'No Message',
          studioId:  a.studioId,
          batchId:   a.batchId,
          createdAt: a.createdAt,
        }));
      })
    );

    // Collect successful results, skip failed ones
    const allAnnouncements = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Deduplicate by _id (in case a general announcement targets multiple batches)
    const seen = new Set();
    const unique = allAnnouncements.filter(a => {
      const key = a._id.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by newest first
    unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log('✅ Total unique announcements:', unique.length);

    res.status(200).json(unique);

  } catch (error) {
    console.error('❌ Error fetching student announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements', error: error.message });
  }
});


// ─────────────────────────────────────────────
// GET all announcements (studio-side, no filter)
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
      studioId,
      batchId: batchId || null,
      createdAt: createdAt || new Date(),
    });

    const saved = await newAnnouncement.save();

    // Forward the new announcement to DanceCount API
    // so students enrolled in this batch receive it
    try {
      const dcResponse = await fetch(
        `http://147.93.19.17:4000/announcements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            message,
            studioId,
            batchId: batchId || null,
            createdAt: saved.createdAt,
          }),
        }
      );

      if (!dcResponse.ok) {
        console.warn(`⚠️ DanceCount sync warning: ${dcResponse.status}`);
      } else {
        console.log('✅ Announcement synced to DanceCount API');
      }
    } catch (syncError) {
      // Don't fail the whole request if sync fails
      console.warn('⚠️ Could not sync to DanceCount API:', syncError.message);
    }

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
