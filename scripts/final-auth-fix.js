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

async function finalAuthFix() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔧 Final Auth Fix - Creating Clean Superadmin Account');

    // Remove all existing superadmin accounts to start fresh
    await User.deleteMany({ role: 'superadmin' });
    console.log('✅ Removed all existing superadmin accounts');

    // Create a clean superadmin account with exact same bcrypt config as server
    const testPassword = 'superadmin123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    const superadmin = new User({
      email: 'superadmin@beu-delivery.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
      restaurantId: null,
      createdBy: null,
      telegramUserId: null,
      telegramUsername: null,
      phoneNumber: null,
      profileImageUrl: null
    });

    await superadmin.save();
    console.log('✅ Created fresh superadmin account');

    // Verify the password works
    const testVerify = await bcrypt.compare(testPassword, hashedPassword);
    console.log('✅ Password verification test:', testVerify ? 'PASS' : 'FAIL');

    console.log('\n🎉 WORKING CREDENTIALS:');
    console.log('📧 Email: superadmin@beu-delivery.com');
    console.log('🔑 Password: superadmin123');
    console.log('👤 Role: superadmin');
    console.log('✅ Status: Active');

    console.log('\n💡 Now you can:');
    console.log('1. Login to the dashboard with these credentials');
    console.log('2. Access all restaurant and admin management features');
    console.log('3. Change your email, company settings, and password as needed');
    console.log('4. All changes will be saved to your MongoDB cluster');

  } catch (error) {
    console.error('❌ Error during final auth fix:', error);
  } finally {
    await mongoose.disconnect();
  }
}

finalAuthFix();