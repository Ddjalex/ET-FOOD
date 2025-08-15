// MongoDB connection using Mongoose
import { connectToMongoDB } from './mongodb';

// Initialize MongoDB connection
export let isMongoConnected = false;

// Use environment variable for MongoDB URI
const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

if (MONGODB_URI) {
  connectToMongoDB()
    .then(async () => {
      isMongoConnected = true;
      console.log('MongoDB database connected successfully');
      
      // Fix driver collection indexes after connection
      try {
        const { Driver } = await import('./models/Driver');
        const db = Driver.db;
        const collection = db.collection('drivers');
        
        // Drop problematic licenseNumber index if it exists
        try {
          await collection.dropIndex('licenseNumber_1');
          console.log('✅ Dropped problematic licenseNumber_1 index');
        } catch (error) {
          // Index doesn't exist, which is fine
          console.log('ℹ️ licenseNumber_1 index not found (this is expected)');
        }
        
        console.log('🔧 Driver collection indexes fixed');
      } catch (error) {
        console.warn('⚠️ Could not fix driver indexes:', (error as Error).message);
      }
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
