const socketManager = require('../Socket/socketManager');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

const notify = async (roomOrUserId, event, data) => {
    const io = socketManager.getIO();

    // 1. Persist to Database
    try {
        let recipients = [];

        if (roomOrUserId === 'admin-room') {
            const admins = await User.find({ role: 'admin' }).select('_id');
            recipients = admins.map(u => u._id);
        } else if (roomOrUserId === 'vendor-room') {
            const vendors = await User.find({ role: 'vendor' }).select('_id');
            recipients = vendors.map(u => u._id);
        } else {
            // Assume it's a specific User ID
            recipients = [roomOrUserId];
        }

        const notifications = recipients.map(recipientId => ({
            recipient: recipientId,
            title: data.title,
            message: data.message,
            type: data.type,
            link: data.link,
            metadata: data,
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        if (notifications.length > 0) {
            const savedNotifications = await Notification.insertMany(notifications);

            if (io) {
                const payload = { ...data };
                if (savedNotifications.length === 1) {
                    payload._id = savedNotifications[0]._id;
                }
                io.to(roomOrUserId).emit(event, payload);
            }
        }

    } catch (error) {
        console.error('[NotificationUtil] Error saving notification:', error);
        // Fallback: still emit socket even if DB fails?
        if (io) io.to(roomOrUserId).emit(event, data);
    }
};

exports.notifyAdmin = (title, message, type = 'info', data = {}) => {
    notify('admin-room', 'notification', {
        title,
        message,
        type,
        timestamp: new Date(),
        ...data
    });
};

exports.notifyVendor = (vendorId, title, message, type = 'info', data = {}) => {
    // vendorId can be a string or ObjectId
    notify(vendorId.toString(), 'notification', {
        title,
        message,
        type,
        timestamp: new Date(),
        ...data
    });
};

exports.notifyUser = (userId, title, message, type = 'info', data = {}) => {
    notify(userId.toString(), 'notification', {
        title,
        message,
        type,
        timestamp: new Date(),
        ...data
    });
};

