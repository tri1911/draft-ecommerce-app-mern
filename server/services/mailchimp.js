const mailchimp = require('@mailchimp/mailchimp_marketing');
const { ApplicationError } = require('../utils/customErrors');
const config = require('config');

const { apiKey, listId } = config.get('mailchimpConfig');

mailchimp.setConfig({
  apiKey,
  server: apiKey.split('-')[1],
});

exports.subscribeNewsletter = async (email) => {
  try {
    return await mailchimp.lists.addListMember(listId, {
      email_address: email,
      status: 'subscribed',
    });
  } catch (error) {
    const errorBody = error.response.body;
    throw new ApplicationError(errorBody.detail, errorBody.status);
  }
};
