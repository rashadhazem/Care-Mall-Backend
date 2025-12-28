const express = require('express');
const {
    accessChat,
    deployUserChats,
    sendMessage,
    allMessages,
} = require('../services/chatService');
const authService = require('../services/authService');

const router = express.Router();

router.use(authService.protect);

router.route('/')
    .post(accessChat)
    .get(deployUserChats);

router.route('/message').post(sendMessage);
router.route('/:chatId/messages').get(allMessages);

module.exports = router;
