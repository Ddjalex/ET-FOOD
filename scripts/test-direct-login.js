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

async function testDirectLogin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the current superadmin
    const superadmin = await User.findOne({ role: 'superadmin' });
    if (!superadmin) {
      console.log('❌ No superadmin found');
      return;
    }

    console.log('Found superadmin:');
    console.log('  Email:', superadmin.email);
    console.log('  Active:', superadmin.isActive);
    console.log('  Role:', superadmin.role);

    // Test password verification
    const testPasswords = ['superadmin123', 'admin123', 'beu123'];
    
    for (const testPass of testPasswords) {
      const isValid = await bcrypt.compare(testPass, superadmin.password);
      console.log(`  Password "${testPass}": ${isValid ? '✅ MATCH' : '❌ NO MATCH'}`);
      if (isValid) {
        console.log(`\n🎉 WORKING CREDENTIALS:`);
        console.log(`Email: ${superadmin.email}`);
        console.log(`Password: ${testPass}`);
        break;
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testDirectLogin();