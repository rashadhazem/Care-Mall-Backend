const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Chat = require('./models/chatModel');
const User = require('./models/userModel');
const Store = require('./models/storeModel');
const { accessChat } = require('./services/chatService');

dotenv.config({ path: 'config.env' });

const dbConnection = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/Full-Ecommerce');
        console.log('DB Connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const runVerify = async () => {
    await dbConnection();

    try {
        // 1. Create Data
        const user = await User.create({
            name: 'TestUserCha1t',
            email: 'testuserchat1@example.com',
            password: 'password123',
            role: 'user'
        });

        const vendor = await User.create({
            name: 'TestVendorChat1',
            email: 'testvendorchat1@example.com',
            password: 'password123',
            role: 'vendor' // or user, doesn't matter for logic but logical for test
        });

        const store = await Store.create({
            name: 'TestStoreChat1',
            description: 'A test store for chat verification',
            owner: vendor._id
        });

        console.log('Data Created:', { user: user._id, vendor: vendor._id, store: store._id });

        // 2. Mock Request/Response for User-Store Chat
        const req = {
            user: { _id: user._id },
            body: { storeId: store._id }
        };

        const res = {
            status: (code) => {
                console.log(`Response Status: ${code}`);
                return {
                    json: (data) => {
                        console.log('Response Data (User-Store Chat):', JSON.stringify(data, null, 2));

                        // Verify Logic
                        const participants = data.participants.map(p => p._id.toString());
                        const hasUser = participants.includes(user._id.toString());
                        const hasVendor = participants.includes(vendor._id.toString());
                        const hasStore = data.store && data.store._id.toString() === store._id.toString();

                        if (hasUser && hasVendor && hasStore) {
                            console.log('SUCCESS: Chat created with correct participants and store ref.');
                        } else {
                            console.error('FAILURE: Chat creation incorrect.', { hasUser, hasVendor, hasStore });
                        }
                    },
                    send: (data) => {
                        console.log('Response Send (Existing Chat):', JSON.stringify(data, null, 2));
                    }
                };
            },
            send: (data) => {
                console.log('Response Send:', JSON.stringify(data, null, 2));
            }
        };

        const next = (err) => {
            console.error('Next called with error:', err);
        };

        // 3. Call accessChat
        console.log('Testing accessChat with StoreId...');
        await accessChat(req, res, next);

        // 4. Cleanup
        await Chat.deleteMany({ participants: { $in: [user._id] } });
        await Store.findByIdAndDelete(store._id);
        await User.findByIdAndDelete(user._id);
        await User.findByIdAndDelete(vendor._id);
        console.log('Cleanup done.');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        mongoose.disconnect();
    }
};

runVerify();
