// MongoDB connection using Mongoose (since DATABASE_URL is MongoDB)
import { connectToMongoDB } from './mongodb';

// Initialize MongoDB connection
export let isMongoConnected = false;

// Force MongoDB connection with the provided URI
const MONGODB_URI = 'mongodb+srv://almeseged:A1l2m3e4s5@cluster0.t6sz6bo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

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
