// Temporary test to create drivers with sample location data
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/beu_delivery';

const driverSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  telegramId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  name: { type: String, required: true },
  licenseNumber: String,
  vehicleType: String,
  vehiclePlate: String,
  currentLocation: {
    lat: Number,
    lng: Number
  },
  status: { 
    type: String, 
    enum: ['pending_approval', 'active', 'rejected', 'inactive'], 
    default: 'pending_approval' 
  },
  isOnline: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  rating: { type: String, default: '0.00' },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: String, default: '0.00' },
  todayEarnings: { type: String, default: '0.00' },
  weeklyEarnings: { type: String, default: '0.00' }
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const Driver = mongoose.model('Driver', driverSchema);

async function createTestDrivers() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing test drivers
    await Driver.deleteMany({});

    const testDrivers = [
      {
        userId: 'test_user_1',
        telegramId: 'test_tg_1',
        phoneNumber: '+251911234567',
        name: 'Ahmed Hassan',
        licenseNumber: 'DL001',
        vehicleType: 'Motorcycle',
        vehiclePlate: 'AA-001-001',
        currentLocation: {
          lat: 9.0155,
          lng: 38.7635
        },
        status: 'active',
        isOnline: true,
        isAvailable: true,
        isApproved: true,
        rating: '4.5',
        totalDeliveries: 25,
        totalEarnings: '1250.00'
      },
      {
        userId: 'test_user_2', 
        telegramId: 'test_tg_2',
        phoneNumber: '+251922345678',
        name: 'Mekdes Tekle',
        licenseNumber: 'DL002',
        vehicleType: 'Car',
        vehiclePlate: 'AA-002-002',
        currentLocation: {
          lat: 9.0255,
          lng: 38.7735
        },
        status: 'active',
        isOnline: true,
        isAvailable: true,
        isApproved: true,
        rating: '4.8',
        totalDeliveries: 40,
        totalEarnings: '2100.00'
      },
      {
        userId: 'test_user_3',
        telegramId: 'test_tg_3', 
        phoneNumber: '+251933456789',
        name: 'Daniel Girma',
        licenseNumber: 'DL003',
        vehicleType: 'Motorcycle',
        vehiclePlate: 'AA-003-003',
        currentLocation: {
          lat: 8.9955,
          lng: 38.7535
        },
        status: 'active',
        isOnline: false,
        isAvailable: false,
        isApproved: true,
        rating: '4.2',
        totalDeliveries: 18,
        totalEarnings: '890.00'
      }
    ];

    const result = await Driver.insertMany(testDrivers);
    console.log(`Successfully created ${result.length} test drivers with location data`);
    
    const count = await Driver.countDocuments({});
    console.log(`Total drivers in database: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestDrivers();