import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://almeseged:A1l2m3e4s5@cluster0.t6sz6bo.mongodb.net/beu-delivery';

const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  password: String,
  role: String,
  isActive: { type: Boolean, default: true },
  restaurantId: String,
  createdBy: String,
  telegramUserId: String,
  telegramUsername: String,
  phoneNumber: String,
  profileImageUrl: String
}, {
  timestamps: true,
  collection: 'users'
});

const User = mongoose.model('User', userSchema);

async function forcePasswordReset() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing superadmin and create fresh one
    await User.deleteMany({ role: 'superadmin' });
    console.log('Removed all existing superadmin accounts');

    // Create fresh superadmin with known credentials
    const hashedPassword = await bcrypt.hash('superadmin123', 12);
    
    const newSuperadmin = new User({
      email: 'superadmin@beu-delivery.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: hashedPassword,
      role: 'superadmin',
      isActive: true
    });

    const savedAdmin = await newSuperadmin.save();
    console.log('✅ Created fresh superadmin account:');
    console.log('Email: superadmin@beu-delivery.com');
    console.log('Password: superadmin123');
    console.log('ID:', savedAdmin._id);

    // Verify the password can be verified
    const testPassword = await bcrypt.compare('superadmin123', savedAdmin.password);
    console.log('Password verification test:', testPassword ? '✅ PASS' : '❌ FAIL');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

forcePasswordReset();