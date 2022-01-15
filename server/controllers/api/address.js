/**
 * Required External Modules
 */

const express = require('express');
const Address = require('../../models/address');
const passport = require('passport');
const { ApplicationError } = require('../../utils/customErrors');

/**
 * Router Definition
 */

const router = express.Router();

/**
 * Controller Definitions
 */

// add new address request handler
router.post(
  '/add',
  passport.authenticate('jwt', { session: false }),
  async (request, response) => {
    const address = new Address(
      Object.assign(request.body, { user: request.user._id })
    );
    const address = await address.save();
    response.status(200).json({
      success: true,
      message: 'Address has been added successfully!',
      address,
    });
  }
);

// get all addresses of the current user
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (request, response) => {
    const addresses = await Address.find({ user: request.user._id });
    response.status(200).json({
      addresses,
    });
  }
);

// get an address by id
router.get('/:id', async (request, response) => {
  const addressId = request.params.id;
  const address = await Address.findById(addressId);

  if (!address) {
    return response.status(404).json({
      message: `Cannot found address with ${addressId}`,
    });
  }

  response.status(200).json({
    address,
  });
});

// update address
router.put('/:id', async (request, response) => {
  const addressId = request.params.id;
  const newAddress = request.body;

  await Address.findByIdAndUpdate(addressId, newAddress, { new: true });

  response.status(200).json({
    success: true,
    message: 'address has been updated successfully!',
  });
});

// delete address
router.delete('/delete/:id', async (request, response) => {
  const address = await Address.findByIdAndDelete(request.params.id);
  response.status(200).json({
    success: true,
    message: 'address has been removed successfully!',
    address,
  });
});

module.exports = router;
