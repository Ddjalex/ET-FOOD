import { IStorage } from './storage';
import { User } from './models/User';
import { Restaurant } from './models/Restaurant';  
import { Driver as DriverModel } from './models/Driver';
import { Customer } from './models/Customer';
import { SystemSettings } from './models/SystemSettings';
import { MenuCategory as MenuCategoryModel } from './models/MenuCategory';
import { MenuItem as MenuItemModel } from './models/MenuItem';
import { Order as OrderModel } from './models/Order';
import { ObjectId } from 'mongodb';
import {
  type User as UserType,
  type UpsertUser,
  type Restaurant as RestaurantType,
  type InsertRestaurant,
  type MenuCategory,
  type InsertMenuCategory,
  type MenuItem,
  type InsertMenuItem,
  type Order,
  type InsertOrder,
  type Driver as DriverType,
  type InsertDriver,
  type Delivery,
  type InsertDelivery,
  type Notification,
  type InsertNotification,
} from "@shared/schema";

export class MongoStorage implements IStorage {
  
  // Helper function to convert MongoDB document to schema type
  private convertMongoUser(user: any): UserType {
    return {
      id: user._id.toString(),
      email: user.email || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      role: user.role || null,
      phoneNumber: user.phoneNumber || null,
      telegramUserId: user.telegramUserId || null,
      telegramUsername: user.telegramUsername || null,
      password: user.password || null,
      isActive: user.isActive ?? true,
      restaurantId: user.restaurantId || null,
      createdBy: user.createdBy || null,
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null,
    };
  }

  private convertMongoRestaurant(restaurant: any): RestaurantType {
    return {
      id: restaurant._id.toString(),
      name: restaurant.name,
      description: restaurant.description || null,
      address: restaurant.address,
      phoneNumber: restaurant.phoneNumber,
      email: restaurant.email || null,
      location: restaurant.location ? [restaurant.location.latitude, restaurant.location.longitude] as [number, number] : null,
      imageUrl: restaurant.imageUrl || null,
      isActive: restaurant.isActive,
      isApproved: restaurant.isApproved,
      rating: restaurant.rating?.toString() || null,
      totalOrders: restaurant.totalOrders || null,
      createdAt: restaurant.createdAt || null,
      updatedAt: restaurant.updatedAt || null,
    };
  }

  private convertMongoDriver(driver: any): DriverType {
    if (!driver || !driver._id) {
      throw new Error('Invalid driver data: missing _id');
    }
    return {
      id: driver._id.toString(),
      userId: driver.userId,
      telegramId: driver.telegramId || null,
      phoneNumber: driver.phoneNumber || null,
      name: driver.name || null,
      profileImageUrl: driver.profileImageUrl || null,
      governmentIdFrontUrl: driver.governmentIdFrontUrl || null,
      governmentIdBackUrl: driver.governmentIdBackUrl || null,
      licenseNumber: driver.licenseNumber || null,
      vehicleType: driver.vehicleType || null,
      vehiclePlate: driver.vehiclePlate || null,
      licenseImageUrl: driver.licenseImageUrl || null,
      vehicleImageUrl: driver.vehicleImageUrl || null,
      idCardImageUrl: driver.idCardImageUrl || null,
      currentLocation: driver.currentLocation ? [driver.currentLocation.lat, driver.currentLocation.lng] as [number, number] : null,
      status: driver.status || null,
      isOnline: driver.isOnline || false,
      isAvailable: driver.isAvailable || false,
      isApproved: driver.isApproved || false,
      rating: driver.rating?.toString() || null,
      totalDeliveries: driver.totalDeliveries || null,
      totalEarnings: driver.totalEarnings?.toString() || null,
      todayEarnings: driver.todayEarnings?.toString() || null,
      weeklyEarnings: driver.weeklyEarnings?.toString() || null,
      creditBalance: driver.creditBalance || 0,
      // Credit request fields
      creditRequestPending: driver.creditRequestPending || false,
      requestedCreditAmount: driver.requestedCreditAmount || null,
      creditRequestScreenshotUrl: driver.creditRequestScreenshotUrl || null,
      creditRequestCreatedAt: driver.creditRequestCreatedAt || null,
      zone: driver.zone || null,
      lastOnline: driver.lastOnline || null,
      createdAt: driver.createdAt || null,
      updatedAt: driver.updatedAt || null,
    };
  }

