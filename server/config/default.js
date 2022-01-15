require('dotenv').config(); // Zero-dependency module that loads environment variables from a .env file into process.env

module.exports = {
  app: {
    name: 'Elliot Store',
    apiBaseUrl: process.env.API_BASE_URL,
  },
  port: process.env.PORT || 3001,
  mongoDBUri: process.env.MONGODB_URI,
  jwtConfig: {
    secret: process.env.JWT_SECRET,
    tokenLife: '7d',
  },
  mailchimpConfig: {
    apiKey: process.env.MAILCHIMP_API_KEY,
    listId: process.env.MAILCHIMP_LIST_ID,
  },
  mailgunConfig: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    sender: process.env.MAILGUN_EMAIL_SENDER,
  },
};
