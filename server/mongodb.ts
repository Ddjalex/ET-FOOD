import mongoose from 'mongoose';

// Use the hardcoded MongoDB Atlas connection string since it contains production data
const MONGODB_URI = 'mongodb+srv://almeseged:A1l2m3e4s5@cluster0.t6sz6bo.mongodb.net/test?retryWrites=true&w=majority';

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