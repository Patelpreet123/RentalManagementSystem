const Product = require('../models/Product');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get vendor dashboard stats
// @route   GET /api/dashboard/vendor
// @access  Private/Vendor
exports.getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const companyId = req.companyId;

    // Validate vendorId is a valid ObjectId
    if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor ID'
      });
    }

    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

    // Build query with optional company scope
    const productQuery = { vendor: vendorObjectId };
    const orderQuery = { vendor: vendorObjectId };
    
    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      const companyObjectId = new mongoose.Types.ObjectId(companyId);
      productQuery.company = companyObjectId;
      orderQuery.company = companyObjectId;
    }

    // Get product stats
    const totalProducts = await Product.countDocuments(productQuery);
    const activeProducts = await Product.countDocuments({ ...productQuery, isActive: true });

    // Get order stats
    const totalOrders = await Order.countDocuments(orderQuery);
    const pendingOrders = await Order.countDocuments({ ...orderQuery, status: 'pending' });
    const activeRentals = await Order.countDocuments({ ...orderQuery, status: 'active' });
    const completedOrders = await Order.countDocuments({ ...orderQuery, status: 'completed' });

    // Calculate revenue from completed/paid orders
    const revenueResult = await Order.aggregate([
      { 
        $match: { 
          vendor: vendorObjectId,
          ...(companyId && mongoose.Types.ObjectId.isValid(companyId) && { company: new mongoose.Types.ObjectId(companyId) }),
          paymentStatus: 'paid'
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$pricing.total' },
          orderCount: { $sum: 1 }
        } 
      }
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Get recent orders
    const recentOrders = await Order.find(orderQuery)
      .populate('customer', 'name email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get low stock products
    const lowStockProducts = await Product.find({
      ...productQuery,
      isActive: true,
      'inventory.availableQuantity': { $lte: 2 }
    }).limit(5);

    // Monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          vendor: vendorObjectId,
          ...(companyId && mongoose.Types.ObjectId.isValid(companyId) && { company: new mongoose.Types.ObjectId(companyId) }),
          paymentStatus: 'paid',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          activeProducts,
          totalOrders,
          pendingOrders,
          activeRentals,
          completedOrders,
          totalRevenue
        },
        recentOrders,
        lowStockProducts,
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/dashboard/admin
// @access  Private/Admin
exports.getAdminDashboard = async (req, res) => {
  try {
    const companyId = req.companyId;

    // Build query with company scope
    const baseQuery = companyId ? { company: companyId } : {};

    // User stats
    const totalUsers = await User.countDocuments();
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const pendingVendors = await User.countDocuments({ 
      role: 'vendor', 
      'vendorInfo.isApproved': false 
    });
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Product stats
    const totalProducts = await Product.countDocuments(baseQuery);
    const activeProducts = await Product.countDocuments({ ...baseQuery, isActive: true });

    // Order stats
    const totalOrders = await Order.countDocuments(baseQuery);
    const activeRentals = await Order.countDocuments({ ...baseQuery, status: 'active' });
    const pendingOrders = await Order.countDocuments({ ...baseQuery, status: 'pending' });

    // Revenue calculation
    const revenueResult = await Order.aggregate([
      { 
        $match: { 
          ...(companyId && { company: new mongoose.Types.ObjectId(companyId) }),
          paymentStatus: 'paid'
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$pricing.total' }
        } 
      }
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Recent activity
    const recentOrders = await Order.find(baseQuery)
      .populate('customer', 'name email')
      .populate('vendor', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Top performing vendors
    const topVendors = await Order.aggregate([
      { 
        $match: { 
          ...(companyId && { company: new mongoose.Types.ObjectId(companyId) }),
          paymentStatus: 'paid'
        } 
      },
      {
        $group: {
          _id: '$vendor',
          totalRevenue: { $sum: '$pricing.total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'vendorInfo'
        }
      },
      {
        $unwind: '$vendorInfo'
      },
      {
        $project: {
          _id: 1,
          name: '$vendorInfo.name',
          businessName: '$vendorInfo.vendorInfo.businessName',
          totalRevenue: 1,
          orderCount: 1
        }
      }
    ]);

    // Monthly stats (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Order.aggregate([
      {
        $match: {
          ...(companyId && { company: new mongoose.Types.ObjectId(companyId) }),
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$pricing.total', 0] } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalVendors,
          pendingVendors,
          totalCustomers,
          totalProducts,
          activeProducts,
          totalOrders,
          activeRentals,
          pendingOrders,
          totalRevenue
        },
        recentOrders,
        topVendors,
        monthlyStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get customer dashboard stats
// @route   GET /api/dashboard/customer
// @access  Private/Customer
exports.getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.user.id;

    // Order stats
    const totalOrders = await Order.countDocuments({ customer: customerId });
    const activeRentals = await Order.countDocuments({ customer: customerId, status: 'active' });
    const completedRentals = await Order.countDocuments({ customer: customerId, status: 'completed' });
    const pendingOrders = await Order.countDocuments({ customer: customerId, status: 'pending' });

    // Total spent
    const spentResult = await Order.aggregate([
      { 
        $match: { 
          customer: new mongoose.Types.ObjectId(customerId),
          paymentStatus: 'paid'
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalSpent: { $sum: '$pricing.total' }
        } 
      }
    ]);

    const totalSpent = spentResult[0]?.totalSpent || 0;

    // Recent rentals
    const recentRentals = await Order.find({ customer: customerId })
      .populate('items.product', 'name images pricing')
      .populate('vendor', 'name vendorInfo.businessName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Upcoming returns
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingReturns = await Order.find({
      customer: customerId,
      status: 'active',
      'rentalPeriod.endDate': { $gte: today, $lte: nextWeek }
    })
    .populate('items.product', 'name images')
    .sort({ 'rentalPeriod.endDate': 1 });

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          activeRentals,
          completedRentals,
          pendingOrders,
          totalSpent
        },
        recentRentals,
        upcomingReturns
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
