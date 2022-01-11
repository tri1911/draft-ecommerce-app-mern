const mongoose = require('mongoose');
const { Schema } = mongoose;

const wishlistSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  isLiked: {
    type: Boolean,
    default: false,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WishList', wishlistSchema);
