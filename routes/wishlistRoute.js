const express = require('express');

const authService = require('../services/authService');

const {
  addProductToWishlist,
  removeProductFromWishlist,
  getLoggedUserWishlist,
} = require('../services/wishlistService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: User wishlist management
 */

// 🔐 كل Routes هنا محمية
router.use(authService.protect, authService.allowedTo('user'));

// =========================
// /wishlist
// =========================

/**
 * @swagger
 * /wishlist:
 *   post:
 *     summary: Add product to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product added to wishlist
 *       401:
 *         description: Unauthorized
 */
router.route('/').post(addProductToWishlist);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get logged user wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User wishlist
 *       401:
 *         description: Unauthorized
 */
router.route('/').get(getLoggedUserWishlist);

// =========================
// /wishlist/:productId
// =========================

/**
 * @swagger
 * /wishlist/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 *       404:
 *         description: Product not found
 */
router.delete('/:productId', removeProductFromWishlist);

module.exports = router;
