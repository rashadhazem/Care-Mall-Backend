const express = require('express');
const {
  signupValidator,
  loginValidator,
} = require('../utils/validators/authValidator');

const {
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resendOtp,
  logout,
  verifyPassResetCode,
  resetPassword,
} = require('../services/authService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user login/signup/logout/password management/OTP
 */

// =========================
// /auth/signup
// =========================

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: ['user', 'admin', 'manager']
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/signup', signupValidator, signup);

// =========================
// /auth/verifyOtp
// =========================

/**
 * @swagger
 * /auth/verifyOtp:
 *   post:
 *     summary: Verify OTP for user registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post('/verifyOtp', verifyOtp);



// =========================
// /auth/resendOtp
// =========================

/**
 * @swagger
 * /auth/resendOtp:
 *   post:
 *     summary: Resend OTP for user registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent successfully
 */
router.post('/resendOtp', resendOtp);


// =========================
// /auth/logout
// =========================

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.post('/logout', logout);




// =========================
// /auth/login
// =========================

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully (returns JWT token)
 */
router.post('/login', loginValidator, login);

// =========================
// /auth/forgotPassword
// =========================

/**
 * @swagger
 * /auth/forgotPassword:
 *   post:
 *     summary: Request password reset code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset code sent to email
 */
router.post('/forgotPassword', forgotPassword);

// =========================
// /auth/verifyResetCode
// =========================

/**
 * @swagger
 * /auth/verifyResetCode:
 *   post:
 *     summary: Verify password reset code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - resetCode
 *             properties:
 *               email:
 *                 type: string
 *               resetCode:
 *                 type: string
 *              
 *     responses:
 *       200:
 *         description: Reset code verified successfully
 */
router.post('/verifyResetCode', verifyPassResetCode);

// =========================
// /auth/resetPassword
// =========================

/**
 * @swagger
 * /auth/resetPassword:
 *   put:
 *     summary: Reset user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.put('/resetPassword', resetPassword);

module.exports = router;
