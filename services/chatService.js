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

    // TODO: Refine logic to handle 1-on-1 chats correctly based on participants or Store-User relation
    // For simplicity, assuming a User starts a chat with a Store Owner (indirectly via StoreId) or another User

    let chatData = {
        participants: [req.user._id, userId],
    }
    if (storeId) {
        chatData = {
            participants: [req.user._id],
            store: storeId
        }
    }

    // Check if chat exists (Logic can be complex depending on exact requirements, simplifying for now)
    // For now, always create a new chat or find existing one

    // Basic implementation: Create new chat
    const newChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: newChat._id }).populate("participants", "-password");
    res.status(200).json(fullChat);
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
