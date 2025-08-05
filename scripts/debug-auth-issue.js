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

async function debugAuthIssue() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the superadmin
    const superadmin = await User.findOne({ email: 'superadmin@beu-delivery.com' });
    if (!superadmin) {
      console.log('❌ No superadmin found');
      return;
    }

    console.log('📋 Superadmin Details:');
    console.log('  Email:', superadmin.email);
    console.log('  Active:', superadmin.isActive);
    console.log('  Role:', superadmin.role);
    console.log('  Password Hash:', superadmin.password.substring(0, 20) + '...');

    // Test fresh hash generation
    console.log('\n🔧 Testing Password Hashing:');
    const freshHash = await bcrypt.hash('superadmin123', 12);
    console.log('  Fresh hash generated:', freshHash.substring(0, 20) + '...');
    
    const verifyFresh = await bcrypt.compare('superadmin123', freshHash);
    console.log('  Fresh hash verification:', verifyFresh ? '✅ PASS' : '❌ FAIL');

    const verifyExisting = await bcrypt.compare('superadmin123', superadmin.password);
    console.log('  Existing hash verification:', verifyExisting ? '✅ PASS' : '❌ FAIL');

    // Update with fresh hash and verify all fields
    await User.findByIdAndUpdate(superadmin._id, {
      password: freshHash,
      isActive: true,
      role: 'superadmin'
    });

    console.log('\n✅ Updated superadmin with fresh password hash');
    console.log('📧 Login Credentials:');
    console.log('   Email: superadmin@beu-delivery.com');
    console.log('   Password: superadmin123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugAuthIssue();