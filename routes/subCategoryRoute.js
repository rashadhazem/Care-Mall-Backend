const express = require('express');

const {
  createSubCategory,
  getSubCategory,
  getSubCategories,
  updateSubCategory,
  deleteSubCategory,
  setCategoryIdToBody,
  createFilterObj,
} = require('../services/subCategoryService');

const {
  createSubCategoryValidator,
  getSubCategoryValidator,
  updateSubCategoryValidator,
  deleteSubCategoryValidator,
} = require('../utils/validators/subCategoryValidator');

const authService = require('../services/authService');

// mergeParams: Allow us to access categoryId from category router
const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Subcategories
 *   description: Subcategory management
 */

// =========================
// /categories/{categoryId}/subcategories
// =========================

/**
 * @swagger
 * /categories/{categoryId}/subcategories:
 *   post:
 *     summary: Create new subcategory
 *     tags: [Subcategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subcategory created successfully
 *       401:
 *         description: Unauthorized
 */
router
  .route('/')
  .post(
    authService.protect,
    authService.allowedTo('admin', 'vendor'),
    setCategoryIdToBody,
    createSubCategoryValidator,
    createSubCategory
  );

/**
 * @swagger
 * /categories/{categoryId}/subcategories:
 *   get:
 *     summary: Get all subcategories for a category
 *     tags: [Subcategories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of subcategories
 */
router.route('/').get(createFilterObj, getSubCategories);

// =========================
// /subcategories/:id
// =========================

/**
 * @swagger
 * /subcategories/{id}:
 *   get:
 *     summary: Get subcategory by ID
 *     tags: [Subcategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subcategory data
 *       404:
 *         description: Subcategory not found
 */
router
  .route('/:id')
  .get(getSubCategoryValidator, getSubCategory);

/**
 * @swagger
 * /subcategories/{id}:
 *   put:
 *     summary: Update subcategory
 *     tags: [Subcategories]
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
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subcategory updated successfully
 */
router
  .route('/:id')
  .put(
    authService.protect,
    authService.allowedTo('admin', 'vendor'),
    updateSubCategoryValidator,
    updateSubCategory
  );

/**
 * @swagger
 * /subcategories/{id}:
 *   delete:
 *     summary: Delete subcategory
 *     tags: [Subcategories]
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
 *         description: Subcategory deleted successfully
 */
router
  .route('/:id')
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteSubCategoryValidator,
    deleteSubCategory
  );

module.exports = router;
