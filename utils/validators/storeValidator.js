const slugify = require('slugify');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../validatorMiddleware');

exports.getStoreValidator = [
  check('id').isMongoId().withMessage('Invalid Store id format'),
  validatorMiddleware,
];
exports.createStoreValidator = [
  
  check('name')
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Store name must be between 3 and 100 characters'),
  check('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Store description must be less than 500 characters'),
   check('owner')
    .notEmpty()
    .withMessage('Store owner is required'),
  validatorMiddleware,
];
exports.updateStoreValidator = [
  check('id').isMongoId().withMessage('Invalid Store id format'),
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Store name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Store description must be less than 500 characters'),
  
  body('owner')
    .notEmpty()
    .withMessage('Store owner is required'),
  validatorMiddleware,
];
exports.deleteStoreValidator = [
  check('id').isMongoId().withMessage('Invalid Store id format'),
  validatorMiddleware,
];

