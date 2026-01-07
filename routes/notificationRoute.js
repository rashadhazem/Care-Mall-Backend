const express = require('express');

const {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../services/notificationService');

const authService = require('../services/authService');

const router = express.Router();

router.use(authService.protect);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
