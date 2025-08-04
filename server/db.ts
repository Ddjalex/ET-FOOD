// MongoDB connection using Mongoose (since DATABASE_URL is MongoDB)
import { connectToMongoDB } from './mongodb';

// Initialize MongoDB connection
export let isMongoConnected = false;

if (process.env.DATABASE_URL) {
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
  console.log('No DATABASE_URL provided, using in-memory storage for development');
}

// Export for backwards compatibility (not used with MongoDB)
export const db = null;
export const pool = null;
