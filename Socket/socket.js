const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Message = require('../models/messageModel');
const Chat = require('../models/chatModel');

const socketManager = require('./socketManager');

module.exports = function initSocketIO(io) {
    // store io instance for services to use
    socketManager.init(io);

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.query.token;
            console.log('[Socket Auth] Connection attempt, token present:', !!token);

            if (!token) {
                console.log('[Socket Auth] No token provided');
                return next(new Error("Authentication error: No token"));
            }

            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            console.log('[Socket Auth] Token decoded:', decoded);

            // Token uses _id (with underscore) from sanitizeUser
            const userId = decoded._id || decoded.id;
            console.log('[Socket Auth] Looking for user ID:', userId);

            const user = await User.findById(userId);
            if (!user) {
                console.log('[Socket Auth] User not found:', userId);
                return next(new Error("User not found"));
            }

            console.log('[Socket Auth] Auth successful for:', user.email);
            socket.user = user;
            next();
        } catch (error) {
            console.error('[Socket Auth] Error:', error.message);
            return next(new Error("Authentication error: " + error.message));
        }
    });

    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.user._id.toString());

        // join personal room for user-based notifications
        socket.join(socket.user._id.toString());

        // Join role-based rooms
        if (socket.user.role === 'admin') {
            socket.join('admin-room');
            console.log(`[Socket] User ${socket.user._id} joined admin-room`);
        } else if (socket.user.role === 'vendor') {
            socket.join('vendor-room');
            console.log(`[Socket] User ${socket.user._id} joined vendor-room`);
        }

        // Test Notification Event
        socket.on('testNotification', ({ type }, cb) => {
            console.log(`[Socket] testNotification received from ${socket.user.name} for type: ${type}`);

            const notificationData = {
                title: 'Test Notification',
                message: `This is a test notification for ${type}`,
                timestamp: new Date(),
                type: 'info'
            };

            if (type === 'self') {
                socket.emit('notification', notificationData);
            } else if (type === 'admin' && socket.user.role === 'admin') {
                io.to('admin-room').emit('notification', { ...notificationData, title: 'Admin Alert', message: 'Hello Admins!' });
            } else if (type === 'vendor' && socket.user.role === 'vendor') {
                io.to('vendor-room').emit('notification', { ...notificationData, title: 'Vendor Alert', message: 'Hello Vendors!' });
            } else {
                // default to self if no specific logic matched
                socket.emit('notification', notificationData);
            }

            cb && cb({ status: 'ok', message: 'Notification sent' });
        });

        // Create or get existing chat between current user and a store (store owner)
        socket.on('createChat', async ({ storeId }, cb) => {
            try {
                const Store = require('../models/storeModel');
                const store = await Store.findById(storeId).populate('owner', 'name email');
                if (!store) return cb && cb({ status: 'error', message: 'Store not found' });

                const userId = socket.user._id;
                // FIX: Verify owner extraction - store.owner is populated object
                const ownerId = store.owner._id || store.owner;

                let chat = await Chat.findOne({ store: store._id, participants: { $all: [userId, ownerId] } })
                    .populate('participants', 'name email')
                    .populate({ path: 'store', populate: { path: 'owner', select: 'name email' } });

                if (!chat) {
                    chat = await Chat.create({ store: store._id, participants: [userId, ownerId] });
                    chat = await Chat.findById(chat._id)
                        .populate('participants', 'name email')
                        .populate({ path: 'store', populate: { path: 'owner', select: 'name email' } });
                }

                // join chat room
                socket.join(chat._id.toString());

                // notify store owner
                io.to(store.owner._id.toString()).emit('newChat', chat);

                cb && cb({ status: 'ok', chat });
            } catch (err) {
                console.error('createChat error', err);
                cb && cb({ status: 'error', message: err.message });
            }
        });

        // Join an existing chat room and fetch messages
        socket.on('joinChat', async ({ chatId }, cb) => {
            try {
                const chat = await Chat.findById(chatId)
                    .populate('participants', 'name email')
                    .populate({ path: 'store', populate: { path: 'owner', select: 'name email' } });
                if (!chat) return cb && cb({ status: 'error', message: 'Chat not found' });

                const isParticipant = chat.participants.some((p) => p._id.toString() === socket.user._id.toString());
                const isOwner = chat.store && chat.store.owner && chat.store.owner._id.toString() === socket.user._id.toString();
                if (!isParticipant && !isOwner) return cb && cb({ status: 'error', message: 'Not authorized to join chat' });

                socket.join(chat._id.toString());

                const messages = await Message.find({ chat: chat._id }).populate('sender', 'name email').sort('createdAt');

                cb && cb({ status: 'ok', chat, messages });
            } catch (err) {
                console.error('joinChat error', err);
                cb && cb({ status: 'error', message: err.message });
            }
        });

        // Send a message to a chat
        socket.on('sendMessage', async ({ chatId, content }, cb) => {
            console.log(`[Socket] sendMessage received from ${socket.user._id} for chat ${chatId}`);
            try {
                if (!content || !content.trim()) {
                    console.log('[Socket] Error: Content empty');
                    return cb && cb({ status: 'error', message: 'Message cannot be empty' });
                }

                // Explicitly populate participants to handle auth check consistently
                const chat = await Chat.findById(chatId).populate('participants', '_id name email');

                if (!chat) {
                    console.log('[Socket] Error: Chat not found');
                    return cb && cb({ status: 'error', message: 'Chat not found' });
                }

                const StoreModel = require('../models/storeModel');
                const storeDoc = await StoreModel.findById(chat.store);

                // Debug logs
                console.log(`[Socket] Store lookup: ${chat.store} -> Found: ${!!storeDoc}`);
                if (storeDoc) console.log(`[Socket] Store Owner: ${storeDoc.owner}`);

                const userIdStr = socket.user._id.toString();
                // We populated participants, so they are objects now. Handle both cases for safety.
                const isParticipant = chat.participants.some((p) => {
                    const pId = (p._id || p).toString();
                    return pId === userIdStr;
                });

                // Store owner might be populated object or ID depending on query
                let storeOwnerId = null;
                if (storeDoc && storeDoc.owner) {
                    storeOwnerId = (storeDoc.owner._id || storeDoc.owner).toString();
                }

                const isOwner = storeOwnerId === userIdStr;

                console.log(`[Socket] Auth Check: User=${userIdStr}, isParticipant=${isParticipant}, isOwner=${isOwner} (StoreOwner=${storeOwnerId})`);

                if (!isParticipant && !isOwner) {
                    console.log('[Socket] Error: Not authorized. Details:',
                        { userId: userIdStr, isParticipant, isOwner, chatParticipants: chat.participants.map(p => (p._id || p).toString()) });
                    return cb && cb({ status: 'error', message: 'Not authorized to send message' });
                }

                const message = await Message.create({ chat: chat._id, sender: socket.user._id, content });
                const messagePop = await Message.findById(message._id).populate('sender', 'name email');

                console.log(`[Socket] Message created: ${message._id}`);

                // Emit to all sockets joined to this chat room
                io.to(chat._id.toString()).emit('newMessage', messagePop);

                // Notify Recipient (Persistence + Realtime)
                try {
                    const notificationUtil = require('../utils/notificationUtil');
                    const recipient = chat.participants.find(p => (p._id || p).toString() !== socket.user._id.toString());

                    if (recipient) {
                        const recipientId = (recipient._id || recipient).toString();
                        // Customize message based on sender role
                        const notifTitle = 'New Message'; // Could be 'New Message from Vendor' etc.
                        const notifMsg = `New message from ${socket.user.name}`;

                        // Determine link: generic chat page or specific
                        // If recipient is vendor -> /vendor/chat, if user -> /profile? (or just open chat)
                        // For now, keeping it simple or I can try to guess role. 
                        // Actually, notificationUtil doesn't strictly need role, just ID.

                        // We use the util which saves to DB and uses IO to emit
                        // Pass 'chatId' in metadata so frontend can maybe open it
                        await notificationUtil.notifyUser(recipientId, notifTitle, notifMsg, 'info', {
                            type: 'message',
                            chatId: chat._id,
                            link: '/chat' // A default, maybe user profile chat or vendor chat
                        });
                    }
                } catch (notifErr) {
                    console.error('[Socket] Failed to send persistent notification:', notifErr);
                }

                // (Legacy) also send a notification to the store owner personal room if needed, 
                // but the above covers it if store owner is a participant. 
                // If the store owner was NOT a participant (rare), keep legacy? 
                // In createChat, owner IS added to participants. So above logic covers both directions.

                cb && cb({ status: 'ok', message: messagePop });
            } catch (err) {
                console.error('[Socket] sendMessage error', err);
                cb && cb({ status: 'error', message: err.message });
            }
        });

        // Get all chats for current user (as participant or as store owner)
        socket.on('getMyChats', async (cb) => {
            try {
                const userId = socket.user._id;
                const StoreModel = require('../models/storeModel');
                const ownedStores = await StoreModel.find({ owner: userId }).select('_id');
                const ownedStoreIds = ownedStores.map((s) => s._id);

                const chats = await Chat.find({ $or: [{ participants: userId }, { store: { $in: ownedStoreIds } }] })
                    .populate('participants', 'name email')
                    .populate({ path: 'store', populate: { path: 'owner', select: 'name email' } })
                    .sort('-updatedAt');

                cb && cb({ status: 'ok', chats });
            } catch (err) {
                console.error('getMyChats error', err);
                cb && cb({ status: 'error', message: err.message });
            }
        });

        // Mark messages in a chat as read by current user
        socket.on('markRead', async ({ chatId }, cb) => {
            try {
                await Message.updateMany({ chat: chatId, readBy: { $ne: socket.user._id } }, { $push: { readBy: socket.user._id } });
                io.to(chatId).emit('messagesRead', { chatId, userId: socket.user._id });
                cb && cb({ status: 'ok' });
            } catch (err) {
                console.error('markRead error', err);
                cb && cb({ status: 'error', message: err.message });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.user._id.toString());
        });
    });

}    
