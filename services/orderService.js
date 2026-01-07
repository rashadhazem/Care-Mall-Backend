require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');

const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');

const notificationUtil = require('../utils/notificationUtil');

// @desc    create cash order
// @route   POST /api/v1/orders/cartId
// @access  Protected/User
exports.createCashOrder = asyncHandler(async (req, res, next) => {
  // app settings
  const taxPrice = 0;
  const shippingPrice = 0;

  // 1) Get cart depend on cartId - Populate product store to notify vendors
  const cart = await Cart.findById(req.params.cartId).populate({
    path: 'cartItems.product',
    populate: { path: 'store', select: 'owner name' }
  });

  if (!cart) {
    return next(
      new ApiError(`There is no such cart with id ${req.params.cartId}`, 404)
    );
  }

  // 2) Get order price depend on cart price "Check if coupon apply"
  const cartPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalCartPrice;

  const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

  // 3) Create order with default paymentMethodType cash
  const order = await Order.create({
    user: req.user._id,
    cartItems: cart.cartItems,
    shippingAddress: req.body.shippingAddress,
    totalOrderPrice,
    paymentMethodType: 'cash',
  });

  // 4) After creating order, decrement product quantity, increment product sold
  if (order) {
    const bulkOption = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product._id }, // item.product is object now due to populate
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOption, {});

    // 5) Clear cart depend on cartId
    await Cart.findByIdAndDelete(req.params.cartId);

    // 6) Notifications
    // Notify Admin
    notificationUtil.notifyAdmin('New Order', `New Order #${order._id} successfully placed`, 'success');

    // Notify Vendors
    const notifiedVendors = new Set();
    cart.cartItems.forEach(item => {
      const store = item.product.store;
      // Check if store and owner exist (products might be deleted or store closed)
      if (store && store.owner && !notifiedVendors.has(store.owner._id.toString())) {
        notificationUtil.notifyVendor(store.owner._id, 'New Order', `You have a new order for ${store.name}`, 'info');
        notifiedVendors.add(store.owner._id.toString());
      }
    });

    // Notify User
    notificationUtil.notifyUser(order.user, 'Order Placed', `Your order #${order._id} has been placed successfully.`, 'success');
  }

  res.status(201).json({ status: 'success', data: order });
});


exports.filterOrderForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'user') req.filterObj = { user: req.user._id };
  next();
});
// @desc    Get all orders
// @route   POST /api/v1/orders
// @access  Protected/User-Admin-Manager
exports.findAllOrders = factory.getAll(Order);

// @desc    Get all orders
// @route   POST /api/v1/orders
// @access  Protected/User-Admin-Manager
exports.findSpecificOrder = factory.getOne(Order);

// @desc    Update order paid status to paid
// @route   PUT /api/v1/orders/:id/pay
// @access  Protected/Admin-Manager
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate({
    path: 'cartItems.product',
    populate: { path: 'store' }
  });
  if (!order) {
    return next(
      new ApiError(
        `There is no such a order with this id:${req.params.id}`,
        404
      )
    );
  }

  // update order to paid
  order.isPaid = true;
  order.paidAt = Date.now();

  const updatedOrder = await order.save();

  // Notify User
  notificationUtil.notifyUser(order.user, 'Order Paid', `Your order #${order._id} has been marked as paid.`, 'success');

  // Notify Vendors
  const notifiedVendors = new Set();
  if (order.cartItems) {
    order.cartItems.forEach(item => {
      const product = item.product;
      // Check structure deeply
      if (product && product.store && product.store.owner) {
        const ownerId = product.store.owner._id || product.store.owner;
        if (!notifiedVendors.has(ownerId.toString())) {
          notificationUtil.notifyVendor(ownerId, 'Order Paid', `Order #${order._id} has been paid.`, 'success');
          notifiedVendors.add(ownerId.toString());
        }
      }
    });
  }

  res.status(200).json({ status: 'success', data: updatedOrder });
});

