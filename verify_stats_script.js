const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/productModel');
const User = require('./models/userModel');
const Store = require('./models/storeModel');
const Order = require('./models/orderModel');
const { getAdminStats, getVendorStats } = require('./services/statsService');

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
        // 1. Setup Mock Admin and Vendor
        const admin = new User({ _id: new mongoose.Types.ObjectId(), name: 'MockAdmin', role: 'admin' });
        const vendor = new User({ _id: new mongoose.Types.ObjectId(), name: 'MockVendor', role: 'vendor' });

        // 2. Setup Data for Vendor
        const store = await Store.create({
            name: 'StatsTestStore',
            description: 'Test Store for Stats',
            owner: vendor._id
        });

        const product = await Product.create({
            title: 'StatsTestProduct',
            slug: 'stats-test-product',
            description: 'Description for stats test product',
            quantity: 100,
            price: 50,
            store: store._id,
            category: new mongoose.Types.ObjectId(), // Fake ID
            imageCover: {
                url: 'http://test.com/image.jpg',
                public_id: '123'
            }
        });

        const order = await Order.create({
            user: new mongoose.Types.ObjectId(), // Fake User
            cartItems: [{
                product: product._id,
                quantity: 2,
                price: 50,
                color: 'red'
            }],
            totalOrderPrice: 100
        });

        // 3. Test Admin Stats
        const adminReq = { user: admin };
        const adminRes = {
            status: (code) => ({
                json: (data) => {
                    console.log('Admin Stats Result:', JSON.stringify(data, null, 2));
                    if (data.stores >= 1 && data.orders >= 1 && data.totalSales >= 100) {
                        console.log('PASS: Admin Stats seem correct (non-zero).');
                    } else {
                        console.error('FAIL: Admin Stats seem empty or incorrect.');
                    }
                }
            })
        };
        const next = (err) => console.error('Next Error:', err);

        console.log('--- Testing Admin Stats ---');
        await getAdminStats(adminReq, adminRes, next);


        // 4. Test Vendor Stats
        const vendorReq = { user: vendor };
        const vendorRes = {
            status: (code) => ({
                json: (data) => {
                    console.log('Vendor Stats Result:', JSON.stringify(data, null, 2));
                    if (data.revenue === 100 && data.soldProducts === 2 && data.orders === 1) {
                        console.log('PASS: Vendor Stats are correct.');
                    } else {
                        console.error('FAIL: Vendor Stats are incorrect.', { expectedRevenue: 100, expectedSold: 2, expectedOrders: 1 });
                    }
                }
            })
        };

        console.log('--- Testing Vendor Stats ---');
        await getVendorStats(vendorReq, vendorRes, next);

        // 5. Cleanup
        await Order.findByIdAndDelete(order._id);
        await Product.findByIdAndDelete(product._id);
        await Store.findByIdAndDelete(store._id);

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

runVerify();
