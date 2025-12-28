const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Store name is required'],
            unique: [true, 'Store name must be unique'],
            trim: true,
            minlength: [3, 'Store name must be at least 3 characters long'],
        },
        slug: {
            type: String,
            lowercase: true,
        },
        description: {
            type: String,
            required: [true, 'Store description is required'],
            minlength: [10, 'Too short store description'],
        },
        image: {
            public_id: String,
            url: String,
        },
        owner: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Store must be belong to a user'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
