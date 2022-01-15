const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const uniqueValidator = require('mongoose-unique-validator');
const { Schema } = mongoose;

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120,
};

mongoose.plugin(slug, options);

// product schema definition
const productSchema = new Schema({
  sku: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true,
  },
  imageUrl: {
    type: String,
  },
  imageKey: {
    type: String,
  },
  description: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
  },
  price: {
    type: Number,
  },
  taxable: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    default: null,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Product', productSchema);
