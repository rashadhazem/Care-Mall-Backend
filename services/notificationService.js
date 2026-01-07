const asyncHandler = require('express-async-handler');
const Notification = require('../models/notificationModel');
const ApiError = require('../utils/apiError');

// @desc    Get my notifications
// @route   GET /api/v1/notifications
// @access  Protected
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Unread count
    const unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false
    });

    res.status(200).json({
        status: 'success',
        results: notifications.length,
        unreadCount,
        data: notifications
    });
});

// @desc    Mark notification as read
// @route   PATCH /api/v1/notifications/:id/read
// @access  Protected
exports.markAsRead = asyncHandler(async (req, res, next) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user._id },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        return next(new ApiError('Notification not found or unauthorized', 404));
    }

    res.status(200).json({ status: 'success', data: notification });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/v1/notifications/read-all
// @access  Protected
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    );

    res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
});

// @desc    Delete a notification
// @route   DELETE /api/v1/notifications/:id
// @access  Protected
exports.deleteNotification = asyncHandler(async (req, res, next) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        recipient: req.user._id
    });

    if (!notification) {
        return next(new ApiError('Notification not found', 404));
    }

    res.status(204).send();
});
