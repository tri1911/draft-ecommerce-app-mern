const mongoose = require('mongoose');
const { Schema } = mongoose;

// user schema definition
const userSchema = new Schema({
  email: {
    type: String,
    required: () => (this.provider !== 'email' ? false : true),
  },
  phone: {
    type: String,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  passwordHash: {
    type: String,
  },
  merchant: {
    type: Schema.Types.ObjectId,
    ref: 'Merchant',
    default: null,
  },
  provider: {
    type: String,
    required: true,
    default: 'email',
  },
  googleId: {
    type: String,
  },
  facebookId: {
    type: String,
  },
  avatar: {
    type: String,
  },
  role: {
    type: String,
    default: 'ROLE_MEMBER',
    enum: ['ROLE_MEMBER', 'ROLE_ADMIN', 'ROLE_MERCHANT'],
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
