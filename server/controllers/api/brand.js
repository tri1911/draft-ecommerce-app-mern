/**
 * Required External Modules
 */

const express = require('express');
const Brand = require('../../models/brand');
const Product = require('../../models/product');
const { jwtAuth } = require('../../middleware/authentication');
const { ROLES, authorize } = require('../../middleware/authorization');
const { ApplicationError } = require('../../utils/customErrors');
const store = require('../../utils/store');

/**
 * Router Definition
 */

const router = express.Router();

/**
 * Controller Definitions
 */

// add new brand - admin only
router.post(
  '/add',
  jwtAuth,
  authorize(ROLES.admin),
  async (request, response) => {
    const { name, description, isActive } = request.body;
    const brand = new Brand({ name, description, isActive });
    const savedBrand = await brand.save();
    response.status(200).json({
      success: true,
      message: 'the brand has been added successfully',
      brand: savedBrand,
    });
  }
);

// fetch brands to present active brand list
router.get('/list', async (_request, response) => {
  const brands = await Brand.find({ isActive: true }).populate(
    'merchant',
    'name'
  );
  response.status(200).json({ brands });
});

// fetch all brands infos - admin & merchant only
router.get(
  '/',
  jwtAuth,
  authorize(ROLES.admin, ROLES.merchant),
  async (request, response) => {
    let brands = [];
    if (request.user.merchant) {
      brands = await Brand.find({ merchant: request.user.merchant }).populate(
        'merchant',
        'name'
      );
    } else {
      brands = await Brand.find({}).populate('merchant', 'name');
    }
    response.status(200).json({ brands });
  }
);

// fetch brand info by id
router.get('/:id', async (request, response) => {
  const brand = await Brand.findById(request.params.id);
  if (!brand)
    throw new ApplicationError(
      `the brand with ${request.params.id} is not found`,
      404
    );
  response.status(200).json({ brand });
});

// fetch list of brands (get name field only)
router.get(
  '/list/select',
  jwtAuth,
  authorize(ROLES.admin, ROLES.merchant),
  async (request, response) => {
    const merchant = request.user.merchant;
    const filterOption = merchant ? { merchant } : {};
    const brands = await Brand.find(filterOption);
    response.status(200).json({ brands });
  }
);

// update brand by id
router.put(
  '/:id',
  jwtAuth,
  authorize(ROLES.admin, ROLES.merchant),
  async (request, response) => {
    const brandId = request.params.id;
    const updateInfo = request.body.brand;
    const updatedBrand = await Brand.findByIdAndUpdate(brandId, updateInfo, {
      new: true,
    });
    response.status(200).json({
      success: true,
      message: 'brand has been updated successfully',
      updatedBrand,
    });
  }
);

// update brand - disable products if the brand is updated to inactive - admin and merchant only
router.put(
  '/:id/active',
  jwtAuth,
  authorize(ROLES.admin, ROLES.merchant),
  async (request, response) => {
    const brandId = request.params.id;
    const updateInfo = request.body.brand;
    // if brand is updated to inactive
    if (!updateInfo.isActive) {
      const products = await Product.find({ brand: brandId });
      store.disableProducts(products);
    }

    const updatedBrand = await Brand.findByIdAndUpdate(brandId, updateInfo, {
      new: true,
    });
    response.status(200).json({
      success: true,
      message: 'brand has been updated successfully',
      updatedBrand,
    });
  }
);

// remove brand by id - admin only
router.delete(
  '/delete/:id',
  jwtAuth,
  authorize(ROLES.admin, ROLES.merchant),
  async (request, response) => {
    const brand = await Brand.findByIdAndRemove(request.params.id);
    response.status(200).json({
      success: true,
      message: 'brand has been removed successfully',
      brand,
    });
  }
);

module.exports = router;
