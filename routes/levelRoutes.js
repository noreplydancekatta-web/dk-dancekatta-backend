const express = require('express');
const router = express.Router();
const Level = require('../models/Level');

router.get('/', async (req, res) => {
  try {
    const levels = await Level.find();
    res.json(levels);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching levels' });
  }
});

module.exports = router;