import bcrypt from 'bcryptjs';
import { connectDB } from '../server/db.js';
import { User } from '../server/models/index.js';
import crypto from 'crypto';

async function createSuperAdmin() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('Superadmin already exists:', existingSuperAdmin.email);
      return;
    }

    // Create superadmin user
    const password = 'superadmin123'; // Change this to a secure password
    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = new User({
      id: crypto.randomUUID(),
      email: 'superadmin@beu-delivery.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      password: hashedPassword,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await superAdmin.save();
    console.log('Superadmin created successfully!');
    console.log('Email: superadmin@beu-delivery.com');
    console.log('Password: superadmin123');
    console.log('');
    console.log('Please change the password after first login!');

  } catch (error) {
    console.error('Error creating superadmin:', error);
  }
}

createSuperAdmin();