const express = require('express');

const {
  getStoreValidator,
  createStoreValidator,
  updateStoreValidator,
  deleteStoreValidator,
} = require('../utils/validators/storeValidator.js');

const {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
  uploadToCloudinary,
  uploadStoreImage
} = require('../services/storeService');

const authService = require('../services/authService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Stores
 *   description: Store management
 */

// =========================
// /stores
// =========================

/**
 * @swagger
 * /stores:
 *   get:
 *     summary: Get all stores
 *     tags: [Stores]
 *     responses:
 *       200:
 *         description: List of stores
 */
router.route('/').get(getStores);

/**
 * @swagger
 * /stores:
 *   post:
 *     summary: Create new store
 *     tags: [Stores]
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
 *               - description
 *               - owner
 * 
 * 
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary   
 *               owner:
 *                 type: string
 *     responses:
 *       201:
 *         description: Store created successfully
 *       401:
 *         description: Unauthorized
 */
router.route('/').post(
  authService.protect,
  authService.allowedTo('admin', 'vendor'),
  uploadStoreImage,
  uploadToCloudinary,
  createStoreValidator,
  createStore
);

// =========================
// /stores/:id
// =========================

/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     summary: Get store by ID
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store data
 *       404:
 *         description: Store not found
 */
router
  .route('/:id')
  .get(getStoreValidator, getStore);

/**
 * @swagger
 * /stores/{id}:
 *   put:
 *     summary: Update store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               owner:
 *                 type: string
 *     responses:
 *       200:
 *         description: Store updated successfully
 */
router
  .route('/:id')
  .put(
    authService.protect,
    authService.allowedTo('admin', 'vendor'),
    updateStoreValidator,
    updateStore
  );

/**
 * @swagger
 * /stores/{id}:
 *   delete:
 *     summary: Delete store
 *     tags: [Stores]
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
 *         description: Store deleted successfully
 */
router
  .route('/:id')
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteStoreValidator,
    deleteStore
  );

module.exports = router;
