import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb+srv://almeseged:A1l2m3e4s5@cluster0.t6sz6bo.mongodb.net/?retryWrites=true&w=majority';

async function fixMongoDBAndCreateAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Drop the problematic index
    try {
      await usersCollection.dropIndex('id_1');
      console.log('Dropped problematic id_1 index');
    } catch (error) {
      console.log('Index id_1 does not exist or already dropped');
    }
    
    // Create restaurant admin user manually
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = {
      email: 'admin@restaurant.com',
      firstName: 'Restaurant',
      lastName: 'Admin',
      role: 'restaurant_admin',
      password: hashedPassword,
      isActive: true,
      restaurantId: '68908e15ee63ede40f928221', // Use existing restaurant ID
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Remove existing user with same email if any
    await usersCollection.deleteOne({ email: 'admin@restaurant.com' });
    
    // Insert new admin user
    const result = await usersCollection.insertOne(adminUser);
    console.log('Restaurant admin created:', result.insertedId);
    
    console.log('\n✅ Setup complete!');
    console.log('Restaurant Admin Login Credentials:');
    console.log('Email: admin@restaurant.com');
    console.log('Password: admin123');
    console.log('Role: restaurant_admin');
    console.log('Restaurant ID: 68908e15ee63ede40f928221');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixMongoDBAndCreateAdmin();