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

async function resetSuperadminPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all superadmin accounts
    const superadmins = await User.find({ role: 'superadmin' });
    console.log('Found superadmin accounts:', superadmins.map(u => ({ 
      email: u.email, 
      isActive: u.isActive 
    })));

    if (superadmins.length === 0) {
      console.log('No superadmin accounts found. Creating new one...');
      
      const hashedPassword = await bcrypt.hash('superadmin123', 12);
      
      const newSuperadmin = new User({
        email: 'superadmin@beu-delivery.com',
        firstName: 'Super',
        lastName: 'Admin',
        password: hashedPassword,
        role: 'superadmin',
        isActive: true
      });

      await newSuperadmin.save();
      console.log('Created new superadmin account: superadmin@beu-delivery.com / superadmin123');
    } else {
      // Reset password for existing superadmin (use the first one)
      const admin = superadmins[0];
      const hashedPassword = await bcrypt.hash('superadmin123', 12);
      
      await User.findByIdAndUpdate(admin._id, {
        password: hashedPassword,
        isActive: true
      });

      console.log(`Reset password for ${admin.email} to: superadmin123`);
      console.log('Account reactivated and password reset completed.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetSuperadminPassword();