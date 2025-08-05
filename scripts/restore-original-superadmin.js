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

async function restoreOriginalSuperadmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check current superadmin state
    const superadmins = await User.find({ role: 'superadmin' });
    console.log('Current superadmin accounts:', superadmins.length);

    if (superadmins.length > 0) {
      const admin = superadmins[0]; // Take the first/main superadmin
      console.log(`Found superadmin: ${admin.email}`);
      
      // Reset to original working credentials
      const hashedPassword = await bcrypt.hash('superadmin123', 12);
      
      await User.findByIdAndUpdate(admin._id, {
        email: 'superadmin@beu-delivery.com',
        firstName: 'Super',
        lastName: 'Admin', 
        password: hashedPassword,
        isActive: true
      });

      console.log('✅ Superadmin account restored to original state:');
      console.log('Email: superadmin@beu-delivery.com');
      console.log('Password: superadmin123');
      console.log('Status: Active');
      
    } else {
      console.log('No superadmin found, creating new one...');
      
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
      console.log('✅ New superadmin account created:');
      console.log('Email: superadmin@beu-delivery.com');
      console.log('Password: superadmin123');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

restoreOriginalSuperadmin();