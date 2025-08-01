import mongoose from 'mongoose';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Connect to MongoDB
export const connectDB = async () => {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Export mongoose connection
export const db = mongoose;
