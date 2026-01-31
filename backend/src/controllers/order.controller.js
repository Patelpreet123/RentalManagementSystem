const Order = require('../models/Order');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const reservationService = require('../services/reservation.service');
const pricingService = require('../services/pricing.service');

// @desc    Create order
// @route   POST /api/orders
// @access  Private/Customer
exports.createOrder = async (req, res) => {
  try {
    const { items, rentalPeriod, deliveryMethod, deliveryAddress, notes } = req.body;

    // Validate items
    const orderItems = [];
    let subtotal = 0;
    let totalDeposit = 0;
    let vendorId = null;
    let companyId = null;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      // Set vendor (all items must be from same vendor in this MVP)
      if (!vendorId) {
        vendorId = product.vendor;
        companyId = product.company; // Get company from product
      } else if (product.vendor.toString() !== vendorId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'All items must be from the same vendor'
        });
      }

      // Calculate pricing
      const duration = Math.ceil(
        (new Date(rentalPeriod.endDate) - new Date(rentalPeriod.startDate)) / (1000 * 60 * 60 * 24)
      ) || 1;
      const itemPrice = pricingService.calculateRentalPrice(product.pricing, duration, item.quantity);

      orderItems.push({
        product: item.productId,
        quantity: item.quantity,
        pricePerDay: product.pricing.daily,
        totalPrice: itemPrice
      });

      subtotal += itemPrice;
      totalDeposit += (product.pricing.securityDeposit || 0) * item.quantity;
    }

    // Calculate tax (10%)
    const tax = subtotal * 0.1;
    const total = subtotal + tax + totalDeposit;

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;

    // Create order with company context
    const order = await Order.create({
      orderNumber,
      customer: req.user.id,
      vendor: vendorId,
      company: companyId, // Include company from product
      items: orderItems,
      rentalPeriod: {
        startDate: rentalPeriod.startDate,
        endDate: rentalPeriod.endDate,
        duration: Math.ceil(
          (new Date(rentalPeriod.endDate) - new Date(rentalPeriod.startDate)) / (1000 * 60 * 60 * 24)
        ) || 1,
        durationType: 'days'
      },
      pricing: {
        subtotal,
        securityDeposit: totalDeposit,
        tax,
        total
      },
      status: 'confirmed',
      paymentStatus: 'paid',
      deliveryMethod,
      deliveryAddress,
      notes: { customer: notes },
      timeline: [
        { status: 'confirmed', note: 'Order placed successfully' },
        { status: 'paid', note: 'Payment completed' }
      ]
    });

    // Auto-generate invoice for the order
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${Date.now()}-${invoiceCount + 1}`;

    // Build invoice items from order items
    const invoiceItems = orderItems.map(item => ({
      description: `Product Rental (${item.quantity} x ${Math.ceil(
        (new Date(rentalPeriod.endDate) - new Date(rentalPeriod.startDate)) / (1000 * 60 * 60 * 24)
      ) || 1} days)`,
      quantity: item.quantity,
      unitPrice: item.pricePerDay,
      totalPrice: item.totalPrice
    }));

    // Add security deposit as line item if exists
    if (totalDeposit > 0) {
      invoiceItems.push({
        description: 'Security Deposit (Refundable)',
        quantity: 1,
        unitPrice: totalDeposit,
        totalPrice: totalDeposit
      });
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      order: order._id,
      customer: req.user.id,
      vendor: vendorId,
      company: companyId,
      items: invoiceItems,
      amounts: {
        subtotal,
        tax,
        discount: 0,
        securityDeposit: totalDeposit,
        total,
        amountPaid: total,
        amountDue: 0
      },
      status: 'paid',
      dueDate: new Date(),
      paidDate: new Date(),
      payments: [{
        amount: total,
        method: 'card',
        date: new Date(),
        transactionId: `PAY-${Date.now()}`
      }]
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('vendor', 'name vendorInfo.businessName')
      .populate('items.product', 'name images');

    res.status(201).json({
      success: true,
      data: populatedOrder
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get customer orders
// @route   GET /api/orders/my-orders
// @access  Private/Customer
exports.getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { customer: req.user.id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('vendor', 'name vendorInfo.businessName')
      .populate('items.product', 'name images')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get vendor orders
// @route   GET /api/orders/vendor-orders
// @access  Private/Vendor
exports.getVendorOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { vendor: req.user.id };
    
    // Scope by company if available
    if (req.companyId) {
      query.company = req.companyId;
    }
    
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images')
      .populate('company', 'name slug')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('vendor', 'name vendorInfo.businessName phone')
      .populate('items.product', 'name images pricing');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isCustomer = order.customer._id.toString() === req.user.id;
    const isVendor = order.vendor._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Vendor
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['confirmed', 'picked-up', 'active', 'returned', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    order.status = status;
    order.timeline.push({
      status,
      note: note || `Order status updated to ${status}`,
      date: new Date()
    });

    // Update reservation status based on order status
    if (status === 'picked-up' || status === 'active') {
      await reservationService.updateReservationStatus(order._id, 'active');
    } else if (status === 'returned' || status === 'completed') {
      await reservationService.updateReservationStatus(order._id, 'completed');
      // Release inventory
      for (const item of order.items) {
        await reservationService.releaseInventory(item.product, item.quantity);
      }
    } else if (status === 'cancelled') {
      await reservationService.updateReservationStatus(order._id, 'cancelled');
      // Release inventory
      for (const item of order.items) {
        await reservationService.releaseInventory(item.product, item.quantity);
      }
    }

    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private/Customer
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if customer owns this order
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order in current status'
      });
    }

    order.status = 'cancelled';
    order.timeline.push({
      status: 'cancelled',
      note: 'Order cancelled by customer',
      date: new Date()
    });

    // Cancel reservations and release inventory
    await reservationService.updateReservationStatus(order._id, 'cancelled');
    for (const item of order.items) {
      await reservationService.releaseInventory(item.product, item.quantity);
    }

    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('customer', 'name email')
      .populate('vendor', 'name vendorInfo.businessName')
      .populate('items.product', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order stats
// @route   GET /api/orders/stats
// @access  Private/Admin/Vendor
exports.getOrderStats = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'vendor') {
      query.vendor = req.user.id;
    }

    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments(query);
    const totalRevenue = await Order.aggregate([
      { $match: { ...query, status: { $in: ['completed', 'active'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
