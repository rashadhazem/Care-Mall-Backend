const express = require('express');

const {
  addProductToCart,
  getLoggedUserCart,
  removeSpecificCartItem,
  clearCart,
  updateCartItemQuantity,
  applyCoupon,
} = require('../services/cartService');

const authService = require('../services/authService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: User shopping cart management
 */

// 🔐 كل Routes محمية للمستخدم العادي
router.use(authService.protect, authService.allowedTo('user'));

// =========================
// /cart
// =========================

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Add product to cart
 *     tags: [Cart]
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
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product added to cart
 */
router.route('/').post(addProductToCart);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get logged user cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User cart
 */
router.route('/').get(getLoggedUserCart);

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Clear user cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Cart cleared successfully
 */
router.route('/').delete(clearCart);

// =========================
// /cart/applyCoupon
// =========================

/**
 * @swagger
 * /cart/applyCoupon:
 *   put:
 *     summary: Apply coupon to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coupon
 *             properties:
 *               coupon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 */
router.put('/applyCoupon', applyCoupon);

// =========================
// /cart/:itemId
// =========================

/**
 * @swagger
 * /cart/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 */

/**
 * @swagger
 * /cart/{itemId}:
 *   delete:
 *     summary: Remove specific cart item
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Cart item removed successfully
 */
router
  .route('/:itemId')
  .put(updateCartItemQuantity)
  .delete(removeSpecificCartItem);

module.exports = router;
