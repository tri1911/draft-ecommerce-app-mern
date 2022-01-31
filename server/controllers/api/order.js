/**
 * Required External Modules
 */

const express = require('express');
const mongoose = require('mongoose');
const Order = require('../../models/order');
const { jwtAuth } = require('../../middleware/authentication');
const { sendEmail } = require('../../services/mailgun');
const { ROLES } = require('../../middleware/authorization');
const store = require('../../utils/store');
const cart = require('../../models/cart');

/**
 * Router Definition
 */

const router = express.Router();

/**
 * Controller Definitions
 */

// add new order
router.post('/add', jwtAuth, async (request, response) => {
  // extract cart id and total price from request body
  const user = request.user;
  const { cartId, total } = request.body;
  // create new order model object and save it into database
  const order = new Order({ cart: cartId, user: user._id, total });
  const savedOrder = await order.save();
  // send order confirmation email
  await sendEmail(user.email, 'order-confirmation', {
    orderId: savedOrder._id,
    user,
  });
  // respond to client
  response.status(200).json({
    success: true,
    message: 'order has been placed successfully',
    savedOrder,
  });
});

// search orders
router.get('/search', jwtAuth, async (request, response) => {
  const { search } = request.query;
  const user = request.user;
  let processedOrders = [];
  let returnedOrders = [];
  if (mongoose.Types.ObjectId.isValid(search)) {
    // find order by `search` query (and filtered by user id if the current user is not admin)
    if (user.role === ROLES.admin) {
      returnedOrders = await Order.find({
        _id: mongoose.Types.ObjectId(search),
      }).populate({
        path: 'cart',
        populate: { path: 'products.product', populate: 'brand' },
      });
    } else {
      returnedOrders = await Order.find({
        _id: mongoose.Types.ObjectId(search),
        user: user._id,
      }).populate({
        path: 'cart',
        populate: { path: 'products.product', populate: 'brand' },
      });
    }

    returnedOrders = returnedOrders.filter((order) => order.cart);
    // map returned order documents to new order object that includes products field and other tax-related properties
    if (returnedOrders.length > 0) {
      processedOrders = returnedOrders
        .map((order) => {
          return store.computeOrderTax({
            id: order._id,
            total: Number.parseFloat(order.total).toFixed(2),
            created: order.created,
            products: order.cart.products,
          });
        })
        .sort((a, b) => b.created - a.created);
    }
  }
  // respond to client
  response.status(200).json({ orders: processedOrders });
});

// fetch all orders
router.get('/', jwtAuth, async (request, response) => {
  const user = request.user;
});

// fetch order info by id
router.get('/:orderId', jwtAuth, async (request, response) => {
    
});

// remove order by id
router.delete('/cancel/:orderId', jwtAuth, async (request, response) => {});

// update order by id
router.put('/status/item/:itemId', jwtAuth, async (request, response) => {});

module.exports = router;

/**
 * Helper methods
 */
