const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    phone: '+1234567890',
    isActive: true,
  },
  {
    name: 'Vendor User',
    email: 'vendor@example.com',
    password: 'password123',
    role: 'vendor',
    phone: '+1234567891',
    isActive: true,
    vendorInfo: {
      businessName: 'Test Vendor Business',
      businessAddress: '123 Vendor Street',
      isApproved: true,
    },
  },
  {
    name: 'Customer User',
    email: 'customer@example.com',
    password: 'password123',
    role: 'customer',
    phone: '+1234567892',
    isActive: true,
  },
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Delete existing test users
    await User.deleteMany({ email: { $in: users.map(u => u.email) } });
    console.log('Existing test users deleted');

    // Create new users
    for (const userData of users) {
      const user = await User.create(userData);
      console.log(`Created ${user.role}: ${user.email}`);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\nTest Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Admin:    admin@example.com / password123');
    console.log('Vendor:   vendor@example.com / password123');
    console.log('Customer: customer@example.com / password123');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedUsers();
