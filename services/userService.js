const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const cloudinary = require('../utils/cloudinary');
const { createToken } = require('../utils/createToken');
const User = require('../models/userModel');
const { sanitizeUser } = require('../utils/SanitizeUser');

// Upload single image
exports.uploadUserImage = require('../middlewares/uploadImageMiddleware').uploadSingleImage('image');

exports.uploadToCloudinary = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'users', transformation: [{ width: 600, height: 600, crop: 'fill' }] },
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

// @desc    Get list of users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = factory.getAll(User);

// @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = factory.getOne(User);

// @desc    Create user
// @route   POST  /api/v1/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ status: 'success', user });
});

// @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  if (req.body.image && req.user.image?.public_id) {
    await cloudinary.uploader.destroy(req.user.image.public_id);
  }
  User.image = req.body.image || User.image;
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      slug: req.body.slug,
      phone: req.body.phone || "",
      email: req.body.email,
      image: req.body.image,
      role: req.body.role,
      active: req.body.active,
      isVerified: req.body.isVerified
    },
    {
      new: true,
    }
  );

  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );

  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

// @desc    Delete specific user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new Error('User not found');

  if (user.image?.public_id) await cloudinary.uploader.destroy(user.image.public_id);

  await user.deleteOne();
  res.status(204).json({ status: 'success', message: 'User deleted' });
});


// @desc    Get Logged user data
// @route   GET /api/v1/users/getMe
// @access  Private/Protect
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

// @desc    Update logged user password
// @route   PUT /api/v1/users/updateMyPassword
// @access  Private/Protect
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  // 1) Update user password based user payload (req.user._id)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );

  // 2) Generate token
  const token = createToken(sanitizeUser(user));

  res.status(200).json({ data: user, token });
});

// @desc    Update logged user data (without password, role)
// @route   PUT /api/v1/users/updateMe
// @access  Private/Protect
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email || req.user.email,
      phone: req.body.phone || req.user.phone || "",
      address: req.body.address || req.user.address,
    },
    { new: true }
  );

  res.status(200).json({ data: updatedUser });
});

// @desc    Deactivate logged user
// @route   DELETE /api/v1/users/deleteMe
// @access  Private/Protect
exports.deleteLoggedUserData = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({ status: 'Success' });
});
