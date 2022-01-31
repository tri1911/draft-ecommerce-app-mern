/**
 * Required External Modules
 */

const { ApplicationError } = require('../../utils/customErrors');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const {S3} = require('../../libs/aws');
const {s3access, s3bucketConfig} = require('../../config/s3');

const { model: Product, helpers } = require('../../models/product');
const Brand = require('../../models/brand');
const extractToken = require('../../utils/tokenExtractor');
const passport = require('passport');
const { ROLES, authorize } = require('../../middleware/authorization');

/**
 * Router Definition and Essential Variables
 */

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Controller Definitions
 */

// fetch individual product info by its slug
router.get('/item/:slug', async (request, response) => {
  const slug = request.params.slug;
  // retrieve the product doc
  const product = await Product.findOne({ slug, isActive: true }).populate({
    path: 'brand',
    select: 'name isActive slug',
  });
  // handle the not found product
  if (!product || !product.brand?.isActive)
    throw new ApplicationError('Product is not found', 404);
  // send response back to client
  response.status(200).json({ product });
});

// search product by name
router.get('/list/search/:name', async (request, response) => {
  const nameRegex = new RegExp(request.params.name);
  // retrieve product by name
  const products = await Product.find(
    { name: { $regex: nameRegex, $option: 'is' }, isActive: true },
    { name: 1, slug: 1, imageUrl: 1, price: 1, _id: 0 }
  );
  // handle not found product
  if (!products.length) throw new ApplicationError('No product found', 404);
  // send response to client
  response.status(200).json({ products });
});

// fetch products in store by advanced filters
router.post('/list', async (request, response) => {
  // extract filter values from request body - including sort, rating, price range, category and page number
  const {
    sortOrder,
    rating = 0,
    minPrice,
    maxPrice,
    category,
    pageNumber: page = 1,
  } = request.body;

  const filteredProducts = await helpers.listWithFilterAndPaging({
    sortOrder, 
    rating, 
    minPrice, 
    maxPrice, 
    category, 
    page: pageNumber, 
  });


  // respond to client - products, current page index, pages count, total products count
  response.status(200).json({
    products: filteredProducts,
    page,
    pagesCount:
      allProducts.length > 0 ? Math.ceil(allProducts.length / pageSize) : 0,
    productsInTotal: allProducts.length,
  });
});

// fetch products by brand slug
router.get('/list/brand/:slug', async (request, response) => {
  // find the brand document in database
  const slug = request.params.slug;
  const foundBrand = await Brand.findOne({ slug, isActive: true });
  // respond with proper error message if the brand is not found
  if (!foundBrand)
    throw new ApplicationError(`cannot find the brand with slug ${slug}`, 404);
  // if there exists a logged-in user, fetch isLiked state for products from wishlist collection as well
  // otherwise, fetch products based on brand as normal
  const currentUser = await extractToken(request);
  let products = [];
  if (currentUser) {
    products = await Product.aggregate([
      {
        $match: {
          brand: foundBrand._id,
          isActive: true,
        },
      },
      {
        $lookup: {
          from: 'wishlists',
          let: { product: '$_id' },
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ['$$product', '$product'] } },
                  { user: new mongoose.Types.ObjectId(user.id) },
                ],
              },
            },
          ],
          as: 'wishlists',
        },
      },
      {
        $addFields: {
          isLiked: { $arrayElemAt: ['$wishlists.isLiked', 0] },
          'brand.name': foundBrand.name,
          'brand.id': foundBrand._id,
          'brand.isActive': foundBrand.isActive,
        },
      },
      {
        $project: { wishlists: 0 },
      },
    ]);
  } else {
    products = await Product.find({
      brand: foundBrand._id,
      isActive: true,
    }).populate('brand', 'name');
  }
  // respond to the client
  // TODO: add pagination functionality
  response.status(200).json({
    products: products.reverse().slice(0, 8),
    page: 1,
    pages: products.length > 0 ? Math.ceil(products.length / 8) : 0,
    productsInTotal: products.length,
  });
});

// get list of product names (logged-in required)
router.get(
  '/list/select',
  passport.authenticate('jwt', { session: false }),
  async (_request, response) => {
    const products = await Product.find({}, 'name');
    response.status(200).json({ products });
  }
);

// upload new product to store
router.post(
  '/add',
  passport.authenticate('jwt', { session: false }),
  authorize(ROLES.admin, ROLES.merchant),
  upload.single('image'),
  async (request, response) => {
    // extract product infos
    const {
      sku,
      name,
      description,
      quantity,
      price,
      taxable,
      isActive,
      brand,
    } = request.body;
    // validate product infos
    if (!sku) throw new ApplicationError('sku is required', 400);
    if (!name || !description)
      throw new ApplicationError('name and description are required', 400);
    if (!quantity) throw new ApplicationError('quantity is required', 400);
    if (!price) throw new ApplicationError('price is required', 400);
    // upload the image to AWS server, which returns imageKey and imageURL
    let imageUrl = '';
    let imageKey = '';
    const image = request.file;
    // TODO: update the newest way to upload file to S3
    if (image) {
      const s3bucket = new S3(s3access);

      const params = {
        ...s3bucketConfig,
        Key: image.originalname,
        Body: image.buffer,
        contentType: image.mimetype,
        ACL: 'public-read',
      };

      const s3Upload = await s3bucket.upload(params).promise();

      imageUrl = s3Upload.Location;
      imageKey = s3Upload.Key;
    }
    // create product model object and save it to mongodb
    const product = new Product({
      sku,
      name,
      description,
      quantity,
      price,
      taxable,
      isActive,
      brand,
      imageUrl,
      imageKey,
    });
    const savedProduct = await product.save();
    // respond to client
    response.status(200).json({
      success: true,
      message: 'Product has been created successfully',
      product: savedProduct,
    });
  }
);

// get product infos (admin and merchant only)
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  authorize(ROLES.admin, ROLES.merchant),
  async (request, response) => {
    let products = [];
    // note: brand, user both keep reference to merchant id
    // if user is merchant, returns only his/her products
    if (request.user.merchant) {
      // fetch brands owned by the merchant (multiple brands ref to the same merchant)
      const brands = await Brand.find({ merchant: request.user.schema });
      // fetch all products filtered by brands
      products = await Product.find({
        brand: { $in: brands.map((brand) => brand._id) },
      }).populate({
        path: 'brand',
        populate: { path: 'merchant', model: 'Merchant' },
      });
    } else {
      // fetch all products & populate brand field & nested populate merchant
      products = await Product.find({}).populate({
        path: 'brand',
        populate: { path: 'merchant', model: 'Merchant' },
      });
    }
    // respond to client
    response.status(200).json({ products });
  }
);

// get product info by id (admin and merchant only)
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  authorize(ROLES.admin, ROLES.merchant),
  async (request, response) => {
    let product = null;
    if (request.user.merchant) {
      const brands = await Brand.find({ merchant: request.user.merchant });
      product = await Product.findOne({
        _id: request.params.id,
        brand: { $in: brands.map((brand) => brand._id) },
      }).populate('brand', 'name');
    } else {
      product = await Product.findById(request.params.id).populate(
        'brand',
        'name'
      );
    }
    if (!product) throw new ApplicationError('product is not found');
    response.status(200).json({ product });
  }
);

// update product info by its id
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  authorize(ROLES.admin, ROLES.merchant),
  async (request, response) => {
    const updatedProduct = await Product.findByIdAndUpdate(
      request.params.id,
      request.body,
      {
        new: true,
      }
    );
    response.status(200).json({
      success: true,
      message: 'product has been updated successfully',
      updatedProduct,
    });
  }
);

// delete product by id
router.delete(
  '/delete/:id',
  passport.authenticate('jwt', { session: false }),
  authorize(ROLES.admin, ROLES.merchant),
  async (request, response) => {
    const product = await Product.findByIdAndDelete(request.params.id);
    response.status(200).json({
      success: true,
      message: 'Product has been removed successfully',
      product,
    });
  }
);

module.exports = router;
