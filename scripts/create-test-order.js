import mongoose from 'mongoose';

// Schema for testing
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  customerId: { type: String, required: true },
  restaurantId: { type: String, required: true },
  items: [{ 
    name: String, 
    price: Number, 
    quantity: Number,
    id: String 
  }],
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { type: String, default: 'confirmed' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deliveryAddress: String,
  paymentMethod: String,
  specialInstructions: String
}, { collection: 'orders' });

const Order = mongoose.model('Order', orderSchema);

async function createTestOrder() {
  try {
    await mongoose.connect('mongodb://localhost:27017/beu_delivery');
    console.log('Connected to MongoDB');

    // Create a test order with status 'confirmed' so kitchen staff can start preparing
    const testOrder = new Order({
      orderNumber: `ORD-${Date.now()}`,
      customerId: '8d52ee1b-fb57-489f-a75f-2497e30f0270', // Real customer ID
      restaurantId: '689208e3f476f48ad7cfdcc3', // Restaurant ID
      items: [
        {
          id: 'item1',
          name: 'Injera with Doro Wot',
          price: 25.00,
          quantity: 2
        },
        {
          id: 'item2', 
          name: 'Ethiopian Coffee',
          price: 8.00,
          quantity: 1
        }
      ],
      subtotal: 58.00,
      total: 65.00, // Including delivery
      status: 'confirmed',
      deliveryAddress: '123 Test Street, Addis Ababa',
      paymentMethod: 'cash',
      specialInstructions: 'Please ring doorbell twice'
    });

    const savedOrder = await testOrder.save();
    console.log('✅ Test order created successfully!');
    console.log(`Order ID: ${savedOrder._id}`);
    console.log(`Order Number: ${savedOrder.orderNumber}`);
    console.log(`Status: ${savedOrder.status}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test order:', error);
    process.exit(1);
  }
}

createTestOrder();