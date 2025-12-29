const express = require('express');
const {
  getBrandValidator,
  createBrandValidator,
  updateBrandValidator,
  deleteBrandValidator,
} = require('../utils/validators/brandValidator');

const authService = require('../services/authService');

const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandImage,
  uploadToCloudinary
 
} = require('../services/brandService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: Brand management
 */

// =========================
// /brands
// =========================

/**
 * @swagger
 * /brands:
 *   get:
 *     summary: Get all brands
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: List of brands
 */
router.route('/').get(getBrands);

/**
 * @swagger
 * /brands:
 *   post:
 *     summary: Create new brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *               - store
 *             properties:
 *               name:
 *                 type: string
 *               store:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *        
 * 
 *     responses:
 *       201:
 *         description: Brand created successfully
 */
router.route('/').post(
  authService.protect,
  authService.allowedTo('admin', 'vendor'),
  uploadBrandImage,
  uploadToCloudinary,
  createBrandValidator,
  createBrand
);

// =========================
// /brands/:id
// =========================

/**
 * @swagger
 * /brands/{id}:
 *   get:
 *     summary: Get brand by ID
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Brand data
 *       404:
 *         description: Brand not found
 */
router.route('/:id').get(getBrandValidator,getBrand);

/**
 * @swagger
 * /brands/{id}:
 *   put:
 *     summary: Update brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Brand updated successfully
 */
router.route('/:id').put(
  authService.protect,
  authService.allowedTo('admin', 'vendor'),
  uploadBrandImage,
  uploadToCloudinary,
  updateBrandValidator,
  updateBrand
);

/**
 * @swagger
 * /brands/{id}:
 *   delete:
 *     summary: Delete brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Brand deleted successfully
 */
router.route('/:id').delete(
  authService.protect,
  authService.allowedTo('admin'),
  deleteBrandValidator,
  deleteBrand
);

module.exports = router;
