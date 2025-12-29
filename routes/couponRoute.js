const express = require('express');

const {
  getCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../services/couponService');

const authService = require('../services/authService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Coupon management
 */

// 🔐 كل Routes محمية (Admin / Manager)
router.use(authService.protect, authService.allowedTo('admin', 'vendor'));

// =========================
// /coupons
// =========================

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Get all coupons
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of coupons
 */
router.route('/').get(getCoupons);

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Create new coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - discount
 *               - expire
 *             properties:
 *               name:
 *                 type: string
 *                 example: NEWYEAR
 *               discount:
 *                 type: number
 *                 example: 20
 *               expire:
 *                 type: string
 *                 format: date
 *                 example: 2026-01-01
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */
router.route('/').post(createCoupon);

// =========================
// /coupons/:id
// =========================

/**
 * @swagger
 * /coupons/{id}:
 *   get:
 *     summary: Get coupon by ID
 *     tags: [Coupons]
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
 *         description: Coupon data
 *       404:
 *         description: Coupon not found
 */
router.route('/:id').get(getCoupon);

/**
 * @swagger
 * /coupons/{id}:
 *   put:
 *     summary: Update coupon
 *     tags: [Coupons]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               discount:
 *                 type: number
 *               expire:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 */
router.route('/:id').put(updateCoupon);

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     summary: Delete coupon
 *     tags: [Coupons]
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
 *         description: Coupon deleted successfully
 */
router.route('/:id').delete(deleteCoupon);

module.exports = router;
