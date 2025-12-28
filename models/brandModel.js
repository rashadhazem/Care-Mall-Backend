const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: [true, 'Brand name must be unique'],
      minlength: [3, 'Brand name must be at least 3 characters long'],
      maxlength: [32, 'Brand name must be at most 32 characters long'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    image: {
      public_id: String,
      url: String,
    },
    store: {
      type: mongoose.Schema.ObjectId,
      ref: 'Store',
      required: [true, 'Brand must belong to a store'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Brand', brandSchema);
