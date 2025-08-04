import bcrypt from 'bcryptjs';
import { storage } from '../server/storage.js';

async function createTestKitchenStaff() {
  try {
    console.log('Creating test kitchen staff user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('kitchen123', 10);
    
    // Create kitchen staff user
    const kitchenStaff = await storage.createUser({
      email: 'kitchen@test.com',
      password: hashedPassword,
      firstName: 'Kitchen',
      lastName: 'Staff',
      role: 'kitchen_staff',
      restaurantId: '5eaffba8-cb8c-41b3-97ee-b37d06c9cf4c', // Use the restaurant ID from your logs
      isActive: true
    });
    
    console.log('✅ Test kitchen staff user created successfully!');
    console.log('Login credentials:');
    console.log('Email: kitchen@test.com');
    console.log('Password: kitchen123');
    console.log('Role: kitchen_staff');
    console.log('\nYou can now log in at /kitchen with these credentials.');
    
  } catch (error) {
    console.error('❌ Error creating kitchen staff:', error.message);
  }
}

createTestKitchenStaff();