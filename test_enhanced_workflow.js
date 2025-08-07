import mongoose from 'mongoose';

// Test script to verify enhanced driver notification workflow
async function testEnhancedWorkflow() {
  try {
    console.log('🧪 Testing Enhanced Driver Notification Workflow');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beu_delivery');
    console.log('✅ Connected to MongoDB');

    // Import models using dynamic import
    const { default: Order } = await import('./server/models/Order.js');
    const { default: Driver } = await import('./server/models/Driver.js');
    const { default: Restaurant } = await import('./server/models/Restaurant.js');

    // Find existing order in 'confirmed' status
    const confirmedOrder = await Order.findOne({ status: 'confirmed' });
    if (!confirmedOrder) {
      console.log('❌ No confirmed orders found to test');
      return;
    }

    console.log(`📋 Found confirmed order: ${confirmedOrder.orderNumber}`);

    // Find available driver
    const availableDriver = await Driver.findOne({ 
      isApproved: true, 
      isOnline: true, 
      isAvailable: true 
    });
    
    if (!availableDriver) {
      console.log('❌ No available drivers found');
      return;
    }

    console.log(`🚗 Found available driver: ${availableDriver.name} (${availableDriver.id})`);

    // Test 1: Start Preparing (should trigger driver assignment)
    console.log('\n🧪 TEST 1: Start Preparing');
    const { orderService } = await import('./server/services/orderService.js');
    
    console.log(`Updating order ${confirmedOrder.id} to 'preparing' status...`);
    const preparingOrder = await orderService.updateOrderStatus(confirmedOrder.id, 'preparing');
    console.log(`✅ Order updated to preparing: ${preparingOrder.orderNumber}`);

    // Wait 2 seconds for async processes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if driver was assigned
    const updatedOrder = await Order.findById(confirmedOrder.id);
    if (updatedOrder.driverId) {
      console.log(`✅ Driver assigned during preparing phase: ${updatedOrder.driverId}`);
    } else {
      console.log(`⚠️ No driver assigned during preparing phase`);
    }

    // Test 2: Ready for Pickup
    console.log('\n🧪 TEST 2: Ready for Pickup');
    console.log(`Updating order ${updatedOrder.id} to 'ready' status...`);
    const readyOrder = await orderService.updateOrderStatus(updatedOrder.id, 'ready');
    console.log(`✅ Order updated to ready: ${readyOrder.orderNumber}`);

    // Wait 2 seconds for async processes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Final verification
    const finalOrder = await Order.findById(updatedOrder.id);
    console.log('\n📊 FINAL RESULTS:');
    console.log(`Order: ${finalOrder.orderNumber}`);
    console.log(`Status: ${finalOrder.status}`);
    console.log(`Driver Assigned: ${finalOrder.driverId ? 'Yes' : 'No'}`);
    console.log(`Driver ID: ${finalOrder.driverId || 'None'}`);

    if (finalOrder.driverId) {
      const assignedDriver = await Driver.findById(finalOrder.driverId);
      console.log(`Driver Name: ${assignedDriver?.name || 'Unknown'}`);
      console.log(`Driver Available: ${assignedDriver?.isAvailable ? 'No (Busy)' : 'Yes'}`);
    }

    console.log('\n✅ Enhanced workflow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testEnhancedWorkflow();