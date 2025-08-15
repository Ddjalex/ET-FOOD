// MongoDB connection using Mongoose
import { connectToMongoDB } from './mongodb';

// Initialize MongoDB connection
export let isMongoConnected = false;

// Use environment variable for MongoDB URI
const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

if (MONGODB_URI) {
  connectToMongoDB()
    .then(() => {
      isMongoConnected = true;
      console.log('MongoDB database connected successfully');
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB database:', error);
      isMongoConnected = false;
    });
} else {
  console.log('No MONGODB_URI or DATABASE_URL provided, using in-memory storage for development');
}

// Export for backwards compatibility (not used with MongoDB)
export const db = null;
export const pool = null;
