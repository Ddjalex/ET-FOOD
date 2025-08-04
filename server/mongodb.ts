import mongoose from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb+srv://almeseged:A1l2m3e4s5@cluster0.t6sz6bo.mongodb.net/beu-delivery?retryWrites=true&w=majority&appName=Cluster0';

export async function connectToMongoDB() {
  try {
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