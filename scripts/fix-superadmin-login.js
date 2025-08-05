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

async function fixSuperadminLogin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all superadmin accounts
    const superadmins = await User.find({ role: 'superadmin' });
    console.log('Found superadmin accounts:', superadmins.map(u => ({ 
      email: u.email, 
      isActive: u.isActive,
      firstName: u.firstName,
      lastName: u.lastName 
    })));

    // Reactivate all superadmin accounts
    const result = await User.updateMany(
      { role: 'superadmin' },
      { isActive: true }
    );

    console.log(`Reactivated ${result.modifiedCount} superadmin accounts`);

    // Show current superadmin accounts
    const updatedSuperadmins = await User.find({ role: 'superadmin' });
    console.log('Updated superadmin accounts:');
    updatedSuperadmins.forEach(admin => {
      console.log(`- Email: ${admin.email}, Active: ${admin.isActive}, Name: ${admin.firstName} ${admin.lastName}`);
    });

    console.log('\nYou can now login with your updated email and password.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixSuperadminLogin();