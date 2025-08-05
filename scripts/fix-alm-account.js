import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://almeseged:A1l2m3e4s5@cluster0.t6sz6bo.mongodb.net/beu-delivery?retryWrites=true&w=majority&appName=Cluster0';

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  password: String,
  role: { type: String, enum: ['customer', 'restaurant_admin', 'kitchen_staff', 'driver', 'superadmin'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  phoneNumber: String,
  telegramUserId: String,
  telegramUsername: String,
  profileImageUrl: String,
  restaurantId: String,
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'users'
});

const User = mongoose.model('User', userSchema);

async function fixAlmAccount() {
  try {
    console.log('🔧 Fixing alm@gmail.com account...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'alm@gmail.com' });
    
    if (!user) {
      console.log('❌ User alm@gmail.com not found');
      return;
    }

    console.log(`Found user: ${user.firstName} ${user.lastName}`);
    console.log(`Current email: ${user.email}`);
    console.log(`Current role: ${user.role}`);
    console.log(`Current active status: ${user.isActive}`);

    // Update user to superadmin and activate
    const updates = {
      role: 'superadmin',
      isActive: true,
      updatedAt: new Date()
    };

    const updatedUser = await User.findOneAndUpdate(
      { email: 'alm@gmail.com' },
      updates,
      { new: true }
    );

    console.log('✅ User updated successfully!');
    console.log(`New role: ${updatedUser.role}`);
    console.log(`New active status: ${updatedUser.isActive}`);
    console.log('🔑 Login credentials:');
    console.log('   Email: alm@gmail.com');
    console.log('   Password: beu123');

  } catch (error) {
    console.error('❌ Error fixing account:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixAlmAccount();