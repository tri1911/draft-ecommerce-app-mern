const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const uniqueValidator = require('mongoose-unique-validator');
const { Schema } = mongoose;
const Category = require('../../models/category');

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120,
};

mongoose.plugin(slug, options);

// product schema definition
const productSchema = new Schema({
  sku: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true,
  },
  imageUrl: {
    type: String,
  },
  imageKey: {
    type: String,
  },
  description: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
  },
  price: {
    type: Number,
  },
  taxable: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    default: null,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

userSchema.plugin(uniqueValidator);

const Product = mongoose.model('Product', productSchema);

/**
 * GY: I transplanted the whole logic from api/product to here
 * - it's prefereable for API layer to stay slim because these
 *   data access logic may be shared in other components (e.g 
 *   a cmd line tool to export products) 
 * - this is an example of separation of concern
 *   - API should handle request and VALIDATE the arguments frontend provided
 *     - So Mongoose should not show up directly in API (except really trivial cases)
 *     - it should validate ALL parameters before passing to the logic
 *       - i.e. `sortOrder` must by -1 or 1
 *   - Data access component should worry about fetching data
 *     - it should not have to worry about whether `sortOrder` is 1 or -1
 */
// GY: I decide not to refactor the logic inside to just illustrate separation
//     of concern
async function listWithFilterAndPaging({
  sortOrder, 
  rating,
  minPrice,
  maxPrice,
  category,
  page = 1,
  pageSize = 8,
}) {
  // generate filter objects which will be used in query object
  const pageSize = 8; // each page presents only 8 items
  const priceFilter =
    minPrice && maxPrice ? { $gte: minPrice, $lte: maxPrice } : {};
  const ratingFilter = { $gte: rating };
  // generate the basic query that outer join with `brands` and `reviews` collections
  //    left join with `brands` collection as `brands` array field
  //    filter only active brand
  //    left join with `reviews` collection as `reviews` array field
  //    from review documents, add fields total ratings, total reviews, and average rating
  //    filter only active products & within `price range` + `average rating range`
  //    excludes brands and reviews array fields
  const basicQuery = [
    {
      $lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brands',
      },
    },
    {
      $unwind: {
        path: '$brands',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        'brand.name': '$brands.name',
        'brand.id': '$brands._id',
        'brand.isActive': '$brands.isActive',
      },
    },
    {
      $match: {
        'brand.isActive': true,
      },
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'product',
        as: 'reviews',
      },
    },
    {
      $addFields: {
        totalRatings: { $sum: 'reviews.rating' },
        totalReviews: { $size: 'reviews' },
      },
    },
    {
      $addFields: {
        averageRating: {
          $cond: [
            { $eq: ['$totalReviews', 0] },
            0,
            { $divide: ['$totalRatings', '$totalReviews'] },
          ],
        },
      },
    },
    {
      $match: {
        isActive: true,
        price: priceFilter,
        averageRating: ratingFilter,
      },
    },
    {
      $project: {
        brands: 0,
        reviews: 0,
      },
    },
  ];
  // if category filter is selected, filter products within that category only
  if (category) {
    const catDoc = await Category.findOne(
      { slug: category, isActive: true },
      'products -id'
    );
    if (!catDoc) {
      basicQuery.push({
        $match: {
          _id: {
            $in: Array.from(catDoc.products),
          },
        },
      });
    }
  }
  // if there exists logged-in user
  //    look up `reviews` collection to add field `isLiked` to products
  const user = await extractToken(request);
  if (user) {
    basicQuery = [
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
        $addFields: { isLiked: { $arrayElemAt: ['$wishlists.isLiked', 0] } },
      },
      ...basicQuery,
    ];
  }
  // fetch products with basic query
  const allProducts = await Product.aggregate(basicQuery);
  // generate `paginate query` including sort order, skip, limit
  const paginateQuery = [
    { $sort: sortOrder },
    { $skip: pageSize * (allProducts.length > 8 ? page - 1 : 0) },
    { $limit: pageSize },
  ];
  // fetch filtered products to present to current page with `basic query + paginate query`
  const filteredProducts = await Product.aggregate([
    ...basicQuery,
    ...paginateQuery,
  ]);

  return filteredProducts;
};

const helpers = {
  listWithFilterAndPaging,
};

module.exports = {
  model: Product,
  helpers,
};
  
