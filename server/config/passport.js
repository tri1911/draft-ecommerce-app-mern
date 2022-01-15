const passport = require('passport');
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const config = require('config');

const User = require('../models/user');

// configuration options for jwt strategy
const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.get('jwtConfig.secret');

// supply the strategy to passport
passport.use(
  new JWTStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload.id);
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      done(error, false);
    }
  })
);

module.exports = (app) => {
  app.use(passport.initialize());
};

// TODO: integrates OAuth Google & Facebook Strategies into passport
