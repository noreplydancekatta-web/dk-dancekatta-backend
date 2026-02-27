const express = require('express');
const router = express.Router();

const DanceStyle = require('../models/danceStyleModel'); // ✅ Import model
// ✅ GET - Fetch all dance styles with full image URL
router.get('/', async (req, res) => {
  try {
    const styles = await DanceStyle.find();

    const host = req.protocol + '://' + req.get('host');
    const stylesWithFullUrl = styles.map(style => ({
      ...style._doc,
      imageUrl: style.imageUrl?.startsWith('http')
        ? style.imageUrl
        : `${host}${style.imageUrl}`
    }));

    // Debug: log the returned styles
    console.log('Dance styles sent to client:', stylesWithFullUrl);

    res.status(200).json(stylesWithFullUrl);
  } catch (err) {
    console.error('❌ Error fetching all dance styles:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST - Fetch dance styles by array of IDs
router.post('/byIds', async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids must be an array of strings' });
  }

  try {
    const styles = await DanceStyle.find({ _id: { $in: ids } });

    const host = req.protocol + '://' + req.get('host');
    const stylesWithFullUrl = styles.map(style => ({
      ...style._doc,
      imageUrl: style.imageUrl?.startsWith('http')
        ? style.imageUrl
        : `${host}${style.imageUrl}`
    }));

    res.status(200).json(stylesWithFullUrl);
  } catch (err) {
    console.error('❌ Error fetching styles by IDs:', err);
    res.status(500).json({ message: 'Error fetching styles by IDs', error: err.message });
  }
});

module.exports = router;