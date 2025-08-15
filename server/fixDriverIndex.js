// Script to fix the driver collection index issue
import mongoose from 'mongoose';

async function fixDriverIndexes() {
  try {
    console.log('🔧 Connecting to MongoDB to fix driver indexes...');
    
    // Connect using the existing connection
    const db = mongoose.connection.db;
    const collection = db.collection('drivers');
    
    console.log('📊 Checking existing indexes...');
    const indexes = await collection.listIndexes().toArray();
    console.log('Existing indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Drop problematic indexes if they exist
    try {
      await collection.dropIndex('licenseNumber_1');
      console.log('✅ Dropped licenseNumber_1 index');
    } catch (error) {
      console.log('ℹ️ licenseNumber_1 index not found or already dropped');
    }
    
    // Create sparse unique index for licenseNumber (only indexes non-null values)
    try {
      await collection.createIndex(
        { licenseNumber: 1 }, 
        { unique: true, sparse: true, name: 'licenseNumber_sparse' }
      );
      console.log('✅ Created sparse unique index for licenseNumber');
    } catch (error) {
      console.log('ℹ️ Sparse index already exists or error:', error.message);
    }
    
    console.log('🎉 Driver index fix completed');
    
  } catch (error) {
    console.error('❌ Error fixing driver indexes:', error);
  }
}

// Export the function
export default fixDriverIndexes;