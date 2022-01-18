const mongoose = require('mongoose');
const { Schema } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

// merchant schema definition
const merchantSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
  },
  business: {
    type: String,
    trim: true,
    required: true,
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

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Merchant', merchantSchema);
