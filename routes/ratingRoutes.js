const express = require('express');
const router = express.Router();
const Rating = require('../models/rating');
const Studio = require('../models/studio');

// @route POST /api/ratings
router.post('/', async (req, res) => {
  try {
    console.log('--- Incoming rating POST ---');
    console.log('Request body:', req.body);
    const { userId, studioId, batchId, rating, review } = req.body;
    console.log('userId:', userId, 'type:', typeof userId);
    console.log('studioId:', studioId, 'type:', typeof studioId);
    console.log('batchId:', batchId, 'type:', typeof batchId);
    console.log('rating:', rating, 'type:', typeof rating);

    // Check if user already rated this batch
    const existing = await Rating.findOne({ userId, batchId });
    if (existing) {
      console.warn('User already rated this batch:', { userId, batchId });
      return res.status(400).json({ message: 'You already rated this batch.' });
    }

    // Save rating
    const newRating = new Rating({ userId, studioId, batchId, rating, review });
    await newRating.save();
    console.log('Rating saved:', newRating._id);

    // Update studio aggregate
    const studio = await Studio.findById(studioId);
    if (!studio) {
      console.error('Studio not found for studioId:', studioId);
      return res.status(404).json({ message: 'Studio not found' });
    }

    // Ensure ratingBreakdown is a Map or Object
    if (!studio.ratingBreakdown) {
      studio.ratingBreakdown = {};
    }
    const ratingKey = rating.toString();
    let currentCount = 0;
    if (studio.ratingBreakdown.get) {
      // Mongoose Map
      currentCount = studio.ratingBreakdown.get(ratingKey) || 0;
      studio.ratingBreakdown.set(ratingKey, currentCount + 1);
    } else {
      // Plain Object
      currentCount = studio.ratingBreakdown[ratingKey] || 0;
      studio.ratingBreakdown[ratingKey] = currentCount + 1;
    }

    studio.totalReviews = (studio.totalReviews || 0) + 1;

    // Calculate average rating
    let entries = [];
    if (studio.ratingBreakdown.entries) {
      entries = Array.from(studio.ratingBreakdown.entries());
    } else {
      entries = Object.entries(studio.ratingBreakdown);
    }
    const totalStars = entries.reduce((sum, [star, count]) => {
      return sum + (parseInt(star) * count);
    }, 0);
    const avg = totalStars / studio.totalReviews;
    studio.averageRating = isNaN(avg) ? 0 : Number(avg.toFixed(1));

    await studio.save();
    console.log('Studio rating updated:', studio._id);

    res.status(201).json({ message: 'Rating submitted successfully' });
  } catch (err) {
    console.error('❌ Error submitting rating:', err);
    if (err && err.stack) {
      console.error('Stack trace:', err.stack);
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ NEW: GET all ratings by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const ratings = await Rating.find({ userId }).lean();
    res.json(ratings);
  } catch (err) {
    console.error('❌ Error fetching ratings for user:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;