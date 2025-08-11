import { PostgresStorage } from "./postgresStorage";
import { MongoStorage } from "./mongoStorage";
import { isMongoConnected } from "./db";
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

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByTelegramId(telegramUserId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserRole(userId: string, role: string): Promise<User>;
  createAdminUser(userData: any): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  // Restaurant operations
  getRestaurants(): Promise<Restaurant[]>;
  getAllRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant>;
  deleteRestaurant(id: string): Promise<void>;
  approveRestaurant(id: string): Promise<Restaurant>;

  // Admin user operations
  getAllAdminUsers(): Promise<User[]>;
  deleteAdminUser(id: string): Promise<void>;

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
  getOrdersByDriver(driverId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;

  // Driver operations
  getDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverById(id: string): Promise<Driver | undefined>;
  getDriverByUserId(userId: string): Promise<Driver | undefined>;
  getDriverByTelegramId(telegramId: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver>;
  updateDriverStatus(id: string, isOnline: boolean, isAvailable: boolean): Promise<Driver>;
  updateDriverLocation(id: string, location: { lat: number; lng: number }): Promise<Driver>;
  updateDriverEarnings(id: string, earnings: number): Promise<Driver>;
  approveDriver(id: string): Promise<Driver>;
  rejectDriver(id: string, reason?: string): Promise<void>;
  getAvailableDrivers(): Promise<Driver[]>;
  getPendingDrivers(): Promise<Driver[]>;
  getAvailableOrdersForDriver(driverId: string): Promise<Order[]>;
  assignOrderToDriver(orderId: string, driverId: string): Promise<Order>;
  getDriverDeliveryHistory(driverId: string): Promise<any[]>;

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
  
  // System settings methods
  getSystemSettings(): Promise<any>;
  updateSystemSettings(settings: any): Promise<any>;
  updateCompanyLogo(logoUrl: string): Promise<void>;
  
  // Password management methods
  verifyAdminPassword(adminId: string, password: string): Promise<boolean>;
  updateAdminPassword(adminId: string, newPassword: string): Promise<void>;
  updateAdminProfile(adminId: string, profileData: { email: string; firstName: string; lastName: string }): Promise<User>;
  updateAdminUser(id: string, data: Partial<User>): Promise<User>;
  
  // Driver management methods
  getAllDrivers(): Promise<Driver[]>;
  approveDriver(driverId: string): Promise<Driver>;
  rejectDriver(driverId: string): Promise<Driver | void>;
  blockDriver(driverId: string): Promise<Driver>;
  unblockDriver(driverId: string): Promise<Driver>;
  deleteDriver(driverId: string): Promise<void>;
  saveLiveLocation(driverId: string, location: any): Promise<void>;

  // Analytics operations
  getDashboardStats(): Promise<any>;
  getOrderAnalytics(): Promise<any>;

  // Kitchen operations (missing functions)
  getMenuItemsByStatus(restaurantId: string, status: string): Promise<MenuItem[]>;
  getMenuCategoriesByStatus(restaurantId: string, status: string): Promise<MenuCategory[]>;
  getRestaurantMenu(restaurantId: string): Promise<{ categories: MenuCategory[], items: MenuItem[] }>;
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

  constructor() {
    this.initializeSampleDrivers();
  }
  
  // Add sample drivers for demo
  private initializeSampleDrivers() {
    // Sample pending driver
    const pendingDriverId = crypto.randomUUID();
    const pendingUserId = crypto.randomUUID();
    
    this.users.set(pendingUserId, {
      id: pendingUserId,
      email: 'john.driver@example.com',
      firstName: 'John',
      lastName: 'Driver',
      profileImageUrl: null,
      role: 'driver',
      phoneNumber: '+251-911-123456',
      telegramUserId: '123456789',
      telegramUsername: null,
      password: null,
      isActive: true,
      restaurantId: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.drivers.set(pendingDriverId, {
      id: pendingDriverId,
      userId: pendingUserId,
      licenseNumber: 'DL-123456789',
      vehicleType: 'motorcycle',
      vehiclePlate: 'AA-12345',
      currentLocation: null,
      isOnline: false,
      isAvailable: false,
      isApproved: false,
      rating: '0.00',
      totalDeliveries: 0,
      totalEarnings: '0.00',
      zone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      licenseImageUrl: null,
      vehicleImageUrl: null,
      idCardImageUrl: null
    });

    // Sample approved online driver  
    const onlineDriverId = crypto.randomUUID();
    const onlineUserId = crypto.randomUUID();
    
    this.users.set(onlineUserId, {
      id: onlineUserId,
      email: 'mary.online@example.com',
      firstName: 'Mary',
      lastName: 'Online',
      profileImageUrl: null,
      role: 'driver',
      phoneNumber: '+251-911-654321',
      telegramUserId: '987654321',
      telegramUsername: null,
      password: null,
      isActive: true,
      restaurantId: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.drivers.set(onlineDriverId, {
      id: onlineDriverId,
      userId: onlineUserId,
      licenseNumber: 'DL-987654321',
      vehicleType: 'bicycle',
      vehiclePlate: 'BB-54321',
      currentLocation: [9.0155, 38.7635], // Addis Ababa center
      isOnline: true,
      isAvailable: true,
      isApproved: true,
      rating: '4.50',
      totalDeliveries: 125,
      totalEarnings: '12500.00',
      zone: 'Downtown',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updatedAt: new Date(),
      licenseImageUrl: null,
      vehicleImageUrl: null,
      idCardImageUrl: null
    });
  }

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

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === role)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getAllAdminUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role && ['superadmin', 'restaurant_admin', 'kitchen_staff'].includes(user.role))
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async deleteAdminUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  // Restaurant operations
  async getRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
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
    const updatedRestaurant = { ...existing, ...restaurantData, updatedAt: new Date() };
    this.restaurants.set(id, updatedRestaurant);
    return updatedRestaurant;
  }

  async deleteRestaurant(id: string): Promise<void> {
    this.restaurants.delete(id);
  }

  async approveRestaurant(id: string): Promise<Restaurant> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) throw new Error('Restaurant not found');
    const approved = { ...restaurant, isApproved: true, isActive: true, updatedAt: new Date() };
    this.restaurants.set(id, approved);
    return approved;
  }

  // Menu operations
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    return Array.from(this.menuCategories.values())
      .filter(category => category.restaurantId === restaurantId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async createMenuCategory(categoryData: InsertMenuCategory): Promise<MenuCategory> {
    const id = crypto.randomUUID();
    const category: MenuCategory = {
      id,
      restaurantId: categoryData.restaurantId,
      name: categoryData.name,
      description: categoryData.description || null,
      isActive: categoryData.isActive ?? true,
      status: 'active',
      lastModifiedBy: null,
      sortOrder: categoryData.sortOrder || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.menuCategories.set(id, category);
    return category;
  }

  async updateMenuCategory(id: string, categoryData: Partial<InsertMenuCategory>): Promise<MenuCategory> {
    const existing = this.menuCategories.get(id);
    if (!existing) throw new Error('Menu category not found');
    const updated = { ...existing, ...categoryData };
    this.menuCategories.set(id, updated);
    return updated;
  }

  async deleteMenuCategory(id: string): Promise<void> {
    this.menuCategories.delete(id);
  }

  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values())
      .filter(item => item.restaurantId === restaurantId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values())
      .filter(item => item.categoryId === categoryId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createMenuItem(itemData: InsertMenuItem): Promise<MenuItem> {
    const id = crypto.randomUUID();
    const item: MenuItem = {
      id,
      restaurantId: itemData.restaurantId,
      categoryId: itemData.categoryId,
      name: itemData.name,
      description: itemData.description || null,
      price: itemData.price,
      imageUrl: itemData.imageUrl || null,
      isAvailable: itemData.isAvailable ?? true,
      status: 'active',
      lastModifiedBy: null,
      preparationTime: itemData.preparationTime || null,
      ingredients: itemData.ingredients || null,
      isVegetarian: itemData.isVegetarian ?? false,
      isVegan: itemData.isVegan ?? false,
      spicyLevel: itemData.spicyLevel || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.menuItems.set(id, item);
    return item;
  }

  async updateMenuItem(id: string, itemData: Partial<InsertMenuItem>): Promise<MenuItem> {
    const existing = this.menuItems.get(id);
    if (!existing) throw new Error('Menu item not found');
    const updated = { ...existing, ...itemData, updatedAt: new Date() };
    this.menuItems.set(id, updated);
    return updated;
  }

  async deleteMenuItem(id: string): Promise<void> {
    this.menuItems.delete(id);
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
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

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = crypto.randomUUID();
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const order: Order = {
      id,
      orderNumber,
      customerId: orderData.customerId,
      restaurantId: orderData.restaurantId,
      driverId: orderData.driverId || null,
      status: orderData.status || 'pending',
      unavailableItems: orderData.unavailableItems || null,
      items: orderData.items,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee || "0.00",
      tax: orderData.tax || "0.00",
      total: orderData.total,
      paymentStatus: orderData.paymentStatus || 'pending',
      paymentMethod: orderData.paymentMethod || null,
      deliveryAddress: orderData.deliveryAddress,
      deliveryLocation: orderData.deliveryLocation || null,
      customerNotes: orderData.customerNotes || null,
      estimatedDeliveryTime: orderData.estimatedDeliveryTime || null,
      actualDeliveryTime: orderData.actualDeliveryTime || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order> {
    const existing = this.orders.get(id);
    if (!existing) throw new Error('Order not found');
    const updated = { ...existing, ...orderData, updatedAt: new Date() };
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
    return Array.from(this.drivers.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    for (const driver of Array.from(this.drivers.values())) {
      if (driver.userId === userId) {
        return driver;
      }
    }
    return undefined;
  }

  async createDriver(driverData: InsertDriver): Promise<Driver> {
    const id = crypto.randomUUID();
    const driver: Driver = {
      id,
      userId: driverData.userId,
      licenseNumber: driverData.licenseNumber,
      vehicleType: driverData.vehicleType,
      vehiclePlate: driverData.vehiclePlate,
      licenseImageUrl: driverData.licenseImageUrl || null,
      vehicleImageUrl: driverData.vehicleImageUrl || null,
      idCardImageUrl: driverData.idCardImageUrl || null,
      currentLocation: driverData.currentLocation || null,
      isOnline: driverData.isOnline ?? false,
      isAvailable: driverData.isAvailable ?? false,
      isApproved: driverData.isApproved ?? false,
      rating: driverData.rating || "0.00",
      totalDeliveries: driverData.totalDeliveries || 0,
      totalEarnings: driverData.totalEarnings || "0.00",
      zone: driverData.zone || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(id: string, driverData: Partial<InsertDriver>): Promise<Driver> {
    const existing = this.drivers.get(id);
    if (!existing) throw new Error('Driver not found');
    const updated = { ...existing, ...driverData, updatedAt: new Date() };
    this.drivers.set(id, updated);
    return updated;
  }

  async approveDriver(id: string): Promise<Driver> {
    const driver = this.drivers.get(id);
    if (!driver) throw new Error('Driver not found');
    const approved = { ...driver, isApproved: true, updatedAt: new Date() };
    this.drivers.set(id, approved);
    return approved;
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values())
      .filter(driver => driver.isApproved && driver.isOnline && driver.isAvailable);
  }

  async updateDriverLocation(id: string, location: any): Promise<Driver> {
    const existing = this.drivers.get(id);
    if (!existing) throw new Error('Driver not found');
    const updated = { ...existing, currentLocation: location, updatedAt: new Date() };
    this.drivers.set(id, updated);
    return updated;
  }

  async updateDriverStatus(id: string, isOnline: boolean, isAvailable: boolean): Promise<Driver> {
    const existing = this.drivers.get(id);
    if (!existing) throw new Error('Driver not found');
    const updated = { ...existing, isOnline, isAvailable, updatedAt: new Date() };
    this.drivers.set(id, updated);
    return updated;
  }

  async rejectDriver(id: string): Promise<Driver> {
    const driver = this.drivers.get(id);
    if (!driver) throw new Error('Driver not found');
    const rejected = { ...driver, isApproved: false, updatedAt: new Date() };
    this.drivers.set(id, rejected);
    return rejected;
  }

  async blockDriver(id: string): Promise<Driver> {
    const driver = this.drivers.get(id);
    if (!driver) throw new Error('Driver not found');
    const blocked = { ...driver, isBlocked: true, updatedAt: new Date() };
    this.drivers.set(id, blocked);
    return blocked;
  }

  async unblockDriver(id: string): Promise<Driver> {
    const driver = this.drivers.get(id);
    if (!driver) throw new Error('Driver not found');
    const unblocked = { ...driver, isBlocked: false, updatedAt: new Date() };
    this.drivers.set(id, unblocked);
    return unblocked;
  }

  async deleteDriver(id: string): Promise<void> {
    if (!this.drivers.has(id)) throw new Error('Driver not found');
    this.drivers.delete(id);
  }

  async saveLiveLocation(driverId: string, location: any): Promise<void> {
    await this.updateDriverLocation(driverId, location);
  }

  // Delivery operations
  async getDeliveries(): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    return this.deliveries.get(id);
  }

  async getDeliveriesByDriver(driverId: string): Promise<Delivery[]> {
    return Array.from(this.deliveries.values())
      .filter(delivery => delivery.driverId === driverId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createDelivery(deliveryData: InsertDelivery): Promise<Delivery> {
    const id = crypto.randomUUID();
    const delivery: Delivery = {
      id,
      orderId: deliveryData.orderId,
      driverId: deliveryData.driverId,
      status: deliveryData.status || 'assigned',
      pickupTime: deliveryData.pickupTime || null,
      deliveryTime: deliveryData.deliveryTime || null,
      distance: deliveryData.distance || null,
      earnings: deliveryData.earnings || null,
      tips: deliveryData.tips || "0.00",
      notes: deliveryData.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.deliveries.set(id, delivery);
    return delivery;
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
      id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || null,
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

  // System settings methods
  private systemSettings: any = {
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

  async getSystemSettings(): Promise<any> {
    return { ...this.systemSettings };
  }

  async updateSystemSettings(settings: any): Promise<any> {
    // Update the stored system settings
    this.systemSettings = { ...this.systemSettings, ...settings };
    return { ...this.systemSettings };
  }

  async updateCompanyLogo(logoUrl: string): Promise<void> {
    // In a real implementation, this would update the database
    // For now, just log the action
    console.log('Company logo updated to:', logoUrl);
  }

  // Password management methods
  async verifyAdminPassword(adminId: string, password: string): Promise<boolean> {
    const admin = this.users.get(adminId);
    if (!admin) {
      return false;
    }
    
    // In a real implementation, this would compare hashed passwords
    // For now, just simulate verification (always return true for demo)
    return true;
  }

  async updateAdminPassword(adminId: string, newHashedPassword: string): Promise<void> {
    const admin = this.users.get(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }
    
    // Update the password in memory
    const updatedAdmin = { ...admin, password: newHashedPassword, updatedAt: new Date() };
    this.users.set(adminId, updatedAdmin);
  }

  async updateAdminProfile(adminId: string, profileData: { email: string; firstName: string; lastName: string }): Promise<User> {
    const admin = this.users.get(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }
    
    // Update the profile in memory
    const updatedAdmin = { 
      ...admin, 
      email: profileData.email,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      updatedAt: new Date() 
    };
    this.users.set(adminId, updatedAdmin);
    return updatedAdmin;
  }

  // Driver management methods
  async getAllDrivers(): Promise<any[]> {
    return Array.from(this.drivers.values()).map(driver => {
      const user = this.users.get(driver.userId);
      return {
        id: driver.id || driver._id,
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
        currentLocation: driver.currentLocation,
        status: driver.status,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable,
        isApproved: driver.isApproved,
        isBlocked: driver.isBlocked,
        rating: driver.rating,
        totalDeliveries: driver.totalDeliveries,
        totalEarnings: driver.totalEarnings,
        todayEarnings: driver.todayEarnings,
        weeklyEarnings: driver.weeklyEarnings,
        zone: driver.zone,
        lastOnline: driver.lastOnline,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
        user: user
      };
    });
  }



  async rejectDriver(driverId: string): Promise<void> {
    const driver = this.drivers.get(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }
    
    // In a real implementation, you might want to soft delete or mark as rejected
    // For now, we'll remove the driver completely
    this.drivers.delete(driverId);
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

  // Kitchen operations (missing functions)
  async getMenuItemsByStatus(restaurantId: string, status: string): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values())
      .filter(item => item.restaurantId === restaurantId && item.status === status)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async getMenuCategoriesByStatus(restaurantId: string, status: string): Promise<MenuCategory[]> {
    return Array.from(this.menuCategories.values())
      .filter(category => category.restaurantId === restaurantId && category.status === status)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async getRestaurantMenu(restaurantId: string): Promise<{ categories: MenuCategory[], items: MenuItem[] }> {
    const categories = await this.getMenuCategories(restaurantId);
    const items = await this.getMenuItems(restaurantId);
    return { categories, items };
  }

  async updateAdminUser(id: string, data: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
}

// Initialize storage - Use in-memory storage for development
class StorageFactory {
  private _storage: IStorage | null = null;
  
  get storage(): IStorage {
    if (!this._storage) {
      // Always use in-memory storage for development
      this._storage = new MemoryStorage();
      console.log('✅ Initialized in-memory storage for development');
    }
    return this._storage!;
  }
}

const storageFactory = new StorageFactory();
export const storage = new Proxy({} as IStorage, {
  get(target, prop) {
    return storageFactory.storage[prop as keyof IStorage];
  }
});