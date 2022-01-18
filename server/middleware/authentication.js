const passport = require('passport');

const jwtAuth = passport.authenticate('jwt', { session: false });

module.exports = { jwtAuth };
