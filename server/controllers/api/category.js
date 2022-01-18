/**
 * Required External Modules
 */

const express = require('express');
const Category = require('../../models/category');
const passport = require('passport');
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

// add category - admin only
router.post(
  '/add',
  passport.authenticate('jwt', { session: false }),
  authorize(ROLES.admin),
  async (request, response) => {
    // extract input from request body
    const { name, description, products, isActive } = request.body;
    // create category model object and save to database
    const category = new Category({
      name,
      description,
      products,
      isActive,
    });
    const addedCategory = await category.save();
    // respond to client
    response.status(200).json({
      success: true,
      message: 'Category has been added successfully',
      addedCategory,
    });
  }
);

// get the list of active categories
router.get('/list', async (_request, response) => {
  const categories = await Category.find({ isActive: true });
  response.status(200).json({ categories });
});

// get all categories
router.get('/', async (_request, response) => {
  const categories = await Category.find({});
  response.status(200).json({ categories });
});

// get a specific category by id
router.get('/:id', async (request, response) => {
  const category = await Category.findById(request.params.id).populate(
    'products',
    'name'
  );

  if (!category) throw new ApplicationError('cannot find the category', 404);

  response.status(200).json({ category });
});

// update category by id - admin only
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  authorize(ROLES.admin),
  async (request, response) => {
    const updatedCategory = await Category.findByIdAndUpdate(
      request.params.id,
      request.body.category,
      { new: true }
    );
    response.status(200).json({
      success: true,
      message: 'category has been updated successfully',
      updatedCategory,
    });
  }
);

// update category by id & disable products if category is disabled - admin only
router.put(
  '/:id/active',
  passport.authenticate('jwt', { session: false }),
  authorize(ROLES.admin),
  async (request, response) => {
    const categoryId = request.params.id;
    const updateInfo = request.body.category;

    // disable products in category if it is inactive
    if (!updateInfo.isActive) {
      const category = await Category.findOne(
        { _id: categoryId, isActive: true },
        'products -_id'
      ).populate('products');
      await store.disableProducts(category.products);
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      updateInfo,
      { new: true }
    );

    response.status(200).json({
      success: true,
      message: 'category has been updated successfully',
      updatedCategory,
    });
  }
);

// remove the category by id
router.delete(
  '/delete/:id',
  passport.authenticate('jwt', { session: false }),
  ROLES.admin,
  async (request, response) => {
    const removedCategory = await Category.findByIdAndRemove(request.params.id);
    response.status(200).json({
      success: true,
      message: 'category has been removed successfully',
      removedCategory,
    });
  }
);

module.exports = router;
