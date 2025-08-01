import {
  type User,
  type UpsertUser,
  type Restaurant,
  type InsertRestaurant,
  type MenuCategory,
  type InsertMenuCategory,
  type MenuItem,
  type InsertMenuItem,
  type Order,
  type InsertOrder,
  type Driver,
  type InsertDriver,
  type Delivery,
  type InsertDelivery,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { connectDB } from "./db";
import {
  User as UserModel,
  Restaurant as RestaurantModel,
  MenuCategory as MenuCategoryModel,
  MenuItem as MenuItemModel,
  Order as OrderModel,
  Driver as DriverModel,
  Delivery as DeliveryModel,
  Notification as NotificationModel,
  type IUser,
  type IRestaurant,
  type IMenuCategory,
  type IMenuItem,
  type IOrder,
  type IDriver,
  type IDelivery,
  type INotification,
} from "./models";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByTelegramId(telegramUserId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserRole(userId: string, role: string): Promise<User>;
  createAdminUser(userData: any): Promise<User>;

  // Restaurant operations
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant>;
  deleteRestaurant(id: string): Promise<void>;
  approveRestaurant(id: string): Promise<Restaurant>;

  // Menu operations
  getMenuCategories(restaurantId: string): Promise<MenuCategory[]>;
  createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory>;
  updateMenuCategory(id: string, category: Partial<InsertMenuCategory>): Promise<MenuCategory>;
  deleteMenuCategory(id: string): Promise<void>;

  getMenuItems(restaurantId: string): Promise<MenuItem[]>;
  getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem>;
  deleteMenuItem(id: string): Promise<void>;

  // Order operations
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  getOrdersByRestaurant(restaurantId: string): Promise<Order[]>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;

  // Driver operations
  getDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverByUserId(userId: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver>;
  approveDriver(id: string): Promise<Driver>;
  getAvailableDrivers(): Promise<Driver[]>;
  updateDriverLocation(id: string, location: any): Promise<Driver>;
  updateDriverStatus(id: string, isOnline: boolean, isAvailable: boolean): Promise<Driver>;

  // Delivery operations
  getDeliveries(): Promise<Delivery[]>;
  getDelivery(id: string): Promise<Delivery | undefined>;
  getDeliveriesByDriver(driverId: string): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification>;

  // Analytics operations
  getDashboardStats(): Promise<any>;
  getOrderAnalytics(): Promise<any>;
}

class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private restaurants = new Map<string, Restaurant>();
  private menuCategories = new Map<string, MenuCategory>();
  private menuItems = new Map<string, MenuItem>();
  private orders = new Map<string, Order>();
  private drivers = new Map<string, Driver>();
  private deliveries = new Map<string, Delivery>();
  private notifications = new Map<string, Notification>();

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || crypto.randomUUID();
    const user: User = {
      id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || null,
      phoneNumber: userData.phoneNumber || null,
      telegramUserId: userData.telegramUserId || null,
      telegramUsername: userData.telegramUsername || null,
      password: userData.password || null,
      isActive: userData.isActive ?? true,
      restaurantId: userData.restaurantId || null,
      createdBy: userData.createdBy || null,
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByTelegramId(telegramUserId: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.telegramUserId === telegramUserId) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createAdminUser(userData: any): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = {
      id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || null,
      phoneNumber: userData.phoneNumber || null,
      telegramUserId: userData.telegramUserId || null,
      telegramUsername: userData.telegramUsername || null,
      password: userData.password || null,
      isActive: userData.isActive ?? true,
      restaurantId: userData.restaurantId || null,
      createdBy: userData.createdBy || null,
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    const updatedUser = { ...user, role, updatedAt: new Date() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Restaurant operations
  async getRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async createRestaurant(restaurantData: InsertRestaurant): Promise<Restaurant> {
    const id = crypto.randomUUID();
    const restaurant: Restaurant = {
      id,
      name: restaurantData.name,
      description: restaurantData.description || null,
      address: restaurantData.address,
      phoneNumber: restaurantData.phoneNumber,
      email: restaurantData.email || null,
      location: restaurantData.location || null,
      imageUrl: restaurantData.imageUrl || null,
      isActive: false,
      isApproved: false,
      rating: "0.00",
      totalOrders: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.restaurants.set(id, restaurant);
    return restaurant;
  }

  async updateRestaurant(id: string, restaurantData: Partial<InsertRestaurant>): Promise<Restaurant> {
    const existing = this.restaurants.get(id);
    if (!existing) throw new Error('Restaurant not found');
    const updated = { ...existing, ...restaurantData, updatedAt: new Date() };
    this.restaurants.set(id, updated);
    return updated;
  }

  async deleteRestaurant(id: string): Promise<void> {
    this.restaurants.delete(id);
  }

  async approveRestaurant(id: string): Promise<Restaurant> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) throw new Error('Restaurant not found');
    const updated = { ...restaurant, isApproved: true, isActive: true, updatedAt: new Date() };
    this.restaurants.set(id, updated);
    return updated;
  }

  // Menu operations
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    return Array.from(this.menuCategories.values())
      .filter(cat => cat.restaurantId === restaurantId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const id = crypto.randomUUID();
    const newCategory: MenuCategory = {
      id,
      restaurantId: category.restaurantId,
      name: category.name,
      description: category.description || null,
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
    };
    this.menuCategories.set(id, newCategory);
    return newCategory;
  }

  async updateMenuCategory(id: string, category: Partial<InsertMenuCategory>): Promise<MenuCategory> {
    const existing = this.menuCategories.get(id);
    if (!existing) throw new Error('Category not found');
    const updated = { ...existing, ...category };
    this.menuCategories.set(id, updated);
    return updated;
  }

  async deleteMenuCategory(id: string): Promise<void> {
    this.menuCategories.delete(id);
  }

  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values())
      .filter(item => item.restaurantId === restaurantId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values())
      .filter(item => item.categoryId === categoryId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const id = crypto.randomUUID();
    const newItem: MenuItem = {
      id,
      restaurantId: item.restaurantId,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || null,
      price: item.price,
      imageUrl: item.imageUrl || null,
      isAvailable: true,
      preparationTime: item.preparationTime || null,
      ingredients: item.ingredients || null,
      isVegetarian: false,
      isVegan: false,
      spicyLevel: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.menuItems.set(id, newItem);
    return newItem;
  }

  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem> {
    const existing = this.menuItems.get(id);
    if (!existing) throw new Error('Menu item not found');
    const updated = { ...existing, ...item, updatedAt: new Date() };
    this.menuItems.set(id, updated);
    return updated;
  }

  async deleteMenuItem(id: string): Promise<void> {
    this.menuItems.delete(id);
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.status === status)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.restaurantId === restaurantId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.customerId === customerId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = crypto.randomUUID();
    const orderNumber = `ORD-${Date.now()}`;
    const newOrder: Order = {
      ...order,
      id,
      orderNumber,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order> {
    const existing = this.orders.get(id);
    if (!existing) throw new Error('Order not found');
    const updated = { ...existing, ...order, updatedAt: new Date() };
    this.orders.set(id, updated);
    return updated;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const existing = this.orders.get(id);
    if (!existing) throw new Error('Order not found');
    const updated = { ...existing, status: status as any, updatedAt: new Date() };
    this.orders.set(id, updated);
    return updated;
  }

  // Driver operations
  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    for (const driver of this.drivers.values()) {
      if (driver.userId === userId) {
        return driver;
      }
    }
    return undefined;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const id = crypto.randomUUID();
    const newDriver: Driver = {
      ...driver,
      id,
      isOnline: false,
      isAvailable: false,
      isApproved: false,
      rating: "0.00",
      totalDeliveries: 0,
      totalEarnings: "0.00",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.drivers.set(id, newDriver);
    return newDriver;
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver> {
    const existing = this.drivers.get(id);
    if (!existing) throw new Error('Driver not found');
    const updated = { ...existing, ...driver, updatedAt: new Date() };
    this.drivers.set(id, updated);
    return updated;
  }

  async approveDriver(id: string): Promise<Driver> {
    const driver = this.drivers.get(id);
    if (!driver) throw new Error('Driver not found');
    const updated = { ...driver, isApproved: true, updatedAt: new Date() };
    this.drivers.set(id, updated);
    return updated;
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values())
      .filter(driver => driver.isApproved && driver.isOnline && driver.isAvailable);
  }

  async updateDriverLocation(id: string, location: any): Promise<Driver> {
    const driver = this.drivers.get(id);
    if (!driver) throw new Error('Driver not found');
    const updated = { ...driver, currentLocation: location, updatedAt: new Date() };
    this.drivers.set(id, updated);
    return updated;
  }

  async updateDriverStatus(id: string, isOnline: boolean, isAvailable: boolean): Promise<Driver> {
    const driver = this.drivers.get(id);
    if (!driver) throw new Error('Driver not found');
    const updated = { ...driver, isOnline, isAvailable, updatedAt: new Date() };
    this.drivers.set(id, updated);
    return updated;
  }

  // Delivery operations
  async getDeliveries(): Promise<Delivery[]> {
    return Array.from(this.deliveries.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    return this.deliveries.get(id);
  }

  async getDeliveriesByDriver(driverId: string): Promise<Delivery[]> {
    return Array.from(this.deliveries.values())
      .filter(delivery => delivery.driverId === driverId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const id = crypto.randomUUID();
    const newDelivery: Delivery = {
      ...delivery,
      id,
      status: 'assigned',
      tips: "0.00",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.deliveries.set(id, newDelivery);
    return newDelivery;
  }

  async updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery> {
    const existing = this.deliveries.get(id);
    if (!existing) throw new Error('Delivery not found');
    const updated = { ...existing, ...delivery, updatedAt: new Date() };
    this.deliveries.set(id, updated);
    return updated;
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = crypto.randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      isRead: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const notification = this.notifications.get(id);
    if (!notification) throw new Error('Notification not found');
    const updated = { ...notification, isRead: true };
    this.notifications.set(id, updated);
    return updated;
  }

  // Analytics operations
  async getDashboardStats(): Promise<any> {
    const totalOrders = this.orders.size;
    const totalRestaurants = this.restaurants.size;
    const activeRestaurants = Array.from(this.restaurants.values()).filter(r => r.isActive).length;
    const totalDrivers = this.drivers.size;
    const activeDrivers = Array.from(this.drivers.values()).filter(d => d.isApproved && d.isOnline).length;
    const pendingDrivers = Array.from(this.drivers.values()).filter(d => !d.isApproved).length;
    
    const revenue = Array.from(this.orders.values())
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);

    return {
      totalOrders,
      totalRestaurants,
      activeRestaurants,
      totalDrivers,
      activeDrivers,
      pendingDrivers,
      revenue,
    };
  }

  async getOrderAnalytics(): Promise<any> {
    const paidOrders = Array.from(this.orders.values()).filter(order => order.paymentStatus === 'paid');
    const avgOrderValue = paidOrders.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) / Math.max(paidOrders.length, 1);
    
    const completedOrders = Array.from(this.orders.values()).filter(order => order.status === 'delivered').length;
    const totalOrders = this.orders.size;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      completionRate: Math.round(completionRate),
      avgDeliveryTime: 28,
    };
  }
}

// MongoDB Storage Implementation
class MongoStorage implements IStorage {
  constructor() {
    // Initialize MongoDB connection
    connectDB().catch(console.error);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ id });
    return user ? this.mapUserFromMongo(user) : undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || crypto.randomUUID();
    const user = await UserModel.findOneAndUpdate(
      { id },
      { 
        id,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        role: userData.role || 'customer',
        phoneNumber: userData.phoneNumber || null,
        telegramUserId: userData.telegramUserId || null,
        telegramUsername: userData.telegramUsername || null,
        password: userData.password || null,
        isActive: userData.isActive ?? true,
        restaurantId: userData.restaurantId || null,
        createdBy: userData.createdBy || null,
      },
      { upsert: true, new: true }
    );
    return this.mapUserFromMongo(user);
  }

  async getUserByTelegramId(telegramUserId: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ telegramUserId });
    return user ? this.mapUserFromMongo(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      await connectDB();
      const user = await UserModel.findOne({ email });
      return user ? this.mapUserFromMongo(user) : undefined;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createAdminUser(userData: any): Promise<User> {
    try {
      await connectDB();
      const user = new UserModel({
        ...userData,
        id: userData.id || crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const savedUser = await user.save();
      return this.mapUserFromMongo(savedUser);
    } catch (error) {
      console.error("Error creating admin user:", error);
      throw error;
    }
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const user = await UserModel.findOneAndUpdate(
      { id: userId },
      { role },
      { new: true }
    );
    if (!user) throw new Error('User not found');
    return this.mapUserFromMongo(user);
  }

  // Helper method to map MongoDB user to our schema
  private mapUserFromMongo(mongoUser: any): User {
    return {
      id: mongoUser.id,
      email: mongoUser.email || null,
      firstName: mongoUser.firstName || null,
      lastName: mongoUser.lastName || null,
      profileImageUrl: mongoUser.profileImageUrl || null,
      role: mongoUser.role || null,
      phoneNumber: mongoUser.phoneNumber || null,
      telegramUserId: mongoUser.telegramUserId || null,
      telegramUsername: mongoUser.telegramUsername || null,
      password: mongoUser.password || null,
      isActive: mongoUser.isActive ?? true,
      restaurantId: mongoUser.restaurantId || null,
      createdBy: mongoUser.createdBy || null,
      createdAt: mongoUser.createdAt || null,
      updatedAt: mongoUser.updatedAt || null,
    };
  }

  // Restaurant operations
  async getRestaurants(): Promise<Restaurant[]> {
    const restaurants = await RestaurantModel.find().sort({ createdAt: -1 });
    return restaurants.map(r => this.mapRestaurantFromMongo(r));
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const restaurant = await RestaurantModel.findOne({ id });
    return restaurant ? this.mapRestaurantFromMongo(restaurant) : undefined;
  }

  async createRestaurant(restaurantData: InsertRestaurant): Promise<Restaurant> {
    const id = crypto.randomUUID();
    const restaurant = new RestaurantModel({
      id,
      ...restaurantData,
    });
    const savedRestaurant = await restaurant.save();
    return this.mapRestaurantFromMongo(savedRestaurant);
  }

  async updateRestaurant(id: string, restaurantData: Partial<InsertRestaurant>): Promise<Restaurant> {
    const restaurant = await RestaurantModel.findOneAndUpdate(
      { id },
      restaurantData,
      { new: true }
    );
    if (!restaurant) throw new Error('Restaurant not found');
    return this.mapRestaurantFromMongo(restaurant);
  }

  async deleteRestaurant(id: string): Promise<void> {
    await RestaurantModel.deleteOne({ id });
  }

  async approveRestaurant(id: string): Promise<Restaurant> {
    const restaurant = await RestaurantModel.findOneAndUpdate(
      { id },
      { isApproved: true, isActive: true },
      { new: true }
    );
    if (!restaurant) throw new Error('Restaurant not found');
    return this.mapRestaurantFromMongo(restaurant);
  }

  private mapRestaurantFromMongo(mongoRestaurant: any): Restaurant {
    return {
      id: mongoRestaurant.id,
      name: mongoRestaurant.name,
      description: mongoRestaurant.description || null,
      address: mongoRestaurant.address,
      phoneNumber: mongoRestaurant.phoneNumber,
      email: mongoRestaurant.email || null,
      location: mongoRestaurant.location || null,
      imageUrl: mongoRestaurant.imageUrl || null,
      isActive: mongoRestaurant.isActive ?? false,
      isApproved: mongoRestaurant.isApproved ?? false,
      rating: mongoRestaurant.rating?.toString() || "0.00",
      totalOrders: mongoRestaurant.totalOrders || 0,
      createdAt: mongoRestaurant.createdAt || null,
      updatedAt: mongoRestaurant.updatedAt || null,
    };
  }

  // Placeholder implementations for other methods (implement as needed)
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> { return []; }
  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> { throw new Error('Not implemented'); }
  async updateMenuCategory(id: string, category: Partial<InsertMenuCategory>): Promise<MenuCategory> { throw new Error('Not implemented'); }
  async deleteMenuCategory(id: string): Promise<void> { }
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> { return []; }
  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> { return []; }
  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> { throw new Error('Not implemented'); }
  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem> { throw new Error('Not implemented'); }
  async deleteMenuItem(id: string): Promise<void> { }
  async getOrders(): Promise<Order[]> { return []; }
  async getOrder(id: string): Promise<Order | undefined> { return undefined; }
  async getOrdersByStatus(status: string): Promise<Order[]> { return []; }
  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> { return []; }
  async getOrdersByCustomer(customerId: string): Promise<Order[]> { return []; }
  async createOrder(order: InsertOrder): Promise<Order> { throw new Error('Not implemented'); }
  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order> { throw new Error('Not implemented'); }
  async updateOrderStatus(id: string, status: string): Promise<Order> { throw new Error('Not implemented'); }
  async getDrivers(): Promise<Driver[]> { return []; }
  async getDriver(id: string): Promise<Driver | undefined> { return undefined; }
  async getDriverByUserId(userId: string): Promise<Driver | undefined> { return undefined; }
  async createDriver(driver: InsertDriver): Promise<Driver> { throw new Error('Not implemented'); }
  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver> { throw new Error('Not implemented'); }
  async approveDriver(id: string): Promise<Driver> { throw new Error('Not implemented'); }
  async getAvailableDrivers(): Promise<Driver[]> { return []; }
  async updateDriverLocation(id: string, location: any): Promise<Driver> { throw new Error('Not implemented'); }
  async updateDriverStatus(id: string, isOnline: boolean, isAvailable: boolean): Promise<Driver> { throw new Error('Not implemented'); }
  async getDeliveries(): Promise<Delivery[]> { return []; }
  async getDelivery(id: string): Promise<Delivery | undefined> { return undefined; }
  async getDeliveriesByDriver(driverId: string): Promise<Delivery[]> { return []; }
  async createDelivery(delivery: InsertDelivery): Promise<Delivery> { throw new Error('Not implemented'); }
  async updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery> { throw new Error('Not implemented'); }
  async getNotifications(userId: string): Promise<Notification[]> { return []; }
  async createNotification(notification: InsertNotification): Promise<Notification> { throw new Error('Not implemented'); }
  async markNotificationAsRead(id: string): Promise<Notification> { throw new Error('Not implemented'); }
  async getDashboardStats(): Promise<any> { 
    return {
      totalOrders: 0,
      totalRestaurants: 0,
      activeRestaurants: 0,
      totalDrivers: 0,
      activeDrivers: 0,
      pendingDrivers: 0,
      revenue: 0,
    };
  }
  async getOrderAnalytics(): Promise<any> { 
    return {
      avgOrderValue: 0,
      completionRate: 0,
      avgDeliveryTime: 28,
    };
  }
}

// Use MongoDB storage
export const storage = new MongoStorage();
