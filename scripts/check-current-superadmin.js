import mongoose from 'mongoose';

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

async function checkCurrentSuperadmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all superadmin accounts
    const superadmins = await User.find({ role: 'superadmin' });
    console.log('\n📋 Current Superadmin Accounts:');
    
    superadmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. Account Details:`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Active: ${admin.isActive}`);
      console.log(`   Last Updated: ${admin.updatedAt}`);
      console.log(`   ID: ${admin._id}`);
    });

    if (superadmins.length === 0) {
      console.log('❌ No superadmin accounts found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkCurrentSuperadmin();