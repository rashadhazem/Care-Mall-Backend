const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Notification must have a recipient'],
        },
        sender: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Notification must have a message'],
        },
        type: {
            type: String,
            enum: ['info', 'success', 'warning', 'error'],
            default: 'info',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        link: String,
        metadata: Object,
    },
    { timestamps: true }
);

// Index for efficient fetching
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