// @desc    Update order delivered status
// @route   PUT /api/v1/orders/:id/deliver
// @access  Protected/Admin-Manager
exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate({
    path: 'cartItems.product',
    populate: { path: 'store' }
  });
  if (!order) {
    return next(
      new ApiError(
        `There is no such a order with this id:${req.params.id}`,
        404
      )
    );
  }

  // update order to paid
  order.isDelivered = true;
  order.deliveredAt = Date.now();

  const updatedOrder = await order.save();

  // Notify User
  notificationUtil.notifyUser(order.user, 'Order Delivered', `Your order #${order._id} has been delivered. Enjoy!`, 'success');

  // Notify Vendors
  const notifiedVendors = new Set();
  if (order.cartItems) {
    order.cartItems.forEach(item => {
      const product = item.product;
      if (product && product.store && product.store.owner) {
        const ownerId = product.store.owner._id || product.store.owner;
        if (!notifiedVendors.has(ownerId.toString())) {
          notificationUtil.notifyVendor(ownerId, 'Order Delivered', `Order #${order._id} has been delivered.`, 'success');
          notifiedVendors.add(ownerId.toString());
        }
      }
    });
  }

  res.status(200).json({ status: 'success', data: updatedOrder });
});

// @desc    Get checkout session from stripe and send it as response
// @route   GET /api/v1/orders/checkout-session/cartId
// @access  Protected/User
exports.checkoutSession = asyncHandler(async (req, res, next) => {
  // app settings
  const taxPrice = 0;
  const shippingPrice = 0;

  // 1) Get cart depend on cartId
  const cart = await Cart.findById(req.params.cartId);
  if (!cart) {
    return next(
      new ApiError(`There is no such cart with id ${req.params.cartId}`, 404)
    );
  }

  // 2) Get order price depend on cart price "Check if coupon apply"
  const cartPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalCartPrice;

  const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

  // 3) Create stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: req.user.email,
    client_reference_id: req.params.cartId,
    line_items: [
      {
        price_data: {
          currency: 'egp',
          product_data: {
            name: 'Order Payment',
          },
          unit_amount: totalOrderPrice * 100,
        },
        quantity: 1,
      },
    ],

    metadata: {
      shippingAddress: JSON.stringify(req.body.shippingAddress),
    },

    success_url: `${req.protocol}://${req.get('host')}/orders`,
    cancel_url: `${req.protocol}://${req.get('host')}/cart`,
  });

  // 4) send session to response
  res.status(200).json({ status: 'success', session });
});

const createCardOrder = async (session) => {
  const cartId = session.client_reference_id;
  const shippingAddress = session.metadata;
  const oderPrice = session.amount_total / 100;

  const cart = await Cart.findById(cartId).populate({
    path: 'cartItems.product',
    populate: { path: 'store', select: 'owner name' }
  });

  const user = await User.findOne({ email: session.customer_email });

  // 3) Create order with default paymentMethodType card
  const order = await Order.create({
    user: user._id,
    cartItems: cart.cartItems,
    shippingAddress,
    totalOrderPrice: oderPrice,
    isPaid: true,
    paidAt: Date.now(),
    paymentMethodType: 'card',
  });

  // 4) After creating order, decrement product quantity, increment product sold
  if (order) {
    const bulkOption = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product._id },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOption, {});

    // 5) Clear cart depend on cartId
    await Cart.findByIdAndDelete(cartId);

    // 6) Notifications
    // Notify Admin
    notificationUtil.notifyAdmin('New Order', `New Order #${order._id} (Paid via Card)`, 'success');

    // Notify Vendors
    const notifiedVendors = new Set();
    cart.cartItems.forEach(item => {
      const store = item.product.store;
      if (store && store.owner && !notifiedVendors.has(store.owner._id.toString())) {
        notificationUtil.notifyVendor(store.owner._id, 'New Order', `You have a new (Paid) order for ${store.name}`, 'info');
        notifiedVendors.add(store.owner._id.toString());
      }
    });

    // Notify User
    notificationUtil.notifyUser(order.user, 'Order Placed', `Your order #${order._id} has been placed successfully (Paid via Card).`, 'success');
  }
};

// @desc    This webhook will run when stripe payment success paid
// @route   POST /webhook-checkout
// @access  Protected/User
exports.webhookCheckout = asyncHandler(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    //  Create order
    createCardOrder(event.data.object);
  }

  res.status(200).json({ received: true });
});
