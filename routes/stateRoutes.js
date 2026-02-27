const express = require('express');
const router = express.Router();
const State = require('../models/State');

router.get('/', async (req, res) => {
  try {
    const states = await State.find();
    res.json(states);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching states' });
  }
});

module.exports = router;