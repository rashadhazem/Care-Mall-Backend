const mongoose = require('mongoose');
const Coupon = require('../models/couponModel');
const dotenv = require('dotenv');

dotenv.config({ path: '../config.env' });

mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/Full-Ecommerce')
    .then(async () => {
        console.log('DB Connected');
        const coupons = await Coupon.find({});
        console.log('--- COUPONS ---');
        coupons.forEach(c => {
            console.log(`Name: ${c.name}`);
            console.log(`Expire: ${c.expire} (Is Expired? ${c.expire < new Date()})`);
            console.log(`Product: ${c.product}`);
            console.log(`Store: ${c.store}`);
            console.log('---');
        });
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
