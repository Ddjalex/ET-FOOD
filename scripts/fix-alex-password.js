import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://almeseged:A1l2m3e4s5@cluster0.t6sz6bo.mongodb.net/';

// User schema (simplified)
const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  password: String,
  role: String,
  isActive: Boolean,
  restaurantId: String,
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);

async function fixAlexPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find ALEX Wondimu
    const user = await User.findOne({ email: 'alm@gmail.com' });
    if (!user) {
      console.log('User alm@gmail.com not found');
      return;
    }

    console.log('Found user:', user.firstName, user.lastName, 'Email:', user.email);
    console.log('Current password:', user.password ? 'Set' : 'Not set');

    // Hash the password 'beu123'
    const hashedPassword = await bcrypt.hash('beu123', 10);
    console.log('Hashed password:', hashedPassword);

    // Update the user's password
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword,
      updatedAt: new Date()
    });

    console.log('✅ Password updated successfully for alm@gmail.com');
    console.log('🔑 Login credentials:');
    console.log('   Email: alm@gmail.com');
    console.log('   Password: beu123');

  } catch (error) {
    console.error('Error fixing password:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixAlexPassword();