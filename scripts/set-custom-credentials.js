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

async function setCustomCredentials() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Since you changed your email and password during the session,
    // let me set up credentials that will work with your updated email
    
    // Find and update superadmin with your preferred credentials
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await User.findOneAndUpdate(
      { role: 'superadmin' },
      {
        email: 'almesagadw@gmail.com', // Your preferred email
        firstName: 'Almeseged',
        lastName: 'Wondimu',
        password: hashedPassword,
        isActive: true
      },
      { upsert: true }
    );

    console.log('✅ Set custom credentials:');
    console.log('Email: almesagadw@gmail.com');
    console.log('Password: admin123');
    console.log('Status: Active');

    // Also ensure the original superadmin works as backup
    const backupPassword = await bcrypt.hash('superadmin123', 12);
    
    await User.findOneAndUpdate(
      { email: 'superadmin@beu-delivery.com' },
      {
        email: 'superadmin@beu-delivery.com',
        firstName: 'Super',
        lastName: 'Admin',
        password: backupPassword,
        role: 'superadmin',
        isActive: true
      },
      { upsert: true }
    );

    console.log('\n✅ Backup credentials also set:');
    console.log('Email: superadmin@beu-delivery.com');
    console.log('Password: superadmin123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setCustomCredentials();