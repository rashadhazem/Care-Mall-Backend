const express = require('express');
const { getAdminStats, getVendorStats } = require('../services/statsService');
const authService = require('../services/authService');

const router = express.Router();

router.use(authService.protect);

/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: Statistics for Admin and Vendors
 */

/**
 * @swagger
 * /stats/admin:
 *   get:
 *     summary: Get dashboard statistics for Admin
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: integer
 *                   description: Total number of users
 *                 orders:
 *                   type: integer
 *                   description: Total number of orders
 *                 products:
 *                   type: integer
 *                   description: Total number of products
 *                 stores:
 *                   type: integer
 *                   description: Total number of stores
 *                 totalSales:
 *                   type: number
 *                   description: Total revenue across all orders
 *       403:
 *         description: Not authorized (Admin only)
 */
router.get('/admin', authService.allowedTo('admin'), getAdminStats);

/**
 * @swagger
 * /stats/vendor:
 *   get:
 *     summary: Get dashboard statistics for Vendor
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 storeName:
 *                   type: string
 *                 products:
 *                   type: integer
 *                   description: Total products for this store
 *                 orders:
 *                   type: integer
 *                   description: Number of orders containing store products
 *                 revenue:
 *                   type: number
 *                   description: Total revenue from store products
 *                 soldProducts:
 *                   type: integer
 *                   description: Total quantity of items sold
 *       404:
 *         description: Store not found for user
 */
router.get('/vendor', authService.allowedTo('vendor', 'admin'), getVendorStats);

module.exports = router;
