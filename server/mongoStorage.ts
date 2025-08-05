import { IStorage } from './storage';
import { User } from './models/User';
import { Restaurant } from './models/Restaurant';  
import { Driver } from './models/Driver';
import { SystemSettings } from './models/SystemSettings';
import { MenuCategory as MenuCategoryModel } from './models/MenuCategory';
import { MenuItem as MenuItemModel } from './models/MenuItem';
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

  // Driver operations
  async getDrivers(): Promise<DriverType[]> {
    try {
      const drivers = await Driver.find({}).lean();
      return drivers.map(d => ({ ...d, id: d._id.toString() })) as DriverType[];
    } catch (error) {
      console.error('Error getting drivers:', error);
      return [];
    }
  }

  async getAllDrivers(): Promise<any[]> {
    try {
      const drivers = await Driver.find({}).populate('userId').lean();
      return drivers.map(d => ({
        ...d,
        id: d._id.toString(),
        user: d.userId
      }));
    } catch (error) {
      console.error('Error getting all drivers:', error);
      return [];
    }
  }

  async approveDriver(driverId: string): Promise<DriverType> {
    try {
      const driver = await Driver.findByIdAndUpdate(
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
      await Driver.findByIdAndDelete(driverId);
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
      const totalDrivers = await Driver.countDocuments({});
      const activeDrivers = await Driver.countDocuments({ isApproved: true, isOnline: true });
      const pendingDrivers = await Driver.countDocuments({ isApproved: false });

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
  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> { return []; }
  async getOrdersByCustomer(customerId: string): Promise<Order[]> { return []; }
  async createOrder(order: InsertOrder): Promise<Order> { throw new Error('Not implemented'); }
  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order> { throw new Error('Not implemented'); }
  async updateOrderStatus(id: string, status: string): Promise<Order> { throw new Error('Not implemented'); }
  async getDriver(id: string): Promise<DriverType | undefined> { return undefined; }
  async getDriverByUserId(userId: string): Promise<DriverType | undefined> { return undefined; }
  async createDriver(driver: InsertDriver): Promise<DriverType> { throw new Error('Not implemented'); }
  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<DriverType> { throw new Error('Not implemented'); }
  async getAvailableDrivers(): Promise<DriverType[]> { return []; }
  async updateDriverLocation(id: string, location: any): Promise<DriverType> { throw new Error('Not implemented'); }
  async updateDriverStatus(id: string, isOnline: boolean, isAvailable: boolean): Promise<DriverType> { throw new Error('Not implemented'); }
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
      const drivers = await Driver.find({}).lean();
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
      await Driver.findByIdAndUpdate(driverId, { isApproved: false });
    } catch (error) {
      console.error('Error rejecting driver:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const totalRestaurants = await Restaurant.countDocuments();
      const totalDrivers = await Driver.countDocuments();
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