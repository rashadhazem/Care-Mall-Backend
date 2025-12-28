const asyncHandler = require('express-async-handler');
const cloudinary = require('../utils/cloudinary')
const factory = require('./handlersFactory');

const Brand = require('../models/brandModel');
const Store = require('../models/storeModel');

// Upload single image
exports.uploadBrandImage = require('../middlewares/uploadImageMiddleware').uploadSingleImage('image');


// Upload image to Cloudinary
exports.uploadToCloudinary = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'brands', transformation: [{ width: 600, height: 600, crop: 'fill' }] },
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


// CRUD using factory
exports.getBrands = factory.getAll(Brand);
exports.getBrand = factory.getOne(Brand);

exports.createBrand = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'vendor') {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return next(new ApiError('You do not have a store created yet', 404));
    }
    req.body.store = store._id;
  }
  const brand = await Brand.create(req.body);
  res.status(201).json({ status: 'success', brand });
});

exports.updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new Error('Brand not found');

  // Delete old image from Cloudinary
  if (req.body.image && brand.image?.public_id) {
    await cloudinary.uploader.destroy(brand.image.public_id);
  }

  brand.name = req.body.name || brand.name;
  brand.image = req.body.image || brand.image;

  await brand.save();
  res.status(200).json({ status: 'success', brand });
});

exports.deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new Error('Brand not found');

  if (brand.image?.public_id) await cloudinary.uploader.destroy(brand.image.public_id);

  await brand.deleteOne();
  res.status(204).json({ status: 'success', message: 'Brand deleted' });
});
