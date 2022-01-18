const mongoose = require('mongoose');
const { Schema } = mongoose;

// contact schema definition
const contactSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    trim: true,
    required: true,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Contact', contactSchema);
