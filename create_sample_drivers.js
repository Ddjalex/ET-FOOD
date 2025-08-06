import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function createSampleDrivers() {
  try {
    await client.connect();
    const db = client.db('beu_delivery');
    const drivers = db.collection('drivers');

    // Clear existing drivers for clean test
    await drivers.deleteMany({});

    // Insert sample drivers with location data
    const sampleDrivers = [
      {
        userId: 'user1_' + Date.now(),
        telegramId: 'tg001_' + Date.now(),
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
        isBlocked: false,
        rating: '4.5',
        totalDeliveries: 25,
        totalEarnings: '1250.00',
        todayEarnings: '85.00',
        weeklyEarnings: '420.00',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: 'user2_' + Date.now(),
        telegramId: 'tg002_' + Date.now(),
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
        isBlocked: false,
        rating: '4.8',
        totalDeliveries: 40,
        totalEarnings: '2100.00',
        todayEarnings: '120.00',
        weeklyEarnings: '650.00',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: 'user3_' + Date.now(),
        telegramId: 'tg003_' + Date.now(),
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
        isBlocked: false,
        rating: '4.2',
        totalDeliveries: 18,
        totalEarnings: '890.00',
        todayEarnings: '0.00',
        weeklyEarnings: '180.00',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const result = await drivers.insertMany(sampleDrivers);
    console.log(`Successfully created ${result.insertedCount} sample drivers with location data`);
    
    // Verify the data
    const count = await drivers.countDocuments({});
    console.log(`Total drivers in database: ${count}`);
    
    // Show created drivers
    const allDrivers = await drivers.find({}).toArray();
    allDrivers.forEach(driver => {
      console.log(`Driver: ${driver.name}, Location: ${driver.currentLocation.lat}, ${driver.currentLocation.lng}, Online: ${driver.isOnline}`);
    });

  } catch (error) {
    console.error('Error creating sample drivers:', error);
  } finally {
    await client.close();
  }
}

createSampleDrivers();