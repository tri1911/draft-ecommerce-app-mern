const Product = require('../models/product');
const { stateCode, stateName, stateTaxRate } = require('../config/tax');

// disable products
exports.disableProducts = async (products) => {
  const bulkOpts = products.map((product) => {
    return {
      updateOne: {
        filter: { _id: product._id },
        update: { isActive: false },
      },
    };
  });
  await Product.bulkWrite(bulkOpts);
};

// helper method to compute order's tax amount
// order: {id, total, created, products}
exports.computeOrderTax = (order) => {
  // additional infos to oder: total(Price), totalTax, totalPriceWithTax
  order.totalTax = 0;
  if (order.products && order.products.length > 0) {
    order.products.forEach((item) => {
      if (item.status !== 'Cancelled') {
        order.totalTax += item.totalTax;
      }
    });
  }
  order.total = order.products
    .filter((item) => item.status !== 'Cancelled')
    .reduce((sum, item) => sum + item.totalPrice, 0);
  order.priceWithTax = order.total + order.totalTax;
  // reformat properties
  order.totalTax = Number.parseFloat(order.totalTax).toFixed(2);
  order.total = Number.parseFloat(order.total).toFixed(2);
  order.priceWithTax = Number.parseFloat(order.priceWithTax).toFixed(2);
};

// compute items tax amount in cart
exports.computeItemsTax = (items) => {
  const products = items.map((item) => {
    // item object currently includes {price, quantity, taxable}
    const { price, quantity, taxable } = item;
    // initialize price & tax infos
    item.purchasePrice = price;
    item.totalPrice = 0;
    item.priceWithTax = 0;
    item.totalTax = 0;
    // total price without tax = price per item * quantity
    item.totalPrice = parseFloat(Number((price * quantity).toFixed(2)));
    // calculate tax amount per item = price  * tax rate
    if (taxable) {
      const taxAmount = price * stateTaxRate;
      // total tax for item = tax per item * quantity
      item.totalTax = parseFloat(Number((taxAmount * quantity).toFixed(2)));
      // total price with tax = total price w/o tax + total tax amount
      item.priceWithTax = parseFloat(
        Number((item.totalPrice + item.totalTax).toFixed(2))
      );
    }
    return item;
  });
  return products;
};
