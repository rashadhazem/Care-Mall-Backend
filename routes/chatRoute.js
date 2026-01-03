const express = require('express');
const {
    accessChat,
    deployUserChats,
    sendMessage,
    allMessages,
    markRead,
} = require('../services/chatService');
const authService = require('../services/authService');

const router = express.Router();

router.use(authService.protect);

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Chat management and messaging
 */

/**
 * @swagger
 * /chats:
 *   post:
 *     summary: Create or access a chat
 *     description: Create or access a one-on-one chat with a user or a store.
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to chat with (for User-User chat)
 *               storeId:
 *                 type: string
 *                 description: ID of the store to chat with (for User-Store chat)
 *     responses:
 *       200:
 *         description: Chat accessed successfully
 *       400:
 *         description: Invalid data or missing parameters
 *       404:
 *         description: Store or User not found
 *   get:
 *     summary: Fetch all chats for the logged-in user
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chats
 */
router.route('/')
    .post(accessChat)
    .get(deployUserChats);

/**
 * @swagger
 * /chats/message:
 *   post:
 *     summary: Send a message
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - chatId
 *             properties:
 *               content:
 *                 type: string
 *               chatId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid data
 */
router.route('/message').post(sendMessage);

/**
 * @swagger
 * /chats/{chatId}/messages:
 *   get:
 *     summary: Get all messages for a specific chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: The chat ID
 *     responses:
 *       200:
 *         description: List of messages
 *       400:
 *         description: Error fetching messages
 */
router.route('/:chatId/messages').get(allMessages);

/**
 * @swagger
 * /chats/mark-read:
 *   post:
 *     summary: Mark messages in a chat as read by the logged-in user
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chatId
 *             properties:
 *               chatId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 *       400:
 *         description: Invalid data
 */
router.route('/mark-read').post(markRead);

module.exports = router;
