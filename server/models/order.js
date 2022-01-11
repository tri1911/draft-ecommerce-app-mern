const mongoose = require('mongoose');
const { Schema } = mongoose;

// order schema definition
const orderSchema = new Schema({
  cart: {
    type: Schema.Types.ObjectId,
    ref: 'Cart',
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  total: {
    type: Number,
    default: 0,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', orderSchema);
