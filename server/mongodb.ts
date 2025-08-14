import mongoose from 'mongoose';

// Use environment variable for MongoDB URI (secure approach)
const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

export async function connectToMongoDB() {
  try {
    if (!MONGODB_URI) {
      throw new Error('No MongoDB URI available');
    }
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB successfully');
    }
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export { mongoose };