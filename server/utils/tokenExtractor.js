const jwt = require('jsonwebtoken');

const extractToken = async (request) => {
  try {
    if (!request.headers.authorization) {
      return null;
    }

    const decodedToken = await jwt.decode(
      request.headers.authorization.split(' ')[1]
    );

    if (!decodedToken) {
      return null;
    }

    return decodedToken;
  } catch (error) {
    return null;
  }
};

module.exports = extractToken;
