const mongoose = require('mongoose');
const { Schema } = mongoose;

// merchant schema definition
const merchantSchema = new Schema({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  brand: {
    type: String,
  },
  business: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: 'Waiting Approval',
    enum: ['Waiting Approval', 'Rejected', 'Approved'],
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Merchant', merchantSchema);
