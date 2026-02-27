const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: String,
  state: String,
});

module.exports = mongoose.model('City', citySchema);