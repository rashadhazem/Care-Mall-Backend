const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Store = require('../models/storeModel');
const ApiError = require('../utils/apiError');

// @desc    Get Admin Stats
// @route   GET /api/v1/stats/admin
// @access  Protected/Admin
exports.getAdminStats = asyncHandler(async (req, res, next) => {
    const users = await User.countDocuments({ role: 'user' });
    const orders = await Order.countDocuments();
    const products = await Product.countDocuments();
    const stores = await Store.countDocuments();
    const vendors = await User.countDocuments({ role: 'vendor' });

    // Calculate total sales/revenue (simple sum of totalOrderPrice)
    const salesData = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalOrderPrice" }
            }
        }
    ]);
    const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;

    res.status(200).json({
        users,
        orders,
        products,
        stores,
        totalSales
        ,vendors
    });
});

// @desc    Get Vendor Stats
// @route   GET /api/v1/stats/vendor
// @access  Protected/Vendor
exports.getVendorStats = asyncHandler(async (req, res, next) => {
    // 1. Find the store owned by this vendor
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
        return next(new ApiError('Store not found for this vendor', 404));
    }

    // 2. Count Products
    const products = await Product.countDocuments({ store: store._id });

    // 3. Calculate Orders and Revenue for this store
    // We need to look at Orders -> cartItems -> product -> store
    const stats = await Order.aggregate([
        // Unwind cart items to treat each item individually
        { $unwind: "$cartItems" },
        // Lookup product details for each item to check the store
        {
            $lookup: {
                from: "products",
                localField: "cartItems.product",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        // Unwind product details (lookup returns an array)
        { $unwind: "$productDetails" },
        // Filter items that belong to this store
        { $match: { "productDetails.store": store._id } },
        {
            $group:{
                _id:{
                    orderId:"$_id",
                    month:{$month:"$createdAt"},
                    year:{$year:"$createdAt"}

                },
                orderRevenue:{
                    $sum:{
                        $multiply:["$cartItems.price","$cartItems.quantity"]
                    }
                },
                soldProducts:{
                    $sum:"$cartItems.quantity"
                }
            }
        },{
            $group:{
                _id:{
                    month:"$_id.month",
                    year:"$_id.year"
                },
                revenue:{
                    $sum:"$orderRevenue"
                },
                orders:{$sum:1},
                soldProducts:{
                    $sum:"$soldProducts"
                }
              
            }
        },

       {$sort:{
        "_id.year":1,
        "_id.month":1 
       }}
    ]);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthlySales = stats.map(item => ({
        month: monthNames[item._id.month - 1],
        revenue: item.revenue
    }));

    const totalRevenue = stats.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = stats.reduce((sum, item) => sum + item.orders, 0);
    const soldProducts = stats.reduce((sum, item) => sum + item.soldProducts, 0);

    res.status(200).json({
        storeName: store.name,
        products,
        orders: totalOrders,
        revenue: totalRevenue,
        soldProducts: soldProducts,
        monthlySales
    });
});
