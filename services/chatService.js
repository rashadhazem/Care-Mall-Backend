const asyncHandler = require('express-async-handler');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const ApiError = require('../utils/apiError');
const Store = require('../models/storeModel');
const User = require('../models/userModel');
const socketManager = require('../Socket/socketManager');

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
    let store = null;

    if (storeId) {
        // Find store
        store = await Store.findById(storeId);

        if (!store) {
            return next(new ApiError('Store not found', 404));
        }

        // Check if chat exists between current user and this store owner
        // Store owner is populated in the store object, so we need to extract the _id
        const ownerId = store.owner._id || store.owner;

        query = {
            store: storeId,
            participants: { $all: [req.user._id, ownerId] }
        };

        chatData = {
            participants: [req.user._id, ownerId],
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
        .populate({ path: 'store', populate: { path: 'owner', select: 'name email' } });

    if (isChat) {
        return res.status(200).json(isChat);
    } else {
        try {
            const createdChat = await Chat.create(chatData);
            const fullChat = await Chat.findOne({ _id: createdChat._id })
                .populate("participants", "-password")
                .populate({ path: 'store', populate: { path: 'owner', select: 'name email' } });

            // Emit newChat notification to store owner if created for a store
            try {
                const io = socketManager.getIO();
                if (io && store && store.owner) {
                    io.to(store.owner.toString()).emit('newChat', fullChat);
                }
            } catch (emitErr) {
                console.error('Failed to emit newChat:', emitErr.message);
            }

            return res.status(201).json(fullChat);
        } catch (error) {
            return next(new ApiError(error.message, 400));
        }
    }
});

// @desc    Fetch all chats for a user (participant or store owner)
// @route   GET /api/v1/chats
// @access  Protected
exports.deployUserChats = asyncHandler(async (req, res, next) => {
    try {
        // Find stores owned by user
        const ownedStores = await Store.find({ owner: req.user._id }).select('_id');
        const ownedStoreIds = ownedStores.map((s) => s._id);

        const chats = await Chat.find({ $or: [{ participants: req.user._id }, { store: { $in: ownedStoreIds } }] })
            .populate("participants", "-password")
            .populate({ path: 'store', populate: { path: 'owner', select: 'name email' } })
            .sort({ updatedAt: -1 });

        return res.status(200).json(chats);
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

    // Verify chat exists and user is authorized
    const chat = await Chat.findById(chatId);
    if (!chat) return next(new ApiError('Chat not found', 404));

    const isParticipant = chat.participants.map(id => id.toString()).includes(req.user._id.toString());
    let isOwner = false;
    if (chat.store) {
        const store = await Store.findById(chat.store);
        if (store && store.owner) {
            // Handle populated or unpopulated owner
            const ownerId = (store.owner._id || store.owner).toString();
            isOwner = ownerId === req.user._id.toString();
        }
    }

    if (!isParticipant && !isOwner) return next(new ApiError('Not authorized to send message in this chat', 403));

    const newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId,
    };

    try {
        let message = await Message.create(newMessage);

        message = await message.populate('sender', 'name email');
        message = await message.populate('chat');
        message = await User.populate(message, {
            path: 'chat.participants',
            select: 'name email'
        });

        // update chat's updatedAt (and latestMessage if schema allows)
        await Chat.findByIdAndUpdate(chatId, { $set: { updatedAt: Date.now(), latestMessage: message } }, { new: true });

        // Emit real-time events via socket if available
        try {
            const io = socketManager.getIO();
            if (io) {
                // Emit to chat room
                io.to(chatId.toString()).emit('newMessage', message);

                // notify store owner if exists
                if (chat.store) {
                    const storeDoc = await Store.findById(chat.store).select('owner');
                    if (storeDoc && storeDoc.owner) {
                        io.to(storeDoc.owner.toString()).emit('messageNotification', { chatId, message });
                    }
                }
            }
        } catch (emitErr) {
            console.error('Failed to emit newMessage:', emitErr.message);
        }

        return res.status(201).json(message);
    } catch (error) {
        return next(new ApiError(error.message, 400));
    }
});

// @desc    Mark messages as read for a chat
// @route   POST /api/v1/chats/mark-read
// @access  Protected
exports.markRead = asyncHandler(async (req, res, next) => {
    const { chatId } = req.body;
    if (!chatId) return next(new ApiError('chatId is required', 400));

    try {
        await Message.updateMany({ chat: chatId, readBy: { $ne: req.user._id } }, { $push: { readBy: req.user._id } });

        // Emit messagesRead event
        try {
            const io = socketManager.getIO();
            if (io) {
                io.to(chatId.toString()).emit('messagesRead', { chatId, userId: req.user._id });
            }
        } catch (emitErr) {
            console.error('Failed to emit messagesRead:', emitErr.message);
        }

        return res.status(200).json({ status: 'ok' });
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

        return res.status(200).json(messages);
    } catch (error) {
        return next(new ApiError(error.message, 400));
    }
});
