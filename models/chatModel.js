const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
        store: {
            type: mongoose.Schema.ObjectId,
            ref: 'Store',
        },
        latestMessage: {
            type: mongoose.Schema.ObjectId,
            ref: 'Message',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);
