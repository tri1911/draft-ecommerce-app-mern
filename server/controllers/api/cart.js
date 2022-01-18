/**
 * Required External Modules
 */

const express = require('express');
const Cart = require('../../models/cart');
const Product = require('../../models/product');
const store = require('../../utils/store');
const { jwtAuth } = require('../../middleware/authentication');

/**
 * Router Definition
 */

const router = express.Router();

/**
 * Controller Definitions
 */

// add new cart
router.post('/add', jwtAuth, async (request, response) => {
  // calculate prices and taxes fields to each item
  const products = store.computeItemsTax(request.body.products);
  // create new cart model object and save into database
  const cart = new Cart({ products, user: request.user._id });
  const addedCart = await cart.save();
  // update products' quantity in stock
  updateStock(products);
  // respond to client
  response.status(200).json({ success: true, cartId: addedCart._id });
});

// remove cart
router.delete('/delete/:cartId', jwtAuth, async (request, response) => {
  await Cart.findByIdAndRemove(request.params.cartId);
  response.status(200).json({ success: true });
});

// add new item to the cart
router.post('/add/:cartId', jwtAuth, async (request, response) => {
  await Cart.updateOne(
    { _id: request.params.cartId },
    { $push: { products: request.body.product } }
  );
  response.status(200).json({ success: true });
});

// remove item from a specific cart
router.delete(
  '/delete/:cartId/:productId',
  jwtAuth,
  async (request, response) => {
    await Cart.updateOne(
      { _id: request.params.cartId },
      { $pull: { products: { product: request.params.productId } } }
    );
    response.status(200).json({ success: true });
  }
);

module.exports = router;

/**
 * Helper Methods
 */

// update the number of products in stock
const updateStock = (items) => {
  let bulkOpts = items.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity } },
      },
    };
  });

  Product.bulkWrite(bulkOpts);
};
