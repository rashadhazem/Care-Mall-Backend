const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.ObjectId,
            ref: 'Chat',
            required: [true, 'Message must belong to a chat.']
        },
        sender: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Message must have a sender.']
        },
        content: {
            type: String,
            required: [true, 'Message cannot be empty.']
        },
        readBy: [{
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
