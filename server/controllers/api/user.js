/**
 * Required External Modules
 */

const express = require('express');
const passport = require('passport');
const User = require('../../models/user');
const { ROLES, authorize } = require('../../middleware/authorization');

/**
 * Router Definition
 */

const router = express.Router();

/**
 * Controller Definitions
 */

// searching users info request handler (admin only)
router.get(
  '/search',
  passport.authenticate('jwt', { session: false }),
  authorize(ROLES.admin),
  async (request, response) => {
    const { search } = request.query;
    // create regex object
    const regex = new RegExp(search, 'i');
    // retrieve user documents matching regex pattern
    const users = await User.find(
      {
        $or: [
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
          { email: { $regex: regex } },
        ],
      },
      { passwordHash: 0, _id: 0 }
    ).populate('merchant', 'name');
    // send response to client
    response.status(200).json({ users });
  }
);

// get user info request handler
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (request, response) => {
    const user = await User.findById(request.user._id, { passwordHash: 0 });
    response.status(200).json({ user });
  }
);

// update user info request handler
router.put(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (request, response) => {
    const updateInfo = request.body.profile;

    const user = await User.findByIdAndUpdate(request.user._id, updateInfo, {
      new: true,
    });

    response.status(200).json({
      success: true,
      message: 'user profile has been updated successfully',
      user,
    });
  }
);

module.exports = router;
