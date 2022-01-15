/**
 * Required External Modules
 */

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const template = require('../utils/messageTemplate');
const { ApplicationError } = require('../utils/customErrors');
const config = require('config');

/**
 * Mail-gun Configuration
 */

const { apiKey, domain, sender } = config.get('mailgunConfig');

const mailgun = new Mailgun(formData);
const client = mailgun.client({ username: 'api', key: apiKey });

// export the sendEmail function
exports.sendEmail = async (email, type, host, data) => {
  try {
    const message = generateMessage(type, host, data);

    const messageData = {
      from: `Elliot Store <${sender}>`,
      to: email,
      subject: message.subject,
      text: message.text,
    };

    return await client.messages.create(domain, messageData);
  } catch (error) {
    throw new ApplicationError(`mailgun error: ${error.message}`, error.status);
  }
};

// helper function to generate message from template
const generateMessage = (type, host, data) => {
  let message;

  switch (type) {
    case 'reset':
      message = template.resetEmail(host, data);
      break;

    case 'password-changed-confirmation':
      message = template.confirmChangePasswordEmail();
      break;

    case 'signup':
      message = template.signupEmail(data);
      break;

    case 'merchant-signup':
      message = template.merchantSignup(host, data);
      break;

    case 'merchant-welcome':
      message = template.merchantWelcome(data);
      break;

    case 'newsletter-subscription':
      message = template.newsletterSubscriptionEmail();
      break;

    case 'contact':
      message = template.contactEmail();
      break;

    case 'merchant-application':
      message = template.merchantApplicationEmail();
      break;

    case 'order-confirmation':
      message = template.orderConfirmationEmail(data);
      break;

    default:
      message = '';
  }

  return message;
};
