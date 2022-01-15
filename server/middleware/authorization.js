const { ApplicationError } = require('../utils/customErrors');

// list of roles
const ROLES = {
  customer: 'ROLE_MEMBER',
  admin: 'ROLE_ADMIN',
  merchant: 'ROLE_MERCHANT',
};

// function to authorize user
const authorize =
  (...roles) =>
  (request, _response, next) => {
    // check user authentication
    if (!request.user) throw new ApplicationError('Unauthorized', 401);
    // check user authorization
    if (!roles.includes(request.user.role))
      throw new ApplicationError(
        'You are not allowed to make this request',
        403
      );
    // if all checks are passed, yields the control to the next middleware
    next();
  };

module.exports = { ROLES, authorize };
