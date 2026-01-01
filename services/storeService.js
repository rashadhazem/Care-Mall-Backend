const asyncHandler = require('express-async-handler');
const slugify = require('slugify'); // Requires installing/verifying slugify, assuming it's present in package.json
const factory = require('./handlersFactory');
const Store = require('../models/storeModel');
const cloudinary = require('../utils/cloudinary');
const ApiError = require('../utils/apiError');

exports.uploadStoreImage = require('../middlewares/uploadImageMiddleware').uploadSingleImage('image');

exports.uploadToCloudinary = asyncHandler(async (req, res, next) => {
  console.log('Upload to cloudinary called', req.file);

  if (!req.file) return next();

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'stores',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(req.file.buffer);
  });

  req.body.image = {
    public_id: result.public_id,
    url: result.secure_url,
  };

  next();
});


// @desc    Get list of stores
// @route   GET /api/v1/stores
// @access  Public
exports.getStores = factory.getAll(Store);

// @desc    Get specific store by id
// @route   GET /api/v1/stores/:id
// @access  Public
exports.getStore = factory.getOne(Store);

// @desc    Create store
// @route   POST /api/v1/stores
// @access  Private/Vendor/Admin
exports.createStore = asyncHandler(async (req, res) => {
    // 1. Check if user already has a store (optional logic depending on requirements)
   console.log("store",req.body)
   
    if (req.body.name) {
        req.body.slug = slugify(req.body.name);
    }
    const document = await Store.create(req.body);
    res.status(201).json({ data: document });
});

// @desc    Update specific store
// @route   PUT /api/v1/stores/:id
// @access  Private/Vendor/Admin

exports.updateStore = asyncHandler(async (req, res, next) => {
  console.log("Updating store:", req.body);
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ApiError(`No store for this id ${req.params.id}`, 404));
  }
  if (req.user.role === 'vendor' && store.owner.toString() !== req.user._id.toString()) {
        return next(new ApiError(`You are not allowed to update this store`, 403));
    }
    if(req.file && store.image?.public_id){
        await cloudinary.uploader.destroy(store.image.public_id);
    }
    
 if(req.body.image){
    store.image = req.body.image;
 }
    // Check ownership
    if (req.body.name) {
        req.body.slug = slugify(req.body.name);
        store.name = req.body.name;
    }
    if (req.body.description) {
        store.description = req.body.description;
    }
    if (req.body.owner) {
        store.owner = req.body.owner;
    }

   const updatedStore = await store.save();

    res.status(200).json({ data: updatedStore });
});

// @desc    Delete specific store
// @route   DELETE /api/v1/stores/:id
// @access  Private/Admin
exports.deleteStore = factory.deleteOne(Store);
