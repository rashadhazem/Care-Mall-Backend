const asyncHandler = require('express-async-handler');
const cloudinary = require('../utils/cloudinary');
const factory = require('./handlersFactory');

const Product = require('../models/productModel');
const Store = require('../models/storeModel');

exports.uploadProductImages = require('../middlewares/uploadImageMiddleware').uploadMultipleImages([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);

// Upload images to Cloudinary
exports.uploadToCloudinary = asyncHandler(async (req, res, next) => {
  if (!req.files) return next();

  // Upload imageCover
  if (req.files.imageCover) {
    const coverResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'products', transformation: [{ width: 800, height: 800, crop: 'fill' }] },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.files.imageCover[0].buffer);
    });
    req.body.imageCover = { public_id: coverResult.public_id, url: coverResult.secure_url };
  }

  // Upload additional images
  if (req.files.images) {
    req.body.images = [];
    for (const file of req.files.images) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'products', transformation: [{ width: 800, height: 800, crop: 'fill' }] },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(file.buffer);
      });
      req.body.images.push({ public_id: result.public_id, url: result.secure_url });
    }
  }

  next();
});

// @desc    Get list of products
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = factory.getAll(Product, 'Products');

// @desc    Get specific product by id
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = factory.getOne(Product, 'reviews');

// @desc    Create product
// @route   POST  /api/v1/products
// @access  Private
exports.createProduct = asyncHandler(async (req, res, next) => { // Added next for error handling
  if (req.user.role === 'vendor') {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return next(new ApiError('You do not have a store created yet', 404));
    }
    req.body.store = store._id;
  }
  const product = await Product.create(req.body);
  res.status(201).json({ status: 'success', product });
});
// @desc    Update specific product
// @route   PUT /api/v1/products/:id
// @access  Private

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new Error('Product not found');

  // Delete old images from Cloudinary if new ones uploaded
  if (req.body.imageCover && product.imageCover?.public_id) {
    await cloudinary.uploader.destroy(product.imageCover.public_id);
  }
  if (req.body.images && product.images?.length) {
    for (const img of product.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }
  }

  Object.assign(product, req.body);
  await product.save();

  res.status(200).json({ status: 'success', product });
});
// @desc    Delete specific product
// @route   DELETE /api/v1/products/:id
// @access  Private
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new Error('Product not found');

  // Delete images from Cloudinary
  if (product.imageCover?.public_id) await cloudinary.uploader.destroy(product.imageCover.public_id);
  if (product.images?.length) {
    for (const img of product.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }
  }

  await product.deleteOne();
  res.status(204).json({ status: 'success', message: 'Product deleted' });
});
