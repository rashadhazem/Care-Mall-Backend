const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/productModel');
const User = require('./models/userModel');
const Store = require('./models/storeModel');
const Order = require('./models/orderModel');
const { filterData } = require('./services/filterService');

dotenv.config({ path: 'config.env' });

const dbConnection = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/Full-Ecommerce');
        console.log('DB Connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const runVerify = async () => {
    await dbConnection();

    try {
        // 1. Setup Mock Users and Vendor
        const vendor = new User({ _id: new mongoose.Types.ObjectId(), name: 'IsoVendor', role: 'vendor' });
        const user1 = new User({ _id: new mongoose.Types.ObjectId(), name: 'IsoUser1', role: 'user' });
        const user2 = new User({ _id: new mongoose.Types.ObjectId(), name: 'IsoUser2', role: 'user' });

        // 2. Setup Data
        const store = await Store.create({
            name: 'IsoStore', description: 'Iso Desc', owner: vendor._id
        });

        // Products
        const prod1 = await Product.create({
            title: 'IsoProd1', slug: 'iso-prod-1', description: 'desc', quantity: 10, price: 10,
            store: store._id, category: new mongoose.Types.ObjectId(), imageCover: { url: 'u', public_id: 'p' }
        });
        const prod2 = await Product.create({ // Different store/vendor product (conceptually) - actually let's make it unrelated
            title: 'OtherProd', slug: 'other-prod', description: 'desc', quantity: 10, price: 10,
            store: new mongoose.Types.ObjectId(), category: new mongoose.Types.ObjectId(), imageCover: { url: 'u', public_id: 'p' }
        });

        // Orders
        // Order 1: User 1 buys Prod 1 (IsoStore)
        const order1 = await Order.create({
            user: user1._id,
            cartItems: [{ product: prod1._id, quantity: 1, price: 10 }],
            totalOrderPrice: 10
        });

        // Order 2: User 2 buys Prod 2 (Other Store)
        const order2 = await Order.create({
            user: user2._id,
            cartItems: [{ product: prod2._id, quantity: 1, price: 10 }],
            totalOrderPrice: 10
        });

        const next = (err) => { if (err) console.error('Next Error:', err); };

        // TEST 1: User Isolation (User 1 should see Order 1)
        console.log('--- Test User Isolation ---');
        const reqUser = { user: user1, baseUrl: '/api/v1/orders' };
        await filterData(reqUser, {}, next);
        console.log('User Filter:', reqUser.filterObj);
        if (reqUser.filterObj.user && reqUser.filterObj.user.toString() === user1._id.toString()) {
            console.log('PASS: User filter is correct.');
        } else {
            console.error('FAIL: User filter incorrect.');
        }

        // TEST 2: Vendor Product Isolation (Vendor should filter by Store)
        console.log('--- Test Vendor Product Isolation ---');
        const reqVendorProd = { user: vendor, baseUrl: '/api/v1/products' };
        await filterData(reqVendorProd, {}, next);
        console.log('Vendor Prod Filter:', reqVendorProd.filterObj);
        if (reqVendorProd.filterObj.store && reqVendorProd.filterObj.store.toString() === store._id.toString()) {
            console.log('PASS: Vendor Product filter is correct.');
        } else {
            console.error('FAIL: Vendor Product filter incorrect.');
        }

        // TEST 3: Vendor Order Isolation (Vendor should see Order 1)
        console.log('--- Test Vendor Order Isolation ---');
        const reqVendorOrder = { user: vendor, baseUrl: '/api/v1/orders' };
        await filterData(reqVendorOrder, {}, next);
        console.log('Vendor Order Filter:', JSON.stringify(reqVendorOrder.filterObj));
        // Expecting { 'cartItems.product': { $in: [prod1._id] } }
        // Verify against DB
        const ordersFound = await Order.find(reqVendorOrder.filterObj);
        console.log('Orders Found for Vendor:', ordersFound.map(o => o._id));

        if (ordersFound.some(o => o._id.toString() === order1._id.toString()) &&
            !ordersFound.some(o => o._id.toString() === order2._id.toString())) {
            console.log('PASS: Vendor sees correct orders.');
        } else {
            console.error('FAIL: Vendor sees incorrect orders.');
        }

        // Cleanup
        await Store.findByIdAndDelete(store._id);
        await Product.deleteMany({ _id: { $in: [prod1._id, prod2._id] } });
        await Order.deleteMany({ _id: { $in: [order1._id, order2._id] } });

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

runVerify();
