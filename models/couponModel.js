const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Coupon name required'],
      unique: true,
    },
    expire: {
      type: Date,
      required: [true, 'Coupon expire time required'],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: false,
    },
    store: {
      type: mongoose.Schema.ObjectId,
      ref: 'Store',
      required: false,
    },
    discount: {
      type: Number,
      required: [true, 'Coupon discount value required'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
