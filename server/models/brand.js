const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = mongoose;

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120,
};

mongoose.plugin(slug, options);

// brand schema definition
const brandSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true,
  },
  image: {
    data: Buffer,
    contentType: String,
  },
  description: {
    type: String,
    trim: true,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  merchant: {
    type: Schema.Types.ObjectId,
    ref: 'Merchant',
    default: null,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Brand', brandSchema);