  private convertMongoOrder(order: any): Order {
    return {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      restaurantId: order.restaurantId,
      driverId: order.driverId || null,
      status: order.status || null,
      unavailableItems: order.unavailableItems || null,
      items: order.items,
      subtotal: order.subtotal?.toString() || "0.00",
      deliveryFee: order.deliveryFee?.toString() || "0.00",
      tax: order.tax?.toString() || "0.00",
      total: order.total?.toString() || "0.00",
      paymentStatus: order.paymentStatus || null,
      paymentMethod: order.paymentMethod || null,
      deliveryAddress: order.deliveryAddress,
      deliveryLocation: order.deliveryLocation ? [order.deliveryLocation.lat, order.deliveryLocation.lng] as [number, number] : null,
      restaurantAddressName: order.restaurantAddressName || null,
      customerAddressName: order.customerAddressName || null,
      customerNotes: order.customerNotes || null,
      estimatedDeliveryTime: order.estimatedDeliveryTime || null,
      actualDeliveryTime: order.actualDeliveryTime || null,
      createdAt: order.createdAt || null,
      updatedAt: order.updatedAt || null,
    };
  }

  // User operations
  async getUser(id: string): Promise<UserType | undefined> {
    try {
      const user = await User.findById(id).lean();
      return user ? this.convertMongoUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<UserType> {
    try {
      const user = await User.findOneAndUpdate(
        { $or: [{ email: userData.email }, { telegramUserId: userData.telegramUserId }] },
        userData,
        { upsert: true, new: true, runValidators: true }
      ).lean();
      
      return this.convertMongoUser(user);
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async getUserByTelegramId(telegramUserId: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ telegramUserId }).lean();
      return user ? this.convertMongoUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user by telegram ID:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ email }).lean();
      return user ? this.convertMongoUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async updateUserRole(userId: string, role: string): Promise<UserType> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { role, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!user) throw new Error('User not found');
      return this.convertMongoUser(user);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async createAdminUser(userData: any): Promise<UserType> {
    try {
      const user = new User(userData);
      const savedUser = await user.save();
      return this.convertMongoUser(savedUser.toObject());
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  }

  async getUsersByRole(role: string): Promise<UserType[]> {
    try {
      const users = await User.find({ role }).lean();
      return users.map(user => this.convertMongoUser(user));
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await User.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Restaurant operations
  async getRestaurants(): Promise<RestaurantType[]> {
    try {
      const restaurants = await Restaurant.find({}).lean();
      return restaurants.map(r => this.convertMongoRestaurant(r));
    } catch (error) {
      console.error('Error getting restaurants:', error);
      return [];
    }
  }

  async getAllRestaurants(): Promise<RestaurantType[]> {
    return this.getRestaurants();
  }

  async getRestaurant(id: string): Promise<RestaurantType | undefined> {
    try {
      const restaurant = await Restaurant.findById(id).lean();
      return restaurant ? this.convertMongoRestaurant(restaurant) : undefined;
    } catch (error) {
      console.error('Error getting restaurant:', error);
      return undefined;
    }
  }

  async createRestaurant(restaurantData: InsertRestaurant): Promise<RestaurantType> {
    try {
      const restaurant = new Restaurant(restaurantData);
      const savedRestaurant = await restaurant.save();
      return this.convertMongoRestaurant(savedRestaurant.toObject());
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }
  }

  async updateRestaurant(id: string, restaurantData: Partial<InsertRestaurant>): Promise<RestaurantType> {
    try {
      const restaurant = await Restaurant.findByIdAndUpdate(
        id,
        { ...restaurantData, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!restaurant) throw new Error('Restaurant not found');
      return this.convertMongoRestaurant(restaurant);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      throw error;
    }
  }

  async deleteRestaurant(id: string): Promise<void> {
    try {
      await Restaurant.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      throw error;
    }
  }

  async approveRestaurant(id: string): Promise<RestaurantType> {
    try {
      const restaurant = await Restaurant.findByIdAndUpdate(
        id,
        { isApproved: true, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!restaurant) throw new Error('Restaurant not found');
      return this.convertMongoRestaurant(restaurant);
    } catch (error) {
      console.error('Error approving restaurant:', error);
      throw error;
    }
  }

  // Admin user operations
  async getAllAdminUsers(): Promise<UserType[]> {
    try {
      const users = await User.find({ 
        role: { $in: ['superadmin', 'restaurant_admin', 'kitchen_staff'] }
      }).lean();
      return users.map(user => this.convertMongoUser(user));
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }

  async deleteAdminUser(id: string): Promise<void> {
    await this.deleteUser(id);
  }

  // Menu operations
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    try {
      const categories = await MenuCategoryModel.find({ restaurantId }).lean();
      return categories.map((category: any) => ({
        id: category._id.toString(),
        restaurantId: category.restaurantId,
        name: category.name,
        description: category.description || null,
        isActive: category.isActive,
        status: category.status || 'active',
        lastModifiedBy: category.lastModifiedBy || null,
        sortOrder: category.sortOrder || null,
        createdAt: category.createdAt || null,
        updatedAt: category.updatedAt || null,
      }));
    } catch (error) {
      console.error('Error getting menu categories:', error);
      return [];
    }
  }

  async createMenuCategory(categoryData: InsertMenuCategory): Promise<MenuCategory> {
    try {
      const category = new MenuCategoryModel(categoryData);
      const savedCategory = await category.save();
      const categoryObj = savedCategory.toObject();
      
      return {
        id: categoryObj._id.toString(),
        restaurantId: categoryObj.restaurantId,
        name: categoryObj.name,
        description: categoryObj.description || null,
        isActive: categoryObj.isActive,
        status: categoryObj.status || 'active',
        lastModifiedBy: categoryObj.lastModifiedBy || null,
        sortOrder: categoryObj.sortOrder || null,
        createdAt: categoryObj.createdAt || null,
        updatedAt: categoryObj.updatedAt || null,
      };
    } catch (error) {
      console.error('Error creating menu category:', error);
      throw error;
    }
  }

  async updateMenuCategory(id: string, categoryData: Partial<InsertMenuCategory>): Promise<MenuCategory> {
    try {
      const category = await MenuCategoryModel.findByIdAndUpdate(
        id,
        { ...categoryData, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!category) throw new Error('Category not found');
      
      return {
        id: category._id.toString(),
        restaurantId: category.restaurantId,
        name: category.name,
        description: category.description || null,
        isActive: category.isActive,
        status: category.status || 'active',
        lastModifiedBy: category.lastModifiedBy || null,
        sortOrder: category.sortOrder || null,
        createdAt: category.createdAt || null,
        updatedAt: category.updatedAt || null,
      };
    } catch (error) {
      console.error('Error updating menu category:', error);
      throw error;
    }
  }

  async deleteMenuCategory(id: string): Promise<void> {
    try {
      await MenuCategoryModel.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting menu category:', error);
      throw error;
    }
  }

  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    try {
      const items = await MenuItemModel.find({ restaurantId }).lean();
      return items.map((item: any) => ({
        id: item._id.toString(),
        restaurantId: item.restaurantId,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || null,
        price: item.price.toString(),
        imageUrl: item.imageUrl || null,
        isAvailable: item.isAvailable,
        status: item.status || 'active',
        lastModifiedBy: item.lastModifiedBy || null,
        preparationTime: item.preparationTime || null,
        ingredients: item.ingredients || [],
        isVegetarian: item.isVegetarian || false,
        isVegan: item.isVegan || false,
        spicyLevel: item.spicyLevel || null,
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null,
      }));
    } catch (error) {
      console.error('Error getting menu items:', error);
      return [];
    }
  }

  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    try {
      const items = await MenuItemModel.find({ categoryId }).lean();
      return items.map((item: any) => ({
        id: item._id.toString(),
        restaurantId: item.restaurantId,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || null,
        price: item.price.toString(),
        imageUrl: item.imageUrl || null,
        isAvailable: item.isAvailable,
        status: item.status || 'active',
        lastModifiedBy: item.lastModifiedBy || null,
        preparationTime: item.preparationTime || null,
        ingredients: item.ingredients || [],
        isVegetarian: item.isVegetarian || false,
        isVegan: item.isVegan || false,
        spicyLevel: item.spicyLevel || null,
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null,
      }));
    } catch (error) {
      console.error('Error getting menu items by category:', error);
      return [];
    }
  }

  async createMenuItem(itemData: InsertMenuItem): Promise<MenuItem> {
    try {
      const item = new MenuItemModel(itemData);
      const savedItem = await item.save();
      const itemObj = savedItem.toObject();
      
      return {
        id: itemObj._id.toString(),
        restaurantId: itemObj.restaurantId,
        categoryId: itemObj.categoryId,
        name: itemObj.name,
        description: itemObj.description || null,
        price: itemObj.price.toString(),
        imageUrl: itemObj.imageUrl || null,
        isAvailable: itemObj.isAvailable,
        status: itemObj.status || 'active',
        lastModifiedBy: itemObj.lastModifiedBy || null,
        preparationTime: itemObj.preparationTime || null,
        ingredients: itemObj.ingredients || [],
        isVegetarian: itemObj.isVegetarian || false,
        isVegan: itemObj.isVegan || false,
        spicyLevel: itemObj.spicyLevel || null,
        createdAt: itemObj.createdAt || null,
        updatedAt: itemObj.updatedAt || null,
      };
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  }

  async updateMenuItem(id: string, itemData: Partial<InsertMenuItem>): Promise<MenuItem> {
    try {
      const item = await MenuItemModel.findByIdAndUpdate(
        id,
        { ...itemData, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!item) throw new Error('Menu item not found');
      
      return {
        id: item._id.toString(),
        restaurantId: item.restaurantId,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || null,
        price: item.price.toString(),
        imageUrl: item.imageUrl || null,
        isAvailable: item.isAvailable,
        status: item.status || 'active',
        lastModifiedBy: item.lastModifiedBy || null,
        preparationTime: item.preparationTime || null,
        ingredients: item.ingredients || [],
        isVegetarian: item.isVegetarian || false,
        isVegan: item.isVegan || false,
        spicyLevel: item.spicyLevel || null,
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null,
      };
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  async deleteMenuItem(id: string): Promise<void> {
    try {
      await MenuItemModel.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  // Order operations  
  async getOrders(): Promise<Order[]> {
    try {
      const orders = await OrderModel.find({}).lean();
      return orders.map(order => this.convertMongoOrder(order));
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  async getOrder(id: string): Promise<Order | undefined> {
    try {
      const order = await OrderModel.findById(id).lean();
      return order ? this.convertMongoOrder(order) : undefined;
    } catch (error) {
      console.error('Error getting order:', error);
      return undefined;
    }
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    try {
      const orders = await OrderModel.find({ status }).lean();
      return orders.map(order => this.convertMongoOrder(order));
    } catch (error) {
      console.error('Error getting orders by status:', error);
      return [];
    }
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    try {
      const orders = await OrderModel.find({ restaurantId }).lean();
      return orders.map(order => this.convertMongoOrder(order));
    } catch (error) {
      console.error('Error getting orders by restaurant:', error);
      return [];
    }
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      const orders = await OrderModel.find({ customerId }).lean();
      return orders.map(order => this.convertMongoOrder(order));
    } catch (error) {
      console.error('Error getting orders by customer:', error);
      return [];
    }
  }

  async getOrdersByDriver(driverId: string): Promise<Order[]> {
    try {
      const orders = await OrderModel.find({ driverId }).lean();
      return orders.map(order => this.convertMongoOrder(order));
    } catch (error) {
      console.error('Error getting orders by driver:', error);
      return [];
    }
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    try {
      const order = new OrderModel(orderData);
      const savedOrder = await order.save();
      return this.convertMongoOrder(savedOrder.toObject());
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order> {
    try {
      const order = await OrderModel.findByIdAndUpdate(
        id,
        { ...orderData, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!order) throw new Error('Order not found');
      return this.convertMongoOrder(order);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    try {
      const order = await OrderModel.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!order) throw new Error('Order not found');
      return this.convertMongoOrder(order);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Driver operations
  async getDrivers(): Promise<DriverType[]> {
    try {
      const drivers = await DriverModel.find({}).lean();
      return drivers.map(driver => this.convertMongoDriver(driver));
    } catch (error) {
      console.error('Error getting drivers:', error);
      return [];
    }
  }

  async getDriver(id: string): Promise<DriverType | undefined> {
    try {
      const driver = await DriverModel.findById(id).lean();
      return driver ? this.convertMongoDriver(driver) : undefined;
    } catch (error) {
      console.error('Error getting driver:', error);
      return undefined;
    }
  }

  async getDriverById(id: string): Promise<DriverType | undefined> {
    return this.getDriver(id);
  }

  async getDriverByUserId(userId: string): Promise<DriverType | undefined> {
    try {
      const driver = await DriverModel.findOne({ userId }).lean();
      return driver ? this.convertMongoDriver(driver) : undefined;
    } catch (error) {
      console.error('Error getting driver by user ID:', error);
      return undefined;
    }
  }

  async getDriverByTelegramId(telegramId: string): Promise<DriverType | undefined> {
    try {
      const driver = await DriverModel.findOne({ telegramId }).lean();
      return driver ? this.convertMongoDriver(driver) : undefined;
    } catch (error) {
      console.error('Error getting driver by telegram ID:', error);
      return undefined;
    }
  }

  async createDriver(driverData: InsertDriver): Promise<DriverType> {
    try {
      console.log('📝 Creating driver with data:', driverData);
      
      // Validate required fields
      if (!driverData.telegramId || !driverData.name || !driverData.phoneNumber) {
        throw new Error('Missing required fields: telegramId, name, or phoneNumber');
      }
      
      const driver = new DriverModel(driverData);
      const savedDriver = await driver.save();
      
      console.log('✅ Driver saved successfully:', savedDriver._id);
      
      return this.convertMongoDriver(savedDriver.toObject());
    } catch (error) {
      console.error('❌ Error creating driver:', error);
      throw error;
    }
  }

  async updateDriver(id: string, driverData: Partial<InsertDriver>): Promise<DriverType> {
    try {
      const driver = await DriverModel.findByIdAndUpdate(
        id,
        { ...driverData, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!driver) throw new Error('Driver not found');
      return this.convertMongoDriver(driver);
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  }

  async updateDriverCreditBalance(driverId: string, amount: number): Promise<DriverType> {
    try {
      const driver = await DriverModel.findByIdAndUpdate(
        driverId,
        { 
          $inc: { creditBalance: amount },
          updatedAt: new Date()
        },
        { new: true }
      ).lean();
      
      if (!driver) throw new Error('Driver not found');
      
      return this.convertMongoDriver(driver);
    } catch (error) {
      console.error('Error updating driver credit balance:', error);
      throw error;
    }
  }

  async deductDriverCredit(driverId: string, amount: number): Promise<DriverType> {
    return this.updateDriverCreditBalance(driverId, -amount);
  }

  async updateDriverStatus(id: string, isOnline: boolean, isAvailable: boolean): Promise<DriverType> {
    try {
      const driver = await DriverModel.findByIdAndUpdate(
        id,
        { 
          isOnline,
          isAvailable,
          lastOnline: isOnline ? new Date() : undefined,
          updatedAt: new Date()
        },
        { new: true }
      ).lean();
      
      if (!driver) throw new Error('Driver not found');
      return this.convertMongoDriver(driver);
    } catch (error) {
      console.error('Error updating driver status:', error);
      throw error;
    }
  }

  async updateDriverLocation(id: string, location: { lat: number; lng: number }): Promise<DriverType> {
    try {
      const driver = await DriverModel.findByIdAndUpdate(
        id,
        { 
          currentLocation: location,
          lastOnline: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).lean();
      
      if (!driver) throw new Error('Driver not found');
      return this.convertMongoDriver(driver);
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  }

  async updateDriverEarnings(id: string, earnings: number): Promise<DriverType> {
    try {
      const driver = await DriverModel.findByIdAndUpdate(
        id,
        { 
          $inc: { 
            totalEarnings: earnings,
            todayEarnings: earnings,
            weeklyEarnings: earnings
          },
          $inc: { totalDeliveries: 1 },
          updatedAt: new Date()
        },
        { new: true }
      ).lean();
      
      if (!driver) throw new Error('Driver not found');
      return this.convertMongoDriver(driver);
    } catch (error) {
      console.error('Error updating driver earnings:', error);
      throw error;
    }
  }

  async approveDriver(id: string): Promise<DriverType> {
    try {
      const driver = await DriverModel.findByIdAndUpdate(
        id,
        { 
          isApproved: true,
          status: 'active',
          updatedAt: new Date()
        },
        { new: true }
      ).lean();
      
      if (!driver) throw new Error('Driver not found');
      return this.convertMongoDriver(driver);
    } catch (error) {
      console.error('Error approving driver:', error);
      throw error;
    }
  }

  async rejectDriver(id: string, reason?: string): Promise<void> {
    try {
      await DriverModel.findByIdAndUpdate(
        id,
        { 
          isApproved: false,
          status: 'rejected',
          rejectionReason: reason,
          updatedAt: new Date()
        }
      );
    } catch (error) {
      console.error('Error rejecting driver:', error);
      throw error;
    }
  }

  async getAvailableDrivers(): Promise<DriverType[]> {
    try {
      const drivers = await DriverModel.find({ 
        isApproved: true,
        isOnline: true,
        isAvailable: true
      }).lean();
      return drivers.map(driver => this.convertMongoDriver(driver));
    } catch (error) {
      console.error('Error getting available drivers:', error);
      return [];
    }
  }

  async getPendingDrivers(): Promise<DriverType[]> {
    try {
      const drivers = await DriverModel.find({ 
        status: 'pending_approval'
      }).lean();
      return drivers.map(driver => this.convertMongoDriver(driver));
    } catch (error) {
      console.error('Error getting pending drivers:', error);
      return [];
    }
  }

  async getAvailableOrdersForDriver(driverId: string): Promise<Order[]> {
    try {
      const orders = await OrderModel.find({ 
        status: 'ready_for_pickup',
        driverId: null
      }).lean();
      return orders.map(order => this.convertMongoOrder(order));
    } catch (error) {
      console.error('Error getting available orders for driver:', error);
      return [];
    }
  }

  async assignOrderToDriver(orderId: string, driverId: string): Promise<Order> {
    try {
      const order = await OrderModel.findByIdAndUpdate(
        orderId,
        { 
          driverId,
          status: 'driver_assigned',
          updatedAt: new Date()
        },
        { new: true }
      ).lean();
      
      if (!order) throw new Error('Order not found');
      return this.convertMongoOrder(order);
    } catch (error) {
      console.error('Error assigning order to driver:', error);
      throw error;
    }
  }

  async getDriverDeliveryHistory(driverId: string): Promise<any[]> {
    try {
      const orders = await OrderModel.find({ 
        driverId,
        status: 'delivered'
      }).lean();
      
      return orders.map(order => ({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        restaurantName: order.restaurantName || 'Unknown Restaurant',
        customerName: order.customerName || 'Unknown Customer',
        deliveryAddress: order.deliveryAddress,
        total: order.total || order.totalAmount,
        earnings: this.calculateDeliveryEarnings(order),
        deliveredAt: order.actualDeliveryTime || order.updatedAt,
        rating: order.rating || null
      }));
    } catch (error) {
      console.error('Error getting driver delivery history:', error);
      return [];
    }
  }

  private calculateDeliveryEarnings(order: any): string {
    const baseEarnings = parseFloat(order.total || order.totalAmount || '0') * 0.15;
    const minEarnings = 2.50;
    return Math.max(baseEarnings, minEarnings).toFixed(2);
  }

  async updateDriverCreditRequest(driverId: string, data: any): Promise<DriverType> {
    try {
      const driver = await DriverModel.findByIdAndUpdate(
        driverId,
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!driver) throw new Error('Driver not found');
      return this.convertMongoDriver(driver);
    } catch (error) {
      console.error('Error updating driver credit request:', error);
      throw error;
    }
  }

  // Delivery operations (stub implementations)
  async getDeliveries(): Promise<Delivery[]> { return []; }
  async getDelivery(id: string): Promise<Delivery | undefined> { return undefined; }
  async getDeliveriesByDriver(driverId: string): Promise<Delivery[]> { return []; }
  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const deliveryRecord: Delivery = {
      id: new ObjectId().toString(),
      orderId: delivery.orderId,
      driverId: delivery.driverId,
      status: delivery.status || 'assigned',
      pickupTime: delivery.pickupTime || null,
      deliveryTime: delivery.deliveryTime || null,
      distance: delivery.distance || null,
      earnings: delivery.earnings || null,
      tips: delivery.tips || null,
      notes: delivery.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return deliveryRecord;
  }
  async updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery> { 
    throw new Error('Not implemented'); 
  }

  // Notification operations (stub implementations)  
  async getNotifications(userId: string): Promise<Notification[]> { return []; }
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const notificationRecord: Notification = {
      id: new ObjectId().toString(),
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || null,
      isRead: notification.isRead || false,
      createdAt: new Date(),
    };
    return notificationRecord;
  }
  async markNotificationAsRead(id: string): Promise<Notification> { 
    throw new Error('Not implemented'); 
  }

  // System settings and additional methods
  async getSystemSettings(): Promise<any> {
    try {
      const settings = await SystemSettings.findOne().lean();
      return settings || {};
    } catch (error) {
      console.error('Error getting system settings:', error);
      return {};
    }
  }

  async updateSystemSettings(settings: any): Promise<any> {
    try {
      const updatedSettings = await SystemSettings.findOneAndUpdate(
        {},
        settings,
        { upsert: true, new: true }
      ).lean();
      return updatedSettings;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  async updateCompanyLogo(logoUrl: string): Promise<void> {
    await this.updateSystemSettings({ companyLogo: logoUrl });
  }

  async verifyAdminPassword(adminId: string, password: string): Promise<boolean> {
    try {
      const user = await User.findById(adminId);
      if (!user || !user.password) return false;
      // In a real implementation, you'd use bcrypt.compare here
      return user.password === password;
    } catch (error) {
      console.error('Error verifying admin password:', error);
      return false;
    }
  }

  async updateAdminPassword(adminId: string, newPassword: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(adminId, { 
        password: newPassword, // In a real implementation, you'd hash this
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating admin password:', error);
      throw error;
    }
  }

  async updateAdminProfile(adminId: string, profileData: { email: string; firstName: string; lastName: string }): Promise<UserType> {
    try {
      const user = await User.findByIdAndUpdate(
        adminId,
        { ...profileData, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!user) throw new Error('Admin user not found');
      return this.convertMongoUser(user);
    } catch (error) {
      console.error('Error updating admin profile:', error);
      throw error;
    }
  }

  async updateAdminUser(id: string, data: Partial<UserType>): Promise<UserType> {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!user) throw new Error('Admin user not found');
      return this.convertMongoUser(user);
    } catch (error) {
      console.error('Error updating admin user:', error);
      throw error;
    }
  }

  async getAllDrivers(): Promise<DriverType[]> {
    return this.getDrivers();
  }

  async blockDriver(driverId: string): Promise<DriverType> {
    try {
      const driver = await DriverModel.findByIdAndUpdate(
        driverId,
        { 
          isBlocked: true,
          isAvailable: false,
          updatedAt: new Date()
        },
        { new: true }
      ).lean();
      
      if (!driver) throw new Error('Driver not found');
      return this.convertMongoDriver(driver);
    } catch (error) {
      console.error('Error blocking driver:', error);
      throw error;
    }
  }

  async unblockDriver(driverId: string): Promise<DriverType> {
    try {
      const driver = await DriverModel.findByIdAndUpdate(
        driverId,
        { 
          isBlocked: false,
          updatedAt: new Date()
        },
        { new: true }
      ).lean();
      
      if (!driver) throw new Error('Driver not found');
      return this.convertMongoDriver(driver);
    } catch (error) {
      console.error('Error unblocking driver:', error);
      throw error;
    }
  }

  async deleteDriver(driverId: string): Promise<void> {
    try {
      await DriverModel.findByIdAndDelete(driverId);
    } catch (error) {
      console.error('Error deleting driver:', error);
      throw error;
    }
  }

  async saveLiveLocation(driverId: string, location: any): Promise<void> {
    try {
      await DriverModel.findByIdAndUpdate(
        driverId,
        { 
          currentLocation: location,
          lastOnline: new Date(),
          updatedAt: new Date()
        }
      );
    } catch (error) {
      console.error('Error saving live location:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const [totalOrders, totalDrivers, totalRestaurants, totalRevenue] = await Promise.all([
        OrderModel.countDocuments(),
        DriverModel.countDocuments(),
        Restaurant.countDocuments(),
        OrderModel.aggregate([
          { $group: { _id: null, total: { $sum: { $toDouble: "$total" } } } }
        ])
      ]);

      return {
        totalOrders,
        totalDrivers,
        totalRestaurants,
        totalRevenue: totalRevenue[0]?.total || 0
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalOrders: 0,
        totalDrivers: 0,
        totalRestaurants: 0,
        totalRevenue: 0
      };
    }
  }

  async getOrderAnalytics(): Promise<any> {
    return {};
  }

  // Customer operations
  async getCustomer(userId: string): Promise<any | undefined> {
    try {
      const customer = await Customer.findOne({ userId }).lean();
      return customer ? { ...customer, id: customer._id.toString() } : undefined;
    } catch (error) {
      console.error('Error getting customer:', error);
      return undefined;
    }
  }

  async getCustomerByPhone(phoneNumber: string): Promise<any | undefined> {
    try {
      const customer = await Customer.findOne({ phoneNumber }).lean();
      return customer ? { ...customer, id: customer._id.toString() } : undefined;
    } catch (error) {
      console.error('Error getting customer by phone:', error);
      return undefined;
    }
  }

  async createCustomer(customerData: any): Promise<any> {
    try {
      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();
      return { ...savedCustomer.toObject(), id: savedCustomer._id.toString() };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(userId: string, customerData: any): Promise<any> {
    try {
      const customer = await Customer.findOneAndUpdate(
        { userId },
        { ...customerData, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (!customer) throw new Error('Customer not found');
      return { ...customer, id: customer._id.toString() };
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async generateUniqueUserId(): Promise<string> {
    return new ObjectId().toString();
  }

  // Kitchen operations
  async getMenuItemsByStatus(restaurantId: string, status: string): Promise<MenuItem[]> {
    try {
      const items = await MenuItemModel.find({ restaurantId, status }).lean();
      return items.map((item: any) => ({
        id: item._id.toString(),
        restaurantId: item.restaurantId,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || null,
        price: item.price.toString(),
        imageUrl: item.imageUrl || null,
        isAvailable: item.isAvailable,
        status: item.status || 'active',
        lastModifiedBy: item.lastModifiedBy || null,
        preparationTime: item.preparationTime || null,
        ingredients: item.ingredients || [],
        isVegetarian: item.isVegetarian || false,
        isVegan: item.isVegan || false,
        spicyLevel: item.spicyLevel || null,
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null,
      }));
    } catch (error) {
      console.error('Error getting menu items by status:', error);
      return [];
    }
  }

  async getMenuCategoriesByStatus(restaurantId: string, status: string): Promise<MenuCategory[]> {
    try {
      const categories = await MenuCategoryModel.find({ restaurantId, status }).lean();
      return categories.map((category: any) => ({
        id: category._id.toString(),
        restaurantId: category.restaurantId,
        name: category.name,
        description: category.description || null,
        isActive: category.isActive,
        status: category.status || 'active',
        lastModifiedBy: category.lastModifiedBy || null,
        sortOrder: category.sortOrder || null,
        createdAt: category.createdAt || null,
        updatedAt: category.updatedAt || null,
      }));
    } catch (error) {
      console.error('Error getting menu categories by status:', error);
      return [];
    }
  }

  async getRestaurantMenu(restaurantId: string): Promise<{ categories: MenuCategory[], items: MenuItem[] }> {
    const categories = await this.getMenuCategories(restaurantId);
    const items = await this.getMenuItems(restaurantId);
    return { categories, items };
  }
}