const cloudinary = require('../utils/cloudinary')
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const factory = require('./handlersFactory');
const Category = require('../models/categoryModel');

// Upload single image
exports.uploadCategoryImage =require('../middlewares/uploadImageMiddleware').uploadSingleImage('image');
// Image processing
exports.uploadToCloudinary = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'categories', transformation: [{ width: 600, height: 600, crop: 'fill' }] },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(req.file.buffer);
  });

  req.body.image = { public_id: result.public_id, url: result.secure_url };
  next();
});

// @desc    Get list of categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = factory.getAll(Category);

// @desc    Get specific category by id
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategory = factory.getOne(Category);

// @desc    Create category
// @route   POST  /api/v1/categories
// @access  Private/Admin-Manager
exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ status: 'success', category });
});


// @desc    Update specific category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin-Manager
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new Error('Category not found');

  // Delete old image from Cloudinary
  if (req.body.image && category.image?.public_id) {
    await cloudinary.uploader.destroy(category.image.public_id);
  }

  category.name = req.body.name || category.name;
  category.image = req.body.image || category.image;
  category.slug = req.body.name ? slugify(req.body.name) : category.slug;
  await category.save();
  res.status(200).json({ status: 'success', category });
});


// @desc    Delete specific category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new Error('Category not found');

  if (category.image?.public_id) await cloudinary.uploader.destroy(category.image.public_id);

  await category.deleteOne();
  res.status(204).json({ status: 'success', message: 'Category deleted' });
});
