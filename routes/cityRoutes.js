const express = require('express');
const router = express.Router();
const City = require('../models/City');

router.get('/', async (req, res) => {
  try {
    const cities = await City.find();
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching cities' });
  }
});

module.exports = router;