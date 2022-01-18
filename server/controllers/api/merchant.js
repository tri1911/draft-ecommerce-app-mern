/**
 * Required External Modules
 */

const express = require('express');
const Merchant = require('../../models/merchant');
const User = require('../../models/user');
const Brand = require('../../models/brand');
const mailgun = require('../../services/mailgun');
const { jwtAuth } = require('../../middleware/authentication');
const { ROLES, authorize } = require('../../middleware/authorization');
const crypto = require('crypto');
const { ApplicationError } = require('../../utils/customErrors');
const bcrypt = require('bcrypt');

/**
 * Router Definition
 */

const router = express.Router();

/**
 * Controller Definitions
 */

// add merchant
router.post('/seller-request', async (request, response) => {
  const { name, email, phone, brand, business } = request.body;
  const newMerchant = new Merchant({ name, email, phone, brand, business });
  const merchant = await newMerchant.save();
  mailgun.sendEmail(email, 'merchant-application');
  response.status(200).json({
    success: true,
    message: `We received your request! We will reach you via your phone number ${phone}`,
    merchant,
  });
});

// fetch all merchant infos - admin only
router.get(
  '/list',
  jwtAuthenticate,
  authorize(ROLES.admin),
  async (_request, response) => {
    const merchants = await Merchant.find({}).sort('-created');
    response.status(200).json({ merchants });
  }
);

// merchant approval update
router.put('/approve/:merchantId', jwtAuth, async (request, response) => {
  // get the merchantId from request body
  const merchantId = request.params.merchantId;
  // prepare update info
  const updateInfo = { status: 'Approved', isActive: true };
  // update the merchant document
  const updatedMerchant = await Merchant.findByIdAndUpdate(
    merchantId,
    updateInfo,
    { new: true }
  );
  // create user account for the merchant
  await generateMerchantUser(updatedMerchant, request.headers.host);
  // send response back to client
  response.status(200).json({ success: true });
});

// TODO: add token lifetime?
// sign up merchant's user account
router.post('signup/:token', async (request, response) => {
  // get user input from request body
  const { email, firstName, lastName, password } = request.body;
  // validate user input
  if (!email) throw new ApplicationError('email is required', 400);
  if (!firstName || !lastName)
    throw new ApplicationError('first and last name are required', 400);
  if (!password) throw new ApplicationError('password is required', 400);
  // search for user with matched token
  const user = await User.findOne({
    email,
    resetPasswordToken: request.params.token,
  });
  // handle not found user
  if (!user) throw new ApplicationError('token is invalid');
  // hash password before updating user infos
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  await User.findByIdAndUpdate(user._id, {
    email,
    firstName,
    lastName,
    passwordHash,
    resetPasswordToken: undefined,
  });
  // create brand document for merchant
  const merchant = await Merchant.findOne({ email });
  await generateMerchantBrand(merchant);
  // send response back to client
  response.status(200).json({ success: true });
});

// merchant rejection update
router.put('/reject/:merchantId', jwtAuth, async (request, response) => {
  await Merchant.findByIdAndUpdate(request.params.merchantId, {
    status: 'Rejected',
  });
  response.status(200).json({ success: true });
});

// delete merchant
router.delete(
  '/delete/:id',
  jwtAuth,
  authorize(ROLES.admin),
  async (request, response) => {
    const merchant = await Merchant.findByIdAndRemove(request.params.id);
    response.status(200).json({
      success: true,
      message: 'merchant has been removed successfully',
      merchant,
    });
  }
);

module.exports = router;

/**
 * helper methods
 */

// create method to create user account for the merchant based on the provided email
const generateMerchantUser = async (merchant, host) => {
  // note: email and merchant model share email field
  // if email the merchant provided matches the user exists in database, then update user
  // otherwise, create new user along with a token to let user create their own password later (do not create brand yet)
  const { email, name, _id: merchantId } = merchant;
  const user = await User.findOne({ email });
  if (user) {
    // update existing user info
    user.merchant = merchantId;
    user.role = ROLES.merchant;
    // send confirmation email
    await mailgun.sendEmail(email, 'merchant-welcome', null, name);
    // create merchant's brand
    await generateMerchantBrand(merchant);
    // save user and return added user
    return await user.save(); // or use findByIdAndUpdate
  } else {
    // generate the reset password token
    const resetPasswordToken = crypto.randomBytes(48).toString('hex');
    // create new user model object and save to database
    const newUser = new User({
      email,
      firstName: name,
      lastName: '',
      resetPasswordToken,
      merchant: merchantId,
      role: ROLES.merchant,
    });
    // send email to notify merchant/user install the account password
    await mailgun.sendEmail(email, 'merchant-signup', host, {
      resetToken,
      email,
    });
    // save user and return added user
    return await newUser.save();
  }
};

const generateMerchantBrand = async ({ _id, brand, business }) => {
  const brand = new Brand({
    name: brand,
    description: business,
    merchant: _id,
    isActive: false,
  });
  return await brand.save();
};
