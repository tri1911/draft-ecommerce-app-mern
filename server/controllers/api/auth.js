/**
 * Required External Modules
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const { ApplicationError } = require('../../utils/customErrors');
const mailchimp = require('../../services/mailchimp');
const mailgun = require('../../services/mailgun');
const crypto = require('crypto');
const passport = require('passport');
const config = require('config');

const { secret, tokenLife } = config.get('jwtConfig');

/**
 * Router Definition
 */

const router = express.Router();

/**
 * Controller Definitions
 */

// login request handler
router.post('/login', async (request, response) => {
  // extract email & password from incoming request body
  const { email, password } = request.body;
  // validate user input
  if (!email) throw new ApplicationError('email is required', 400);
  if (!password) throw new ApplicationError('password is required', 400);
  // retrieve user document from database
  const user = await User.findOne({ email });
  if (!user) throw new ApplicationError('invalid email', 401);
  // verify the input password with user's hashed password
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  // if fail, throw error with proper message
  if (!validPassword) throw new ApplicationError('invalid password', 401);
  // if successfully verified, create json web token and send successful response to client
  const jwt_payload = { id: user._id };
  const token = jwt.sign(jwt_payload, secret, { expiresIn: tokenLife });
  response.status(200).json({
    token: `Bearer ${token}`,
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  });
});

// registration request handler
router.post('/register', async (request, response) => {
  const { email, firstName, lastName, password, isSubscribed } = request.body;
  // validate user input
  if (!email) throw new ApplicationError('email is required');
  if (!firstName || !lastName)
    throw new ApplicationError('full name is required');
  if (!password) throw new ApplicationError('password is required');
  // if user chooses subscribe button, add his/her email into the newsletter subscription list
  let subscribed = false;
  if (isSubscribed) {
    const response = await mailchimp.subscribeNewsletter(email);
    subscribed = response.status === 'subscribed';
  }
  // encrypt password, then create user document in database
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const user = new User({
    email,
    passwordHash,
    firstName,
    lastName,
  });
  const savedUser = await user.save();
  // send confirmation email for the successful registration
  await mailgun.sendEmail(savedUser.email, 'signup', null, savedUser);
  // create token & respond to client with that token in addition to user infos
  const jwt_payload = { id: user._id };
  const token = jwt.sign(jwt_payload, secret, { expiresIn: tokenLife });
  response.status(200).json({
    subscribed,
    token: `Bearer ${token}`,
    user: {
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      role: savedUser.role,
    },
  });
});

// forget password request handler
router.post('/forgot', async (request, response) => {
  const { email } = request.body;
  // validate user input
  if (!email) throw new ApplicationError('email is required', 400);
  // verify the email existence in database
  const user = await User.findOne({ email });
  if (!user)
    throw new ApplicationError('email does not exist in database', 400);
  // generate resetToken and set into the email document
  user.resetPasswordToken = crypto.randomBytes(48).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();
  // send email including reset link to client's email
  await mailgun.sendEmail(
    user.email,
    'reset',
    request.headers.host,
    user.resetPasswordToken
  );
  // respond to client to let he/she know what to do next
  response.status(200).json({
    success: true,
    message: 'Please check you email for the link to reset your password.',
  });
});

// reset password with token request handler
router.post('/reset/:token', async (request, response) => {
  const { password } = request.body;
  // validate user input
  if (!password) throw new ApplicationError('password is required', 400);
  // retrieve the user document based on token infos
  const user = await User.findOne({
    resetPasswordToken: request.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    throw new ApplicationError(
      'The reset token is expired. Please attempt to reset your password again.',
      400
    );
  }
  // encrypt the password and update user
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  // send email confirmation
  await mailgun.sendEmail(user.email, 'reset-confirmation');
  // respond to client
  response.status(200).json({
    success: true,
    message:
      'Password changed successfully. Please login with your new password.',
  });
});

// reset password request handler
router.post(
  '/change-password',
  passport.authenticate('jwt', { session: false }),
  async (request, response) => {
    const currentUser = await User.findOne({ email: request.user.email });
    if (!currentUser) throw new ApplicationError('cannot find the user', 400);
    const { oldPassword, newPassword } = request.body;
    // validate user input
    if (!oldPassword || !newPassword) {
      throw new ApplicationError(
        'both old and new passwords are required',
        400
      );
    }
    // verify the old password
    const isCorrectPassword = await bcrypt.compare(
      oldPassword,
      currentUser.passwordHash
    );
    if (!isCorrectPassword)
      throw new ApplicationError('Password is mismatched', 400);
    // hash the new password and update user info
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);
    currentUser.passwordHash = newPasswordHash;
    await currentUser.save();
    // send confirmation email to user's email
    await mailgun.sendEmail(currentUser.email, 'password-changed-confirmation');
    // respond to the client
    response.status(200).json({
      success: true,
      message:
        'Password changed successfully. Please login with your new password.',
    });
  }
);

module.exports = router;

// TODO: implement OAuth Google and Facebook authentication
