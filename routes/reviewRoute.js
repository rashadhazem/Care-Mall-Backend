const express = require('express');

const {
  createReviewValidator,
  updateReviewValidator,
  getReviewValidator,
  deleteReviewValidator,
} = require('../utils/validators/reviewValidator');

const {
  getReview,
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  createFilterObj,
  setProductIdAndUserIdToBody,
} = require('../services/reviewService');

const authService = require('../services/authService');

// mergeParams علشان نقدر نوصل productId من product router
const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product reviews management
 */

// =========================
// /products/{productId}/reviews
// =========================

/**
 * @swagger
 * /products/{productId}/reviews:
 *   get:
 *     summary: Get all reviews for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.route('/').get(createFilterObj, getReviews);

/**
 * @swagger
 * /products/{productId}/reviews:
 *   post:
 *     summary: Create new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               - ratings
 *               - title
 *             properties:
 *               ratings:
 *                 type: number
 *                 example: 4
 *               title:
 *                 type: string
 *                 example: Very good product
 *     responses:
 *       201:
 *         description: Review created successfully
 *       401:
 *         description: Unauthorized
 */
router.route('/').post(
  authService.protect,
  authService.allowedTo('user'),
  setProductIdAndUserIdToBody,
  createReviewValidator,
  createReview
);

// =========================
// /reviews/:id
// =========================

/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review data
 *       404:
 *         description: Review not found
 */
router
  .route('/:id')
  .get(getReviewValidator, getReview);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Update review
 *     tags: [Reviews]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ratings:
 *                 type: number
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 */
router
  .route('/:id')
  .put( 
    authService.protect,
    authService.allowedTo('user'),
    updateReviewValidator,
    updateReview
  );

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
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
 *         description: Review deleted successfully
 */
router
  .route('/:id')
  .delete(
    authService.protect,
    authService.allowedTo('user', 'vendor', 'admin'),
    deleteReviewValidator,
    deleteReview
  );

module.exports = router;
