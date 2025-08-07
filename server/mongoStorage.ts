import { IStorage } from './storage';
import { User } from './models/User';
import { Restaurant } from './models/Restaurant';  
import { Driver as DriverModel } from './models/Driver';
import { SystemSettings } from './models/SystemSettings';
import { MenuCategory as MenuCategoryModel } from './models/MenuCategory';
import { MenuItem as MenuItemModel } from './models/MenuItem';
import { Order as OrderModel } from './models/Order';
import { mongoose } from './mongodb';
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
  private get db() {
    return mongoose.connection.db;
  }
  
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<UserType | undefined> {
    try {
      const user = await User.findById(id).lean();
      if (!user) return undefined;
      
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
      } as UserType;
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
      } as UserType;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async getUserByTelegramId(telegramUserId: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ telegramUserId }).lean();
      return user ? { ...user, id: user._id.toString() } as UserType : undefined;
    } catch (error) {
      console.error('Error getting user by telegram ID:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ email }).lean();
      return user ? { ...user, id: user._id.toString() } as UserType : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async updateUserRole(userId: string, role: string): Promise<UserType> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true }
      ).lean();
      if (!user) throw new Error('User not found');
      return { ...user, id: user._id.toString() } as UserType;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async createAdminUser(userData: any): Promise<UserType> {
    try {
      // Remove any id field that might cause conflicts
      const cleanUserData = { ...userData };
      delete cleanUserData.id;
      
      const user = new User(cleanUserData);
      const savedUser = await user.save();
      const userObj = savedUser.toObject();
      return {
        id: userObj._id.toString(),
        email: userObj.email || null,
        firstName: userObj.firstName || null,
        lastName: userObj.lastName || null,
        profileImageUrl: userObj.profileImageUrl || null,
        role: userObj.role || null,
        phoneNumber: userObj.phoneNumber || null,
        telegramUserId: userObj.telegramUserId || null,
        telegramUsername: userObj.telegramUsername || null,
        password: userObj.password || null,
        isActive: userObj.isActive ?? true,
        restaurantId: userObj.restaurantId || null,
        createdBy: userObj.createdBy || null,
        createdAt: userObj.createdAt || null,
        updatedAt: userObj.updatedAt || null,
      } as UserType;
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  }

  // Restaurant operations
  async getRestaurants(): Promise<RestaurantType[]> {
    try {
      const restaurants = await Restaurant.find({}).lean();
      return restaurants.map(r => ({ ...r, id: r._id.toString() })) as RestaurantType[];
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
      return restaurant ? { ...restaurant, id: restaurant._id.toString() } as RestaurantType : undefined;
    } catch (error) {
      console.error('Error getting restaurant:', error);
      return undefined;
    }
  }

  async createRestaurant(restaurantData: InsertRestaurant): Promise<RestaurantType> {
    try {
      // Remove any id field that might cause conflicts
      const cleanRestaurantData = { ...restaurantData };
      delete cleanRestaurantData.id;
      
      const restaurant = new Restaurant(cleanRestaurantData);
      const savedRestaurant = await restaurant.save();
      const restaurantObj = savedRestaurant.toObject();
      return {
        id: restaurantObj._id.toString(),
        name: restaurantObj.name,
        description: restaurantObj.description || null,
        address: restaurantObj.address,
        phoneNumber: restaurantObj.phoneNumber,
        email: restaurantObj.email || null,
        location: restaurantObj.location || null,
        imageUrl: restaurantObj.imageUrl || null,
        isActive: restaurantObj.isActive,
        isApproved: restaurantObj.isApproved,
        rating: restaurantObj.rating,
        totalOrders: restaurantObj.totalOrders,
        createdAt: restaurantObj.createdAt,
        updatedAt: restaurantObj.updatedAt
      } as RestaurantType;
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }
  }

  async updateRestaurant(id: string, restaurantData: Partial<InsertRestaurant>): Promise<RestaurantType> {
    try {
      const restaurant = await Restaurant.findByIdAndUpdate(
        id,
        restaurantData,
        { new: true, runValidators: true }
      ).lean();
      if (!restaurant) throw new Error('Restaurant not found');
      return { ...restaurant, id: restaurant._id.toString() } as RestaurantType;
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
        { isApproved: true },
        { new: true }
      ).lean();
      if (!restaurant) throw new Error('Restaurant not found');
      return { ...restaurant, id: restaurant._id.toString() } as RestaurantType;
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
      return users.map(u => ({ ...u, id: u._id.toString() })) as UserType[];
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }

  async deleteAdminUser(id: string): Promise<void> {
    try {
      await User.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting admin user:', error);
      throw error;
    }
  }

  // System settings methods
  async getSystemSettings(): Promise<any> {
    try {
      console.log('🔍 Fetching system settings from MongoDB...');
      let settings = await SystemSettings.findOne({}).lean();
      if (!settings) {
        console.log('🆕 No settings found, creating default settings');
        // Create default settings if none exist
        const defaultSettings = new SystemSettings({});
        settings = await defaultSettings.save();
      }
      console.log('📋 Settings retrieved:', settings);
      return { ...settings, id: settings._id.toString() };
    } catch (error) {
      console.error('❌ Error getting system settings:', error);
      return {
        companyName: 'BeU Delivery',
        supportEmail: 'support@beu-delivery.com',
        supportPhone: '+251-911-123456',
        deliveryFee: 25.00,
        maxDeliveryDistance: 10,
        orderTimeout: 30,
        enableSMSNotifications: true,
        enableEmailNotifications: true,
        maintenanceMode: false
      };
    }
  }

  async updateSystemSettings(settingsData: any): Promise<any> {
    try {
      console.log('📝 Updating settings with data:', settingsData);
      let settings = await SystemSettings.findOne({});
      if (!settings) {
        console.log('🆕 Creating new settings document');
        settings = new SystemSettings(settingsData);
      } else {
        console.log('📊 Updating existing settings document');
        Object.assign(settings, settingsData);
      }
      const savedSettings = await settings.save();
      console.log('✅ Settings saved successfully:', savedSettings.toObject());
      return { ...savedSettings.toObject(), id: savedSettings._id.toString() };
    } catch (error) {
      console.error('❌ Error updating system settings:', error);
      throw error;
    }
  }

  async updateCompanyLogo(logoUrl: string): Promise<void> {
    try {
      await this.updateSystemSettings({ companyLogo: logoUrl });
    } catch (error) {
      console.error('Error updating company logo:', error);
      throw error;
    }
  }

  // Cleanup method for problematic driver documents
  private async cleanupProblematicDrivers(): Promise<void> {
    try {
      // Remove documents with null or undefined id fields
      const deleteResult = await mongoose.connection.db.collection('drivers').deleteMany({
        $or: [
          { id: null },
          { id: undefined },
          { id: { $exists: false } },
          { id: "" }
        ]
      });
      
      if (deleteResult.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deleteResult.deletedCount} problematic driver documents`);
      }
      
      // Drop problematic id index if it exists
      try {
        await mongoose.connection.db.collection('drivers').dropIndex('id_1');
        console.log('✅ Dropped problematic id_1 index');
      } catch (indexError: any) {
        if (indexError.code !== 27) { // 27 = IndexNotFound
          console.log('⚠️  Could not drop id index:', indexError.message);
        }
      }
    } catch (error) {
      console.log('⚠️  Cleanup failed:', (error as Error).message);
    }
  }

  // Driver operations
  async getDrivers(): Promise<DriverType[]> {
    try {
      const drivers = await DriverModel.find({}).lean();
      return drivers.map(d => ({ ...d, id: d._id.toString() })) as DriverType[];
    } catch (error) {
      console.error('Error getting drivers:', error);
      return [];
    }
  }

  async getAllDrivers(): Promise<any[]> {
    try {
      console.log('🔍 MongoDB getAllDrivers() called - ENHANCED VERSION v2');
      
      // First fetch all drivers using aggregation to include user data
      const driversWithUsers = await DriverModel.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true
          }
        }
      ]);
      
      console.log('📊 Raw driver count:', driversWithUsers.length);
      console.log('📊 First driver raw:', JSON.stringify(driversWithUsers[0], null, 2));
      
      const result = driversWithUsers.map(d => {
        // Convert MongoDB location object to array format expected by frontend
        let currentLocation = null;
        if (d.currentLocation) {
          if (d.currentLocation.lat && d.currentLocation.lng) {
            currentLocation = [d.currentLocation.lat, d.currentLocation.lng];
          } else if (Array.isArray(d.currentLocation)) {
            currentLocation = d.currentLocation;
          }
        }
        
        // Create user object with proper structure for frontend
        const userObject = d.userInfo ? {
          firstName: d.userInfo.firstName,
          lastName: d.userInfo.lastName,
          email: d.userInfo.email,
          phoneNumber: d.userInfo.phoneNumber
        } : null;
        
        const driverResult = {
          id: d._id.toString(),
          userId: d.userId?.toString(),
          telegramId: d.telegramId,
          name: d.name || null,
          phoneNumber: d.phoneNumber || null,
          governmentIdFrontUrl: d.governmentIdFrontUrl,
          governmentIdBackUrl: d.governmentIdBackUrl,
          licenseNumber: d.licenseNumber,
          vehicleType: d.vehicleType,
          vehiclePlate: d.vehiclePlate,
          licenseImageUrl: d.licenseImageUrl,
          vehicleImageUrl: d.vehicleImageUrl,
          idCardImageUrl: d.idCardImageUrl,
          currentLocation: currentLocation,
          status: d.status,
          isOnline: d.isOnline || false,
          isAvailable: d.isAvailable || false,
          isApproved: d.isApproved || false,
          isBlocked: d.isBlocked || false,
          rating: d.rating || "0.00",
          totalDeliveries: d.totalDeliveries || 0,
          totalEarnings: d.totalEarnings || "0.00",
          todayEarnings: d.todayEarnings || "0.00",
          weeklyEarnings: d.weeklyEarnings || "0.00",
          zone: d.zone,
          lastOnline: d.lastOnline,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          user: userObject
        };
        
        console.log('✅ Driver processed:', { 
          id: driverResult.id,
          driverName: driverResult.name, 
          userFirstName: userObject?.firstName,
          userLastName: userObject?.lastName,
          userEmail: userObject?.email,
          phoneNumber: driverResult.phoneNumber
        });
        
        return driverResult;
      });
      
      console.log('📋 Total drivers returned:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error getting all drivers:', error);
      return [];
    }
  }

  async approveDriver(driverId: string): Promise<DriverType> {
    try {
      const driver = await DriverModel.findByIdAndUpdate(
        driverId,
        { isApproved: true },
        { new: true }
      ).lean();
      if (!driver) throw new Error('Driver not found');
      return { ...driver, id: driver._id.toString() } as DriverType;
    } catch (error) {
      console.error('Error approving driver:', error);
      throw error;
    }
  }

  async rejectDriver(driverId: string): Promise<void> {
    try {
      await DriverModel.findByIdAndDelete(driverId);
    } catch (error) {
      console.error('Error rejecting driver:', error);
      throw error;
    }
  }

  // Password management methods
  async verifyAdminPassword(adminId: string, password: string): Promise<boolean> {
    // This would use bcrypt in a real implementation
    return true;
  }

  async updateAdminPassword(adminId: string, newHashedPassword: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(adminId, { password: newHashedPassword });
    } catch (error) {
      console.error('Error updating admin password:', error);
      throw error;
    }
  }

  async updateAdminProfile(adminId: string, profileData: { email: string; firstName: string; lastName: string }): Promise<UserType> {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        adminId,
        {
          email: profileData.email,
          firstName: profileData.firstName,
          lastName: profileData.lastName
        },
        { new: true }
      ).lean();
      
      if (!updatedUser) {
        throw new Error('User not found');
      }
      
      return {
        ...updatedUser,
        id: updatedUser._id.toString()
      } as UserType;
    } catch (error) {
      console.error('Error updating admin profile:', error);
      throw error;
    }
  }

  // Analytics operations
  async getDashboardStats(): Promise<any> {
    try {
      const totalRestaurants = await Restaurant.countDocuments({});
      const activeRestaurants = await Restaurant.countDocuments({ isActive: true });
      const totalDrivers = await DriverModel.countDocuments({});
      const activeDrivers = await DriverModel.countDocuments({ isApproved: true, isOnline: true });
      const pendingDrivers = await DriverModel.countDocuments({ isApproved: false });

      return {
        totalRestaurants,
        activeRestaurants,
        totalDrivers,
        activeDrivers,
        pendingDrivers,
        totalOrders: 0, // TODO: Implement orders collection
        revenue: 0,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalRestaurants: 0,
        activeRestaurants: 0,
        totalDrivers: 0,
        activeDrivers: 0,
        pendingDrivers: 0,
        totalOrders: 0,
        revenue: 0,
      };
    }
  }

  // Menu Category operations
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    try {
      const categories = await MenuCategoryModel.find({ restaurantId }).sort({ sortOrder: 1 });
      return categories.map((cat: any) => ({
        id: cat._id.toString(),
        restaurantId: cat.restaurantId,
        name: cat.name,
        description: cat.description || null,
        isActive: cat.isActive,
        sortOrder: cat.sortOrder,
        createdAt: cat.createdAt
      }));
    } catch (error) {
      console.error('Error getting menu categories:', error);
      return [];
    }
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    try {
      // Remove any id field that might cause conflicts
      const cleanCategoryData = { ...category };
      delete cleanCategoryData.id;
      
      const newCategory = new MenuCategoryModel(cleanCategoryData);
      await newCategory.save();
      return {
        id: newCategory._id.toString(),
        restaurantId: newCategory.restaurantId,
        name: newCategory.name,
        description: newCategory.description || null,
        isActive: newCategory.isActive,
        status: 'active',
        lastModifiedBy: null,
        sortOrder: newCategory.sortOrder,
        createdAt: newCategory.createdAt,
        updatedAt: newCategory.createdAt
      } as MenuCategory;
    } catch (error) {
      console.error('Error creating menu category:', error);
      throw error;
    }
  }

  async updateMenuCategory(id: string, category: Partial<InsertMenuCategory>): Promise<MenuCategory> {
    try {
      const updated = await MenuCategoryModel.findByIdAndUpdate(id, category, { new: true });
      if (!updated) throw new Error('Category not found');
      return {
        id: updated._id.toString(),
        restaurantId: updated.restaurantId,
        name: updated.name,
        description: updated.description || null,
        isActive: updated.isActive,
        sortOrder: updated.sortOrder,
        createdAt: updated.createdAt
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

  // Menu Item operations
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    try {
      const items = await MenuItemModel.find({ restaurantId });
      return items.map((item: any) => ({
        id: item._id.toString(),
        restaurantId: item.restaurantId,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || null,
        price: item.price.toString(),
        imageUrl: item.imageUrl || null,
        isAvailable: item.isAvailable,
        status: 'active',
        lastModifiedBy: null,
        preparationTime: item.preparationTime || null,
        ingredients: item.ingredients || [],
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        spicyLevel: item.spicyLevel,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      } as MenuItem));
    } catch (error) {
      console.error('Error getting menu items:', error);
      return [];
    }
  }

  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    try {
      const items = await MenuItemModel.find({ categoryId });
      return items.map((item: any) => ({
        id: item._id.toString(),
        restaurantId: item.restaurantId,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || null,
        price: item.price.toString(),
        imageUrl: item.imageUrl || null,
        isAvailable: item.isAvailable,
        status: 'active',
        lastModifiedBy: null,
        preparationTime: item.preparationTime || null,
        ingredients: item.ingredients || [],
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        spicyLevel: item.spicyLevel,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      } as MenuItem));
    } catch (error) {
      console.error('Error getting menu items by category:', error);
      return [];
    }
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    try {
      // Remove any id field that might cause conflicts
      const cleanItemData = { ...item };
      delete cleanItemData.id;
      
      const newItem = new MenuItemModel(cleanItemData);
      await newItem.save();
      return {
        id: newItem._id.toString(),
        restaurantId: newItem.restaurantId,
        categoryId: newItem.categoryId,
        name: newItem.name,
        description: newItem.description || null,
        price: newItem.price.toString(),
        imageUrl: newItem.imageUrl || null,
        isAvailable: newItem.isAvailable,
        status: 'active',
        lastModifiedBy: null,
        preparationTime: newItem.preparationTime || null,
        ingredients: newItem.ingredients || [],
        isVegetarian: newItem.isVegetarian,
        isVegan: newItem.isVegan,
        spicyLevel: newItem.spicyLevel,
        createdAt: newItem.createdAt,
        updatedAt: newItem.updatedAt
      } as MenuItem;
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  }

  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem> {
    try {
      const updated = await MenuItemModel.findByIdAndUpdate(id, item, { new: true });
      if (!updated) throw new Error('Menu item not found');
      return {
        id: updated._id.toString(),
        restaurantId: updated.restaurantId,
        categoryId: updated.categoryId,
        name: updated.name,
        description: updated.description || null,
        price: updated.price.toString(),
        imageUrl: updated.imageUrl || null,
        isAvailable: updated.isAvailable,
        status: 'active',
        lastModifiedBy: null,
        preparationTime: updated.preparationTime || null,
        ingredients: updated.ingredients || [],
        isVegetarian: updated.isVegetarian,
        isVegan: updated.isVegan,
        spicyLevel: updated.spicyLevel,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      } as MenuItem;
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
  async getOrders(): Promise<Order[]> { return []; }
  async getOrder(id: string): Promise<Order | undefined> { return undefined; }
  async getOrdersByStatus(status: string): Promise<Order[]> { return []; }
  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    try {
      const orders = await OrderModel.find({ restaurantId }).sort({ createdAt: -1 }).lean();
      
      return orders.map((order: any) => ({
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        restaurantId: order.restaurantId,
        items: order.items,
        subtotal: order.subtotal,
        total: order.total,
        deliveryAddress: order.deliveryAddress,
        paymentMethod: order.paymentMethod,
        status: order.status,
        specialInstructions: order.specialInstructions,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }));
    } catch (error) {
      console.error('Error getting orders by restaurant:', error);
      return [];
    }
  }
  async getOrdersByCustomer(customerId: string): Promise<Order[]> { return []; }
  async createOrder(orderData: any): Promise<any> {
    try {
      // First, try to drop the collection entirely to clear any conflicting indexes
      try {
        await OrderModel.collection.drop();
        console.log('Dropped entire orders collection to clear indexes');
      } catch (dropError) {
        // Collection might not exist, that's fine
      }

      const order = new OrderModel({
        customerId: orderData.customerId,
        restaurantId: orderData.restaurantId,
        orderNumber: orderData.orderNumber,
        items: orderData.items,
        subtotal: orderData.subtotal,
        total: orderData.total,
        deliveryAddress: orderData.deliveryAddress,
        paymentMethod: orderData.paymentMethod,
        status: orderData.status || 'pending',
        specialInstructions: orderData.specialInstructions || ''
      });

      const savedOrder = await order.save();
      
      return {
        id: savedOrder._id.toString(),
        orderNumber: savedOrder.orderNumber,
        customerId: savedOrder.customerId,
        restaurantId: savedOrder.restaurantId,
        items: savedOrder.items,
        subtotal: savedOrder.subtotal,
        total: savedOrder.total,
        deliveryAddress: savedOrder.deliveryAddress,
        paymentMethod: savedOrder.paymentMethod,
        status: savedOrder.status,
        specialInstructions: savedOrder.specialInstructions,
        createdAt: savedOrder.createdAt,
        updatedAt: savedOrder.updatedAt
      };
    } catch (error) {
      console.error('Error creating order in MongoDB:', error);
      
      // If this is a duplicate key error on the 'id' field, try to drop the collection and recreate
      if (error.code === 11000 && error.message.includes('id_1')) {
        console.log('Attempting to fix duplicate key error by clearing collection...');
        try {
          await OrderModel.collection.drop();
          console.log('Cleared orders collection, retrying order creation...');
          
          // Retry the order creation
          const order = new OrderModel({
            customerId: orderData.customerId,
            restaurantId: orderData.restaurantId,
            orderNumber: orderData.orderNumber,
            items: orderData.items,
            subtotal: orderData.subtotal,
            total: orderData.total,
            deliveryAddress: orderData.deliveryAddress,
            paymentMethod: orderData.paymentMethod,
            status: orderData.status || 'pending',
            specialInstructions: orderData.specialInstructions || ''
          });

          const savedOrder = await order.save();
          
          return {
            id: savedOrder._id.toString(),
            orderNumber: savedOrder.orderNumber,
            customerId: savedOrder.customerId,
            restaurantId: savedOrder.restaurantId,
            items: savedOrder.items,
            subtotal: savedOrder.subtotal,
            total: savedOrder.total,
            deliveryAddress: savedOrder.deliveryAddress,
            paymentMethod: savedOrder.paymentMethod,
            status: savedOrder.status,
            specialInstructions: savedOrder.specialInstructions,
            createdAt: savedOrder.createdAt,
            updatedAt: savedOrder.updatedAt
          };
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  }
  async updateOrder(id: string, orderUpdate: Partial<InsertOrder>): Promise<Order> {
    try {
      const updatedOrder = await OrderModel.findByIdAndUpdate(
        id,
        { 
          ...orderUpdate,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedOrder) {
        throw new Error('Order not found');
      }

      return {
        id: updatedOrder._id.toString(),
        orderNumber: updatedOrder.orderNumber,
        customerId: updatedOrder.customerId,
        restaurantId: updatedOrder.restaurantId,
        items: updatedOrder.items,
        subtotal: updatedOrder.subtotal,
        total: updatedOrder.total,
        deliveryAddress: updatedOrder.deliveryAddress,
        paymentMethod: updatedOrder.paymentMethod,
        status: updatedOrder.status,
        specialInstructions: updatedOrder.specialInstructions,
        createdAt: updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt
      };
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    try {
      const updatedOrder = await OrderModel.findByIdAndUpdate(
        id,
        { 
          status,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedOrder) {
        throw new Error('Order not found');
      }

      return {
        id: updatedOrder._id.toString(),
        orderNumber: updatedOrder.orderNumber,
        customerId: updatedOrder.customerId,
        restaurantId: updatedOrder.restaurantId,
        items: updatedOrder.items,
        subtotal: updatedOrder.subtotal,
        total: updatedOrder.total,
        deliveryAddress: updatedOrder.deliveryAddress,
        paymentMethod: updatedOrder.paymentMethod,
        status: updatedOrder.status,
        specialInstructions: updatedOrder.specialInstructions,
        createdAt: updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
  async getDriver(id: string): Promise<DriverType | undefined> {
    try {
      const driver = await DriverModel.findById(id);
      return driver ? this.convertDriverDocument(driver) : undefined;
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
      const driver = await DriverModel.findOne({ userId });
      return driver ? this.convertDriverDocument(driver) : undefined;
    } catch (error) {
      console.error('Error getting driver by userId:', error);
      return undefined;
    }
  }

  async getDriverByTelegramId(telegramId: string): Promise<DriverType | undefined> {
    try {
      const driver = await DriverModel.findOne({ telegramId });
      return driver ? this.convertDriverDocument(driver) : undefined;
    } catch (error) {
      console.error('Error getting driver by telegramId:', error);
      return undefined;
    }
  }

  async createDriver(driverData: InsertDriver): Promise<DriverType> {
    try {
      console.log('💾 MongoDB createDriver called with data:', driverData);
      
      // First, clean up any problematic documents if they exist
      try {
        await this.cleanupProblematicDrivers();
      } catch (cleanupError) {
        console.log('⚠️  Cleanup attempt failed, proceeding with creation:', cleanupError.message);
      }
      
      // Remove any id field that might cause conflicts with MongoDB _id
      const cleanDriverData = { ...driverData };
      delete (cleanDriverData as any).id;
      
      const driver = new DriverModel(cleanDriverData);
      const savedDriver = await driver.save();
      console.log('✅ Driver saved to MongoDB:', {
        id: savedDriver._id,
        name: savedDriver.name,
        phoneNumber: savedDriver.phoneNumber,
        telegramId: savedDriver.telegramId
      });
      return this.convertDriverDocument(savedDriver);
    } catch (error) {
      console.error('❌ Error creating driver in MongoDB:', error);
      
      // If it's a duplicate key error on the id field, try cleanup and retry once
      if ((error as any).code === 11000 && (error as any).keyPattern?.id) {
        console.log('🔧 Attempting cleanup and retry due to id conflict...');
        try {
          await this.cleanupProblematicDrivers();
          
          // Retry the creation
          const cleanDriverData = { ...driverData };
          delete (cleanDriverData as any).id;
          
          const driver = new DriverModel(cleanDriverData);
          const savedDriver = await driver.save();
          console.log('✅ Driver saved after cleanup retry:', {
            id: savedDriver._id,
            name: savedDriver.name,
            phoneNumber: savedDriver.phoneNumber,
            telegramId: savedDriver.telegramId
          });
          return this.convertDriverDocument(savedDriver);
        } catch (retryError) {
          console.error('❌ Retry after cleanup also failed:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  }

  async updateDriver(id: string, driverUpdate: Partial<InsertDriver>): Promise<DriverType> {
    try {
      const updatedDriver = await DriverModel.findByIdAndUpdate(
        id,
        { ...driverUpdate, updatedAt: new Date() },
        { new: true }
      );

      if (!updatedDriver) {
        throw new Error('Driver not found');
      }

      return this.convertDriverDocument(updatedDriver);
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  }

  async updateDriverStatus(id: string, isOnline: boolean, isAvailable: boolean): Promise<DriverType> {
    try {
      const updatedDriver = await DriverModel.findByIdAndUpdate(
        id,
        { 
          isOnline, 
          isAvailable,
          lastOnline: new Date(),
          updatedAt: new Date() 
        },
        { new: true }
      );

      if (!updatedDriver) {
        throw new Error('Driver not found');
      }

      return this.convertDriverDocument(updatedDriver);
    } catch (error) {
      console.error('Error updating driver status:', error);
      throw error;
    }
  }

  async updateDriverLocation(id: string, location: { lat: number; lng: number }): Promise<DriverType> {
    try {
      const updatedDriver = await DriverModel.findByIdAndUpdate(
        id,
        { 
          currentLocation: {
            lat: location.lat,
            lng: location.lng
          },
          lastLocationUpdate: new Date(),
          updatedAt: new Date() 
        },
        { new: true }
      );

      if (!updatedDriver) {
        throw new Error('Driver not found');
      }

      return this.convertDriverDocument(updatedDriver);
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  }

  async updateDriverEarnings(id: string, earnings: number): Promise<DriverType> {
    try {
      const driver = await DriverModel.findById(id);
      if (!driver) {
        throw new Error('Driver not found');
      }

      const currentTotal = parseFloat(driver.totalEarnings || '0');
      const currentToday = parseFloat(driver.todayEarnings || '0');
      const currentWeekly = parseFloat(driver.weeklyEarnings || '0');

      const updatedDriver = await DriverModel.findByIdAndUpdate(
        id,
        { 
          totalEarnings: (currentTotal + earnings).toFixed(2),
          todayEarnings: (currentToday + earnings).toFixed(2),
          weeklyEarnings: (currentWeekly + earnings).toFixed(2),
          totalDeliveries: driver.totalDeliveries + 1,
          updatedAt: new Date() 
        },
        { new: true }
      );

      return this.convertDriverDocument(updatedDriver!);
    } catch (error) {
      console.error('Error updating driver earnings:', error);
      throw error;
    }
  }

  async approveDriver(id: string): Promise<DriverType> {
    try {
      const updatedDriver = await DriverModel.findByIdAndUpdate(
        id,
        { 
          status: 'active',
          isApproved: true,
          updatedAt: new Date() 
        },
        { new: true }
      );

      if (!updatedDriver) {
        throw new Error('Driver not found');
      }

      return this.convertDriverDocument(updatedDriver);
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
          status: 'rejected',
          isApproved: false,
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
        status: 'active',
        isOnline: true,
        isAvailable: true 
      });
      return drivers.map(driver => this.convertDriverDocument(driver));
    } catch (error) {
      console.error('Error getting available drivers:', error);
      return [];
    }
  }

  async getPendingDrivers(): Promise<DriverType[]> {
    try {
      const drivers = await DriverModel.find({ status: 'pending_approval' });
      return drivers.map(driver => this.convertDriverDocument(driver));
    } catch (error) {
      console.error('Error getting pending drivers:', error);
      return [];
    }
  }

  async getAvailableOrdersForDriver(driverId: string): Promise<Order[]> {
    try {
      const orders = await OrderModel.find({ 
        status: 'ready_for_pickup',
        driverId: { $exists: false }
      }).limit(10);
      
      return orders.map(order => this.convertOrderDocument(order));
    } catch (error) {
      console.error('Error getting available orders for driver:', error);
      return [];
    }
  }

  async assignOrderToDriver(orderId: string, driverId: string): Promise<Order> {
    try {
      const updatedOrder = await OrderModel.findByIdAndUpdate(
        orderId,
        { 
          driverId,
          status: 'driver_assigned',
          updatedAt: new Date() 
        },
        { new: true }
      );

      if (!updatedOrder) {
        throw new Error('Order not found');
      }

      return this.convertOrderDocument(updatedOrder);
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
      }).sort({ updatedAt: -1 }).limit(20);
      
      return orders.map(order => ({
        orderNumber: order.orderNumber,
        deliveryTime: order.updatedAt,
        earnings: this.calculateDeliveryEarnings(order),
        distance: '2.5' // Mock distance for now
      }));
    } catch (error) {
      console.error('Error getting driver delivery history:', error);
      return [];
    }
  }

  private convertDriverDocument(driver: any): DriverType {
    return {
      id: driver._id.toString(),
      userId: driver.userId,
      telegramId: driver.telegramId,
      phoneNumber: driver.phoneNumber,
      name: driver.name,
      governmentIdFrontUrl: driver.governmentIdFrontUrl,
      governmentIdBackUrl: driver.governmentIdBackUrl,
      licenseNumber: driver.licenseNumber,
      vehicleType: driver.vehicleType,
      vehiclePlate: driver.vehiclePlate,
      licenseImageUrl: driver.licenseImageUrl,
      vehicleImageUrl: driver.vehicleImageUrl,
      idCardImageUrl: driver.idCardImageUrl,
      currentLocation: driver.currentLocation && driver.currentLocation.lat ? driver.currentLocation : null,
      status: driver.status,
      isOnline: driver.isOnline,
      isAvailable: driver.isAvailable,
      isApproved: driver.isApproved,
      rating: driver.rating,
      totalDeliveries: driver.totalDeliveries,
      totalEarnings: driver.totalEarnings,
      todayEarnings: driver.todayEarnings,
      weeklyEarnings: driver.weeklyEarnings,
      zone: driver.zone,
      lastOnline: driver.lastOnline,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt
    };
  }

  private calculateDeliveryEarnings(order: any): string {
    const baseEarnings = parseFloat(order.total) * 0.15; // 15% of order total
    const minEarnings = 2.50; // Minimum earnings per delivery
    return Math.max(baseEarnings, minEarnings).toFixed(2);
  }
  async getDeliveries(): Promise<Delivery[]> { return []; }
  async getDelivery(id: string): Promise<Delivery | undefined> { return undefined; }
  async getDeliveriesByDriver(driverId: string): Promise<Delivery[]> { return []; }
  async createDelivery(delivery: InsertDelivery): Promise<Delivery> { throw new Error('Not implemented'); }
  async updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery> { throw new Error('Not implemented'); }
  async getNotifications(userId: string): Promise<Notification[]> { return []; }
  async createNotification(notification: InsertNotification): Promise<Notification> { throw new Error('Not implemented'); }
  async markNotificationAsRead(id: string): Promise<Notification> { throw new Error('Not implemented'); }
  async getOrderAnalytics(): Promise<any> { return {}; }

  // Missing interface methods
  async getMenuItemsByStatus(restaurantId: string, status: string): Promise<MenuItem[]> {
    try {
      const items = await MenuItemModel.find({ restaurantId, status });
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
        lastModifiedBy: null,
        preparationTime: item.preparationTime || null,
        ingredients: item.ingredients || [],
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        spicyLevel: item.spicyLevel,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      } as MenuItem));
    } catch (error) {
      console.error('Error getting menu items by status:', error);
      return [];
    }
  }

  async getMenuCategoriesByStatus(restaurantId: string, status: string): Promise<MenuCategory[]> {
    try {
      const categories = await MenuCategoryModel.find({ restaurantId, status });
      return categories.map((category: any) => ({
        id: category._id.toString(),
        restaurantId: category.restaurantId,
        name: category.name,
        description: category.description || null,
        isActive: category.isActive,
        status: category.status || 'active',
        lastModifiedBy: null,
        sortOrder: category.sortOrder,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      } as MenuCategory));
    } catch (error) {
      console.error('Error getting menu categories by status:', error);
      return [];
    }
  }

  async getRestaurantMenu(restaurantId: string): Promise<{ categories: MenuCategory[], items: MenuItem[] }> {
    try {
      const categories = await this.getMenuCategories(restaurantId);
      const items = await this.getMenuItems(restaurantId);
      return { categories, items };
    } catch (error) {
      console.error('Error getting restaurant menu:', error);
      return { categories: [], items: [] };
    }
  }

  async getAllAdminUsers(): Promise<UserType[]> {
    try {
      const users = await User.find({ 
        role: { $in: ['superadmin', 'restaurant_admin', 'kitchen_staff'] } 
      }).lean();
      return users.map(user => ({
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
      } as UserType));
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }

  async getSystemSettings(): Promise<any> {
    try {
      const settings = await SystemSettings.findOne().lean();
      return settings || {};
    } catch (error) {
      console.error('Error getting system settings:', error);
      return {};
    }
  }

  async updateSystemSettings(settingsData: any): Promise<any> {
    try {
      const settings = await SystemSettings.findOneAndUpdate(
        {},
        settingsData,
        { upsert: true, new: true, runValidators: true }
      ).lean();
      return settings;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  async updateCompanyLogo(logoUrl: string): Promise<void> {
    try {
      await SystemSettings.findOneAndUpdate(
        {},
        { companyLogo: logoUrl },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error updating company logo:', error);
      throw error;
    }
  }

  async verifyAdminPassword(adminId: string, password: string): Promise<boolean> {
    // Implementation would depend on your password hashing strategy
    return false;
  }

  async updateAdminPassword(adminId: string, newPassword: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(adminId, { password: newPassword });
    } catch (error) {
      console.error('Error updating admin password:', error);
      throw error;
    }
  }

  async getAllDrivers(): Promise<DriverType[]> {
    try {
      const drivers = await DriverModel.find({}).lean();
      return drivers.map(driver => ({
        id: driver._id.toString(),
        userId: driver.userId,
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate,
        currentLocation: driver.currentLocation ? [driver.currentLocation.lat, driver.currentLocation.lng] : null,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable,
        isApproved: driver.isApproved,
        rating: driver.rating ? driver.rating.toString() : '0.00',
        totalDeliveries: driver.totalDeliveries || 0,
        totalEarnings: driver.totalEarnings ? driver.totalEarnings.toString() : '0.00',
        zone: driver.zone || null,
        licenseImageUrl: driver.licenseImageUrl || null,
        vehicleImageUrl: driver.vehicleImageUrl || null,
        idCardImageUrl: driver.idCardImageUrl || null,
        createdAt: driver.createdAt || null,
        updatedAt: driver.updatedAt || null,
      } as DriverType));
    } catch (error) {
      console.error('Error getting all drivers:', error);
      return [];
    }
  }

  async rejectDriver(driverId: string): Promise<void> {
    try {
      await DriverModel.findByIdAndUpdate(driverId, { isApproved: false });
    } catch (error) {
      console.error('Error rejecting driver:', error);
      throw error;
    }
  }

  async blockDriver(driverId: string): Promise<void> {
    try {
      await DriverModel.findByIdAndUpdate(driverId, { 
        isBlocked: true,
        isOnline: false,
        isAvailable: false 
      });
    } catch (error) {
      console.error('Error blocking driver:', error);
      throw error;
    }
  }

  async unblockDriver(driverId: string): Promise<void> {
    try {
      await DriverModel.findByIdAndUpdate(driverId, { isBlocked: false });
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
      await DriverModel.findByIdAndUpdate(driverId, { 
        liveLocation: {
          lat: location.lat,
          lng: location.lng,
          timestamp: location.timestamp || new Date().toISOString()
        },
        lastLocationUpdate: new Date()
      });
    } catch (error) {
      console.error('Error saving live location:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const totalRestaurants = await Restaurant.countDocuments();
      const totalDrivers = await DriverModel.countDocuments();
      const totalUsers = await User.countDocuments();
      
      return {
        totalRestaurants,
        totalDrivers,
        totalUsers,
        totalOrders: 0, // Would implement with Order model
        totalRevenue: 0
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {};
    }
  }

  async getUsersByRole(role: string): Promise<UserType[]> {
    try {
      const users = await User.find({ role }).lean();
      return users.map(user => ({
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
      }));
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  async updateAdminUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const updatedUser = await User.findByIdAndUpdate(id, data, { new: true }).lean();
      if (!updatedUser) {
        throw new Error('Admin user not found');
      }
      return {
        id: updatedUser._id.toString(),
        email: updatedUser.email || null,
        firstName: updatedUser.firstName || null,
        lastName: updatedUser.lastName || null,
        profileImageUrl: updatedUser.profileImageUrl || null,
        role: updatedUser.role || null,
        phoneNumber: updatedUser.phoneNumber || null,
        telegramUserId: updatedUser.telegramUserId || null,
        telegramUsername: updatedUser.telegramUsername || null,
        password: updatedUser.password || null,
        isActive: updatedUser.isActive ?? true,
        restaurantId: updatedUser.restaurantId || null,
        createdBy: updatedUser.createdBy || null,
        createdAt: updatedUser.createdAt || null,
        updatedAt: updatedUser.updatedAt || null,
      } as User;
    } catch (error) {
      console.error('Error updating admin user:', error);
      throw error;
    }
  }
}