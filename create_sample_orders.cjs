const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost/beu_delivery');
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Order schema (simplified for this script)
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  restaurantId: { type: String, required: true },
  driverId: { type: String, default: null },
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'preparing', 'ready_for_pickup',
      'driver_assigned', 'picked_up', 'delivered', 'cancelled'
    ],
    default: 'pending'
  },
  items: [{
    name: String,
    quantity: Number,
    price: Number,
    customizations: [String]
  }],
  total: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  deliveryLocation: {
    lat: Number,
    lng: Number
  },
  customerNotes: { type: String, default: null },
  estimatedDeliveryTime: { type: Date, default: null },
  actualDeliveryTime: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Restaurant schema (simplified)
const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  location: {
    lat: Number,
    lng: Number
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

// Create sample restaurants and orders
const createSampleData = async () => {
  try {
    console.log('🔄 Creating sample restaurants and orders...');

    // Clear existing data
    await Order.deleteMany({});
    await Restaurant.deleteMany({});
    console.log('🧹 Cleared existing orders and restaurants');

    // Create sample restaurants
    const restaurants = [
      {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
        name: 'Blue Top Restaurant',
        description: 'Authentic Ethiopian cuisine',
        address: 'Mexico Square, Addis Ababa',
        phoneNumber: '+251911234567',
        location: { lat: 9.0255, lng: 38.7735 },
        isActive: true
      },
      {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439015'),
        name: 'Addis Red Sea',
        description: 'Traditional Ethiopian dishes',
        address: 'Kazanchis, Addis Ababa',
        phoneNumber: '+251933456789',
        location: { lat: 9.0455, lng: 38.7935 },
        isActive: true
      },
      {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439017'),
        name: 'Habesha Restaurant',
        description: 'Ethiopian cultural dining',
        address: 'Merkato, Addis Ababa',
        phoneNumber: '+251955667788',
        location: { lat: 9.0155, lng: 38.7635 },
        isActive: true
      }
    ];

    await Restaurant.insertMany(restaurants);
    console.log('✅ Created sample restaurants');

    // Create sample orders
    const orders = [
      {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        orderNumber: 'ORD-001',
        customerId: '688c844eb154013d32b1b987',
        restaurantId: '507f1f77bcf86cd799439013',
        status: 'ready_for_pickup',
        items: [
          { name: 'Doro Wat', quantity: 1, price: 180, customizations: ['Extra spicy'] },
          { name: 'Injera', quantity: 2, price: 35, customizations: [] }
        ],
        total: 250,
        deliveryAddress: 'Bole, Addis Ababa',
        deliveryLocation: { lat: 9.0155, lng: 38.7635 },
        customerNotes: 'Please call when you arrive',
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60000),
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439014'),
        orderNumber: 'ORD-002',
        customerId: '688c844eb154013d32b1b987',
        restaurantId: '507f1f77bcf86cd799439015',
        status: 'ready_for_pickup',
        items: [
          { name: 'Kitfo', quantity: 1, price: 220, customizations: ['Medium rare'] },
          { name: 'Salad', quantity: 1, price: 100, customizations: [] }
        ],
        total: 320,
        deliveryAddress: 'CMC, Addis Ababa',
        deliveryLocation: { lat: 9.0355, lng: 38.7835 },
        customerNotes: null,
        estimatedDeliveryTime: new Date(Date.now() + 25 * 60000),
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439016'),
        orderNumber: 'ORD-003',
        customerId: '688c844eb154013d32b1b987',
        restaurantId: '507f1f77bcf86cd799439017',
        driverId: '6894917ecb6d9925e5402f1c', // Assign to test driver
        status: 'driver_assigned',
        items: [
          { name: 'Shiro Wat', quantity: 1, price: 120, customizations: [] },
          { name: 'Bread', quantity: 2, price: 30, customizations: [] }
        ],
        total: 180,
        deliveryAddress: 'Piassa, Addis Ababa',
        deliveryLocation: { lat: 9.0055, lng: 38.7535 },
        customerNotes: 'Second floor, blue door',
        estimatedDeliveryTime: new Date(Date.now() + 15 * 60000),
        createdAt: new Date()
      }
    ];

    await Order.insertMany(orders);
    console.log('✅ Created sample orders');

    // Summary
    const orderCount = await Order.countDocuments();
    const restaurantCount = await Restaurant.countDocuments();
    
    console.log(`\n📊 Sample data created successfully:`);
    console.log(`   • ${restaurantCount} restaurants`);
    console.log(`   • ${orderCount} orders`);
    console.log(`   • 2 orders ready for pickup (no driver)`);
    console.log(`   • 1 order assigned to driver`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the script
connectDB().then(() => {
  createSampleData();
});