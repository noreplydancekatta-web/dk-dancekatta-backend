const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: String,
});

module.exports = mongoose.model('Country', countrySchema);