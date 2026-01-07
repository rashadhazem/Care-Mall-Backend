const factory = require('./handlersFactory');
const Coupon = require('../models/couponModel');

const Store = require('../models/storeModel');
const Product = require('../models/productModel');
const ApiError = require('../utils/apiError');

// @desc    Get list of coupons
// @route   GET /api/v1/coupons
// @access  Private/Admin-Manager
exports.getCoupons = asyncHandler(async (req, res, next) => {
    if (req.user.role === 'vendor') {
        const store = await Store.findOne({ owner: req.user._id });
        if (store) {
            req.filterObj = { store: store._id };
        } else {
            req.filterObj = { store: null }; // Return nothing if no store
        }
    }
    factory.getAll(Coupon)(req, res, next);
});

// @desc    Get specific coupon by id
// @route   GET /api/v1/coupons/:id
// @access  Private/Admin-Manager
exports.getCoupon = factory.getOne(Coupon);

// @desc    Create coupon
// @route   POST  /api/v1/coupons
// @access  Private/Admin-Manager
exports.createCoupon = asyncHandler(async (req, res, next) => {
    if (req.user.role === 'vendor') {
        const store = await Store.findOne({ owner: req.user._id });
        if (!store) {
            return next(
                new ApiError('You do not have a store to create coupons', 400)
            );
        }
        req.body.store = store._id;

        // Verify product ownership if product is provided
        if (req.body.product) {
            const product = await Product.findOne({
                _id: req.body.product,
                store: store._id,
            });
            if (!product) {
                return next(
                    new ApiError('Product not found or does not belong to your store', 400)
                );
            }
        }
    }
    factory.createOne(Coupon)(req, res, next);
});

// @desc    Update specific coupon
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin-Manager
exports.updateCoupon = factory.updateOne(Coupon);

// @desc    Delete specific coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin-Manager
exports.deleteCoupon = factory.deleteOne(Coupon);
