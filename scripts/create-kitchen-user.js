import bcrypt from 'bcryptjs';
import '../server/db.js'; // Initialize MongoDB connection
import { storage } from '../server/storage.js';

async function createKitchenUser() {
  try {
    console.log('Creating kitchen staff user and restaurant...');
    
    // First, create a test restaurant
    const restaurant = {
      name: 'Test Kitchen Restaurant',
      address: '123 Kitchen St, Addis Ababa',
      phone: '+251911234567',
      email: 'kitchen@test.com',
      category: 'Ethiopian',
      isActive: true,
      isApproved: true,
      status: 'approved'
    };
    
    let restaurantId;
    try {
      const existingRestaurant = await storage.getRestaurantByEmail(restaurant.email);
      if (existingRestaurant) {
        console.log('Restaurant already exists:', existingRestaurant.id);
        restaurantId = existingRestaurant.id;
      } else {
        const createdRestaurant = await storage.createRestaurant(restaurant);
        restaurantId = createdRestaurant.id;
        console.log('Restaurant created with ID:', restaurantId);
      }
    } catch (error) {
      console.log('Creating new restaurant...');
      const createdRestaurant = await storage.createRestaurant(restaurant);
      restaurantId = createdRestaurant.id;
      console.log('Restaurant created with ID:', restaurantId);
    }
    
    // Now create kitchen staff user
    const hashedPassword = await bcrypt.hash('kitchen123', 10);
    const kitchenUser = {
      email: 'kitchen@test.com',
      firstName: 'Kitchen',
      lastName: 'Staff',
      role: 'kitchen_staff',
      password: hashedPassword,
      isActive: true,
      restaurantId: restaurantId
    };
    
    try {
      const existingUser = await storage.getUserByEmail(kitchenUser.email);
      if (existingUser) {
        console.log('Kitchen staff user already exists');
        // Update the user with restaurant ID if needed
        if (!existingUser.restaurantId) {
          await storage.updateUser(existingUser.id, { restaurantId });
          console.log('Updated user with restaurant ID:', restaurantId);
        }
      } else {
        const createdUser = await storage.createAdminUser(kitchenUser);
        console.log('Kitchen staff user created:', createdUser.id);
      }
    } catch (error) {
      console.log('Creating new kitchen user...');
      const createdUser = await storage.createAdminUser(kitchenUser);
      console.log('Kitchen staff user created:', createdUser.id);
    }
    
    console.log('\n✅ Setup complete!');
    console.log('Kitchen Staff Login Credentials:');
    console.log('Email: kitchen@test.com');
    console.log('Password: kitchen123');
    console.log('Role: kitchen_staff');
    console.log('Restaurant ID:', restaurantId);
    
  } catch (error) {
    console.error('Error creating kitchen user:', error);
  }
  
  process.exit(0);
}

createKitchenUser();