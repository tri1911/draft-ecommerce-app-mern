/**
 * Required External Modules
 */

const express = require('express');
const mailchimp = require('../../services/mailchimp');
const mailgun = require('../../services/mailgun');
const { ApplicationError } = require('../../utils/customErrors');

/**
 * Router Definition
 */

const router = express.Router();

/**
 * Controller Definitions
 */

router.post('/subscribe', async (request, response) => {
  const email = request.body.email;

  if (!email) throw new ApplicationError('email is missing', 400);

  // add the user's email into newsletter subscriptions list
  await mailchimp.subscribeNewsletter(email);
  // send confirmation email to user's email
  await mailgun.sendEmail(email, 'newsletter-subscription');

  response.status(200).json({
    success: true,
    message: 'You have successfully subscribed to the newsletter',
  });
});

module.exports = router;
