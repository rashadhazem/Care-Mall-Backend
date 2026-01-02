const asyncHandler = require('express-async-handler');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const ApiError = require('../utils/apiError');

// @desc    Create or access a chat
// @route   POST /api/v1/chats
// @access  Protected
exports.accessChat = asyncHandler(async (req, res, next) => {
    const { userId, storeId } = req.body;

    if (!userId && !storeId) {
        return next(new ApiError('UserId or StoreId param not sent with request', 400));
    }

    let chatData = {};
    let query = {};

    if (storeId) {
        // Find the store to get the owner
        const Store = require('../models/storeModel');
        const store = await Store.findById(storeId);

        if (!store) {
            return next(new ApiError('Store not found', 404));
        }

        // Check if chat exists betwen current user and this store
        query = {
            store: storeId,
            participants: { $all: [req.user._id, store.owner] }
        };

        chatData = {
            participants: [req.user._id, store.owner],
            store: storeId
        };
    } else {
        // User to User chat
        query = {
            participants: { $all: [req.user._id, userId], $size: 2 },
            store: { $exists: false }
        };

        chatData = {
            participants: [req.user._id, userId],
        };
    }

    let isChat = await Chat.findOne(query)
        .populate("participants", "-password")
        .populate("store");

    if (isChat) {
        res.send(isChat);
    } else {
        try {
            const createdChat = await Chat.create(chatData);
            const fullChat = await Chat.findOne({ _id: createdChat._id })
                .populate("participants", "-password")
                .populate("store");
            res.status(200).json(fullChat);
        } catch (error) {
            return next(new ApiError(error.message, 400));
        }
    }
});

// @desc    Fetch all chats for a user
// @route   GET /api/v1/chats
// @access  Protected
exports.deployUserChats = asyncHandler(async (req, res, next) => {
    try {
        Chat.find({ participants: { $elemMatch: { $eq: req.user._id } } })
            .populate("participants", "-password")
            .populate("store")
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                res.status(200).send(results);
            });
    } catch (error) {
        return next(new ApiError(error.message, 400));
    }
});

// @desc    Send Message
// @route   POST /api/v1/chats/message
// @access  Protected
exports.sendMessage = asyncHandler(async (req, res, next) => {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        return next(new ApiError('Invalid data passed into request', 400));
    }

    var newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId,
    };

    try {
        var message = await Message.create(newMessage);

        message = await message.populate("sender", "name image");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.participants",
            select: "name email image",
        });

        await Chat.findByIdAndUpdate(req.body.chatId, {
            latestMessage: message,
        });

        res.json(message);

    } catch (error) {
        return next(new ApiError(error.message, 400));
    }
});

// @desc    Get all Messages
// @route   GET /api/v1/chats/:chatId/messages
// @access  Protected
exports.allMessages = asyncHandler(async (req, res, next) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "name image email")
            .populate("chat");

        res.json(messages);
    } catch (error) {
        return next(new ApiError(error.message, 400));
    }
});
