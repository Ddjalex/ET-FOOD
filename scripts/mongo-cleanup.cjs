// MongoDB cleanup script for driver collection
const mongoose = require('mongoose');

async function cleanupDriversDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB using the same connection string format
    const mongoUri = process.env.DATABASE_URL || 'mongodb://localhost:27017/beu-delivery';
    await mongoose.connect(mongoUri);
    
    const db = mongoose.connection.db;
    const driversCollection = db.collection('drivers');
    
    console.log('🔍 Checking current state of drivers collection...');
    
    // Get all drivers to see current state
    const allDrivers = await driversCollection.find({}).toArray();
    console.log(`📊 Total drivers in collection: ${allDrivers.length}`);
    
    // Find documents with problematic id fields
    const brokenDrivers = await driversCollection.find({
      $or: [
        { id: null },
        { id: undefined },
        { id: { $exists: false } },
        { id: "" }
      ]
    }).toArray();
    
    console.log(`🚨 Found ${brokenDrivers.length} broken driver documents with null/undefined ids`);
    
    if (brokenDrivers.length > 0) {
      console.log('Broken drivers details:');
      brokenDrivers.forEach((driver, index) => {
        console.log(`  ${index + 1}. _id: ${driver._id}, name: ${driver.name || 'N/A'}, telegramId: ${driver.telegramId || 'N/A'}, id: ${driver.id}`);
      });
      
      // Delete broken documents
      console.log('🗑️  Removing broken driver documents...');
      const deleteResult = await driversCollection.deleteMany({
        $or: [
          { id: null },
          { id: undefined },
          { id: { $exists: false } },
          { id: "" }
        ]
      });
      
      console.log(`✅ Deleted ${deleteResult.deletedCount} broken driver documents`);
    }
    
    // List and drop problematic indexes
    console.log('🔍 Checking indexes...');
    const indexes = await driversCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Drop the problematic id index if it exists
    try {
      await driversCollection.dropIndex('id_1');
      console.log('✅ Successfully dropped problematic id_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  id_1 index does not exist - no need to drop');
      } else {
        console.log('⚠️  Error dropping id_1 index:', error.message);
      }
    }
    
    // Drop any other id-related indexes
    try {
      const indexesToDrop = indexes.filter(idx => 
        idx.name !== '_id_' && 
        idx.key && 
        Object.keys(idx.key).includes('id')
      );
      
      for (const index of indexesToDrop) {
        try {
          await driversCollection.dropIndex(index.name);
          console.log(`✅ Dropped index: ${index.name}`);
        } catch (dropError) {
          console.log(`⚠️  Could not drop index ${index.name}:`, dropError.message);
        }
      }
    } catch (error) {
      console.log('⚠️  Error checking/dropping indexes:', error.message);
    }
    
    // Verify cleanup
    const remainingBroken = await driversCollection.find({
      $or: [
        { id: null },
        { id: undefined },
        { id: { $exists: false } },
        { id: "" }
      ]
    }).toArray();
    
    console.log(`🔍 Remaining broken documents: ${remainingBroken.length}`);
    
    if (remainingBroken.length === 0) {
      console.log('🎉 Database cleanup completed successfully!');
      console.log('✅ All problematic documents removed');
      console.log('✅ Problematic indexes dropped');
    } else {
      console.log('⚠️  Some problematic documents still remain');
    }
    
    // Show final state
    const finalDrivers = await driversCollection.find({}).toArray();
    console.log(`📊 Final driver count: ${finalDrivers.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  }
}

cleanupDriversDatabase();