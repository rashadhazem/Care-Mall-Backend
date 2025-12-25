const express = require('express');
const authService = require('../services/authService');

const {
  addAddress,
  removeAddress,
  getLoggedUserAddresses,
} = require('../services/addressService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: User address management
 */

// 🔐 كل Routes محمية للمستخدم العادي
router.use(authService.protect, authService.allowedTo('user'));

// =========================
// /addresses
// =========================

/**
 * @swagger
 * /addresses:
 *   post:
 *     summary: Add a new address for logged user
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - details
 *             properties:
 *               title:
 *                 type: string
 *                 example: Home
 *               details:
 *                 type: string
 *                 example: 123 Street, City, Country
 *     responses:
 *       201:
 *         description: Address added successfully
 */
router.route('/').post(addAddress);

/**
 * @swagger
 * /addresses:
 *   get:
 *     summary: Get all addresses of logged user
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of addresses
 */
router.route('/').get(getLoggedUserAddresses);

// =========================
// /addresses/:addressId
// =========================

/**
 * @swagger
 * /addresses/{addressId}:
 *   delete:
 *     summary: Remove a specific address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Address removed successfully
 */
router.delete('/:addressId', removeAddress);

module.exports = router;
