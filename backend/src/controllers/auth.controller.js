const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

// Generate JWT Token with optional company context
const generateToken = (userId, companyId = null) => {
  const payload = { id: userId };
  if (companyId) {
    payload.companyId = companyId;
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, companyName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      phone
    });

    // If registering as admin/vendor, create or join a company
    if (role === 'admin' && companyName) {
      const company = await Company.create({
        name: companyName,
        owner: user._id
      });

      user.companyMemberships = [{
        company: company._id,
        role: 'owner',
        isDefault: true,
        permissions: ['all']
      }];
      user.activeCompany = company._id;
      await user.save();
    }

    const token = generateToken(user._id, user.activeCompany);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          activeCompany: user.activeCompany
        },
        token,
        requiresCompanySelection: false
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user with company memberships populated
    const user = await User.findOne({ email })
      .select('+password')
      .populate('companyMemberships.company', 'name slug isTestCompany isActive')
      .populate('activeCompany', 'name slug');
      
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get active company memberships
    const activeCompanies = user.companyMemberships?.filter(m => 
      m.isActive && m.company?.isActive
    ) || [];

    // Determine if company selection is needed
    const requiresCompanySelection = activeCompanies.length > 1 && !user.activeCompany;
    
    // Auto-select company if only one exists
    let selectedCompany = user.activeCompany;
    if (!selectedCompany && activeCompanies.length === 1) {
      selectedCompany = activeCompanies[0].company._id;
      user.activeCompany = selectedCompany;
      await user.save();
    }

    const token = generateToken(user._id, selectedCompany);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          activeCompany: selectedCompany ? {
            id: selectedCompany._id || selectedCompany,
            name: user.activeCompany?.name
          } : null
        },
        token,
        requiresCompanySelection,
        companies: activeCompanies.map(m => ({
          id: m.company._id,
          name: m.company.name,
          slug: m.company.slug,
          role: m.role,
          isTestCompany: m.company.isTestCompany
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Select company (for multi-company users)
// @route   POST /api/auth/select-company
// @access  Private
exports.selectCompany = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const user = await User.findById(req.user.id)
      .populate('companyMemberships.company', 'name slug isActive');

    // Verify user has access to this company
    const membership = user.companyMemberships.find(
      m => m.company._id.toString() === companyId && m.isActive && m.company.isActive
    );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this company'
      });
    }

    // Update user's active company
    user.activeCompany = companyId;
    await user.save();

    // Generate new token with company context
    const token = generateToken(user._id, companyId);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyRole: membership.role,
          activeCompany: {
            id: membership.company._id,
            name: membership.company.name,
            slug: membership.company.slug
          }
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('companyMemberships.company', 'name slug isTestCompany isActive')
      .populate('activeCompany', 'name slug');

    const activeCompanies = user.companyMemberships?.filter(m => 
      m.isActive && m.company?.isActive
    ) || [];

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
        activeCompany: user.activeCompany ? {
          id: user.activeCompany._id,
          name: user.activeCompany.name,
          slug: user.activeCompany.slug
        } : null,
        companies: activeCompanies.map(m => ({
          id: m.company._id,
          name: m.company.name,
          slug: m.company.slug,
          role: m.role,
          isTestCompany: m.company.isTestCompany
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, address },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
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

// @desc    Update user status (Admin)
// @route   PUT /api/auth/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve vendor (Admin)
// @route   PUT /api/auth/vendors/:id/approve
// @access  Private/Admin
exports.approveVendor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    user.vendorInfo.isApproved = true;
    await user.save();

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
