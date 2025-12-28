const express = require('express');
const {
    getStores,
    getStore,
    createStore,
    updateStore,
    deleteStore,
} = require('../services/storeService');

const authService = require('../services/authService');

const router = express.Router();

router
    .route('/')
    .get(getStores)
    .post(
        authService.protect,
        authService.allowedTo('admin', 'vendor'),
        createStore
    );

router
    .route('/:id')
    .get(getStore)
    .put(
        authService.protect,
        authService.allowedTo('admin', 'vendor'),
        updateStore
    )
    .delete(
        authService.protect,
        authService.allowedTo('admin'),
        deleteStore
    );

module.exports = router;
