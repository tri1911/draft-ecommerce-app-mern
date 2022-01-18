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

// category schema definition
const categorySchema = new Schema({
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
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
  ],
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Category', categorySchema);
