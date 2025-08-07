import { Driver } from '../server/models/Driver.js';
import { connectToMongoDB } from '../server/mongodb.js';

async function cleanupBrokenDrivers() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await connectToMongoDB();
    
    console.log('🧹 Searching for broken driver documents...');
    
    // Find documents with null or undefined id fields
    const brokenDrivers = await Driver.find({
      $or: [
        { id: null },
        { id: undefined },
        { id: { $exists: false } }
      ]
    });
    
    console.log(`Found ${brokenDrivers.length} broken driver documents`);
    
    if (brokenDrivers.length > 0) {
      console.log('Broken drivers:', brokenDrivers.map(d => ({
        _id: d._id,
        name: d.name,
        telegramId: d.telegramId,
        id: d.id
      })));
      
      // Remove broken documents
      const result = await Driver.deleteMany({
        $or: [
          { id: null },
          { id: undefined },
          { id: { $exists: false } }
        ]
      });
      
      console.log(`✅ Removed ${result.deletedCount} broken driver documents`);
    }
    
    // Also remove any duplicate indexes if they exist
    try {
      await Driver.collection.dropIndex('id_1');
      console.log('✅ Dropped problematic id index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  No id index to drop');
      } else {
        console.log('⚠️  Error dropping index:', error.message);
      }
    }
    
    console.log('🎉 Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupBrokenDrivers();