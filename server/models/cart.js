const mongoose = require('mongoose');
const { Schema } = mongoose;

// individual cart item schema definition
const cartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
  quantity: Number,
  purchasePrice: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
  priceWithTax: {
    type: Number,
    default: 0,
  },
  totalTax: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    default: 'Not processed',
    enum: ['Not processed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
  },
});

module.exports = mongoose.model('CartItem', cartItemSchema);

// cart schema definition
const cartSchema = new Schema({
  products: [cartItemSchema],
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Cart', cartSchema);
