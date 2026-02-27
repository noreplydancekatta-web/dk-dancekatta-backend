const express = require('express');
const router = express.Router();

const DanceStyle = require('../models/danceStyleModel');
const Level = require('../models/Level');
const Studio = require('../models/studio');
const Branch = require('../models/branch');
const Batch = require('../models/batch');

// ✅ GET: /api/filters/styles
router.get('/styles', async (req, res) => {
  try {
    const styles = await DanceStyle.find({}).sort({ name: 1 });
    res.json(styles);
  } catch (error) {
    console.error('❌ [GET /filters/styles] Error:', error);
    res.status(500).json({ message: 'Failed to fetch dance styles' });
  }
});

// ✅ GET: /api/filters/levels
router.get('/levels', async (req, res) => {
  try {
    const levels = await Level.find({}).sort({ name: 1 });
    res.json(levels);
  } catch (error) {
    console.error('❌ [GET /filters/levels] Error:', error);
    res.status(500).json({ message: 'Failed to fetch levels' });
  }
});

// ✅ GET: /api/filters/studios
router.get('/studios', async (req, res) => {
  try {
    const studios = await Studio.find({ status: 'Approved' }).sort({ studioName: 1 });
    res.json(studios);
  } catch (error) {
    console.error('❌ [GET /filters/studios] Error:', error);
    res.status(500).json({ message: 'Failed to fetch studios' });
  }
});

// ✅ GET: /api/filters/locations
router.get('/locations', async (req, res) => {
  try {
    const locations = await Branch.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: '$branchAddress' } },
      { $sort: { _id: 1 } }
    ]);
    res.json(locations.map(loc => loc._id));
  } catch (error) {
    console.error('❌ [GET /filters/locations] Error:', error);
    res.status(500).json({ message: 'Failed to fetch branch locations' });
  }
});

// ✅ GET: /api/filters/days
router.get('/days', async (req, res) => {
  try {
    const days = await Batch.aggregate([
      { $unwind: '$days' },
      { $group: { _id: '$days' } },
      { $sort: { _id: 1 } }
    ]);
    res.json(days.map(d => d._id));
  } catch (error) {
    console.error('❌ [GET /filters/days] Error:', error);
    res.status(500).json({ message: 'Failed to fetch batch days' });
  }
});

module.exports = router;
