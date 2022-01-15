/*
  This app use express-async-errors, so let the error middleware catch errors
  Handles all errors in a single place -> useful for reporting errors to an external error tracking system (like Sentry)
*/

const errorHandler = (error, _request, response, next) => {
  console.error(error.message, error.name, error.extra);

  switch (error.name) {
    case 'ApplicationError':
      return response.status(error.status).send({ error: error.message });
    case 'ValidationError': // Mongoose validation error handler
      return response.status(400).send({ error: error.message });
    case 'CastError':
      return response.status(400).send({ error: 'malformatted id' });
    case 'JsonWebTokenError':
      return response.status(401).send({ error: 'invalid token' });
    case 'TokenExpireError':
      return response.status(401).send({ error: 'token expired' });
    default:
      response.status(500).send({ error: error.message });
      next(error);
  }
};

module.exports = errorHandler;
