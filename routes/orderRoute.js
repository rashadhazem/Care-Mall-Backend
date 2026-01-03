const express = require('express');
const {
  createCashOrder,
  findAllOrders,
  findSpecificOrder,
  filterOrderForLoggedUser,
  updateOrderToPaid,
  updateOrderToDelivered,
  checkoutSession,
} = require('../services/orderService');

const authService = require('../services/authService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

// 🔐 كل Routes محمية
router.use(authService.protect);

// =========================
// /orders/checkout-session/:cartId
// =========================

/**
 * @swagger
 * /orders/checkout-session/{cartId}:
 *   get:
 *     summary: Create Stripe checkout session
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/checkout-session/:cartId',
  authService.allowedTo('user'),
  checkoutSession
);

// =========================
// /orders/:cartId (Cash Order)
// =========================

/**
 * @swagger
 * /orders/{cartId}:
 *   post:
 *     summary: Create cash order for cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Cash order created successfully
 *       401:
 *         description: Unauthorized
 */
router.route('/:cartId').post(authService.allowedTo('user'), createCashOrder);

// =========================
// /orders
// =========================

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders (filtered for logged user)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Unauthorized
 */
const { filterData } = require('../services/filterService');

router.get(
  '/',
  authService.allowedTo('user', 'admin', 'vendor'),
  filterData,
  findAllOrders
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get specific order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order data
 *       404:
 *         description: Order not found
 */
router.get('/:id', findSpecificOrder);

// =========================
// /orders/:id/pay
// =========================

/**
 * @swagger
 * /orders/{id}/pay:
 *   put:
 *     summary: Update order to paid
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order updated to paid
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:id/pay',
  authService.allowedTo('admin', 'vendor'),
  updateOrderToPaid
);

// =========================
// /orders/:id/deliver
// =========================

/**
 * @swagger
 * /orders/{id}/deliver:
 *   put:
 *     summary: Update order to delivered
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order updated to delivered
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:id/deliver',
  authService.allowedTo('admin', 'vendor'),
  updateOrderToDelivered
);

module.exports = router;
