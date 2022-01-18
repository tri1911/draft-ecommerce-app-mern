/**
 * Required External Modules
 */

const express = require('express');
const Contact = require('../../models/contact');
const { sendEmail } = require('../../services/mailgun');

/**
 * Router Definition
 */

const router = express.Router();

/**
 * Controller Definitions
 */

// add new contact message
router.post('/add', async (request, response) => {
  // extract user input
  const { name, email, message } = request.body;
  // create contact model object and save to the database
  const newContact = new Contact({ name, email, message });
  const contact = await newContact.save();
  // send confirmation email
  await sendEmail(email, 'contact');
  response.status(200).json({
    success: true,
    message: `we received your message, we will reach you via your email address ${email}`,
    contact,
  });
});

module.exports = router;
