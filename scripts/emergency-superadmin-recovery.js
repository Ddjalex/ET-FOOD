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

async function emergencyRecovery() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔧 Emergency Superadmin Recovery Tool');
    console.log('Connected to MongoDB');

    // Find all superadmin accounts
    const superadmins = await User.find({ role: 'superadmin' });
    console.log(`\nFound ${superadmins.length} superadmin account(s):`);
    
    superadmins.forEach((admin, index) => {
      console.log(`${index + 1}. Email: ${admin.email}`);
      console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Active: ${admin.isActive}`);
      console.log(`   Created: ${admin.createdAt}`);
      console.log('');
    });

    // Reactivate all superadmin accounts and reset passwords
    const hashedPassword = await bcrypt.hash('superadmin123', 12);
    
    const result = await User.updateMany(
      { role: 'superadmin' },
      { 
        isActive: true,
        password: hashedPassword
      }
    );

    console.log(`✅ Recovery completed! Updated ${result.modifiedCount} superadmin account(s)`);
    console.log('\n🔑 Default login credentials:');
    console.log('Password: superadmin123');
    console.log('\n📧 Available superadmin emails:');
    
    const updatedSuperadmins = await User.find({ role: 'superadmin' });
    updatedSuperadmins.forEach(admin => {
      console.log(`- ${admin.email}`);
    });

    console.log('\n💡 Remember to change your password after logging in!');

  } catch (error) {
    console.error('❌ Error during recovery:', error);
  } finally {
    await mongoose.disconnect();
  }
}

emergencyRecovery();