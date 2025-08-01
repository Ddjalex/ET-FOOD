import mongoose from 'mongoose';

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb+srv://almeseged:A1l2m3e4s5@cluster0.t6sz6bo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
export const connectDB = async () => {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log('Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Export mongoose connection
export const db = mongoose;
