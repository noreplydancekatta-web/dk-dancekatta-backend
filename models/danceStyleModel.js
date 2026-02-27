// models/danceStyleModel.js
const mongoose = require('mongoose');

const danceStyleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
});

// ✅ Fix to avoid OverwriteModelError:
const DanceStyle = mongoose.models.DanceStyle || mongoose.model('DanceStyle', danceStyleSchema);

module.exports = DanceStyle;