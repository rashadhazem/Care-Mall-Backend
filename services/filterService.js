const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Store = require('../models/storeModel');
const Product = require('../models/productModel');

/**
 * @desc    Middleware to filter data based on user role
 *          - Vendors: See only their products and orders containing their products
 *          - Users: See only their own orders
 *          - Admins/Managers: See everything
 */
exports.filterData = asyncHandler(async (req, res, next) => {
    let filterObj = {};

    // 1. Vendor Logic
    if (req.user.role === 'vendor') {
        const store = await Store.findOne({ owner: req.user._id });
        if (!store) {
            // If vendor has no store, they shouldn't see any store-related data
            // We can either return error or empty filter causing empty result (if querying store items)
            // Ideally, they see empty list.
            // For now, let's assume if they are checking products/orders they expect store data.
            // If we return empty filter {}, they see ALL data which is BAD.
            // So we must force a filter that returns nothing if no store.
            // But simpler to return error "Store not found".
            // However, to avoid blocking flow for non-store-related actions (if any), let's set a dummy filter.
            // Actually, best to just return nothing.
            // Let's set a filter that matches nothing.
            req.filterObj = { _id: null };
            return next();
        }

        // Check which resource is being accessed to decide filter strategy
        // We can inspect baseUrl or route to know if it's products or orders
        const isOrderRoute = req.baseUrl.includes('orders');
        const isProductRoute = req.baseUrl.includes('products');

        if (isProductRoute) {
            filterObj = { store: store._id };
        } else if (isOrderRoute) {
            // Find all products by this store
            const products = await Product.find({ store: store._id }).select('_id');
            const productIds = products.map(p => p._id);

            // Filter orders that contain ANY of these products
            // Order schema: cartItems: [ { product: ObjectId, ... } ]
            filterObj = { 'cartItems.product': { $in: productIds } };
        }
    }
    // 2. User Logic
    else if (req.user.role === 'user') {
        const isOrderRoute = req.baseUrl.includes('orders');
        if (isOrderRoute) {
            filterObj = { user: req.user._id };
        }
    }

    // 3. Admin/Manager Logic
    // No filter needed, they see all (or use existing query params)

    req.filterObj = filterObj;
    next();
});
