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
  updateUserRole(userId: string, role: string): Promise<User>;

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
      isActive: userData.isActive ?? true,
      restaurantId: userData.restaurantId || null,
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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByTelegramId(telegramUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramUserId, telegramUserId));
    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Restaurant operations  
  async createRestaurant(restaurantData: any): Promise<Restaurant> {
    const [restaurant] = await db
      .insert(restaurants)
      .values(restaurantData)
      .returning();
    return restaurant;
  }

  async getRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants).orderBy(desc(restaurants.createdAt));
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }



  async updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant> {
    const [updatedRestaurant] = await db
      .update(restaurants)
      .set({ ...restaurant, updatedAt: new Date() })
      .where(eq(restaurants.id, id))
      .returning();
    return updatedRestaurant;
  }

  async deleteRestaurant(id: string): Promise<void> {
    await db.delete(restaurants).where(eq(restaurants.id, id));
  }

  async approveRestaurant(id: string): Promise<Restaurant> {
    const [restaurant] = await db
      .update(restaurants)
      .set({ isApproved: true, isActive: true, updatedAt: new Date() })
      .where(eq(restaurants.id, id))
      .returning();
    return restaurant;
  }

  // Menu operations
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    return await db.select().from(menuCategories)
      .where(eq(menuCategories.restaurantId, restaurantId))
      .orderBy(menuCategories.sortOrder);
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const [newCategory] = await db.insert(menuCategories).values(category).returning();
    return newCategory;
  }

  async updateMenuCategory(id: string, category: Partial<InsertMenuCategory>): Promise<MenuCategory> {
    const [updatedCategory] = await db
      .update(menuCategories)
      .set(category)
      .where(eq(menuCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteMenuCategory(id: string): Promise<void> {
    await db.delete(menuCategories).where(eq(menuCategories.id, id));
  }

  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    return await db.select().from(menuItems)
      .where(eq(menuItems.restaurantId, restaurantId))
      .orderBy(desc(menuItems.createdAt));
  }

  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    return await db.select().from(menuItems)
      .where(eq(menuItems.categoryId, categoryId))
      .orderBy(desc(menuItems.createdAt));
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [newItem] = await db.insert(menuItems).values(item).returning();
    return newItem;
  }

  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem> {
    const [updatedItem] = await db
      .update(menuItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteMenuItem(id: string): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.status, status as any))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.restaurantId, restaurantId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderNumber = `ORD-${Date.now()}`;
    const [newOrder] = await db.insert(orders).values({
      ...order,
      orderNumber,
    }).returning();
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Driver operations
  async getDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers).orderBy(desc(drivers.createdAt));
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return driver;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [newDriver] = await db.insert(drivers).values(driver).returning();
    return newDriver;
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver> {
    const [updatedDriver] = await db
      .update(drivers)
      .set({ ...driver, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return updatedDriver;
  }

  async approveDriver(id: string): Promise<Driver> {
    const [driver] = await db
      .update(drivers)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers)
      .where(
        and(
          eq(drivers.isApproved, true),
          eq(drivers.isOnline, true),
          eq(drivers.isAvailable, true)
        )
      );
  }

  async updateDriverLocation(id: string, location: any): Promise<Driver> {
    const [driver] = await db
      .update(drivers)
      .set({ currentLocation: location, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  async updateDriverStatus(id: string, isOnline: boolean, isAvailable: boolean): Promise<Driver> {
    const [driver] = await db
      .update(drivers)
      .set({ isOnline, isAvailable, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  // Delivery operations
  async getDeliveries(): Promise<Delivery[]> {
    return await db.select().from(deliveries).orderBy(desc(deliveries.createdAt));
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
    return delivery;
  }

  async getDeliveriesByDriver(driverId: string): Promise<Delivery[]> {
    return await db.select().from(deliveries)
      .where(eq(deliveries.driverId, driverId))
      .orderBy(desc(deliveries.createdAt));
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const [newDelivery] = await db.insert(deliveries).values(delivery).returning();
    return newDelivery;
  }

  async updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery> {
    const [updatedDelivery] = await db
      .update(deliveries)
      .set({ ...delivery, updatedAt: new Date() })
      .where(eq(deliveries.id, id))
      .returning();
    return updatedDelivery;
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  // Analytics operations
  async getDashboardStats(): Promise<any> {
    const [totalOrdersResult] = await db.select({ count: count() }).from(orders);
    const [totalRestaurantsResult] = await db.select({ count: count() }).from(restaurants);
    const [activeRestaurantsResult] = await db.select({ count: count() }).from(restaurants)
      .where(eq(restaurants.isActive, true));
    const [totalDriversResult] = await db.select({ count: count() }).from(drivers);
    const [activeDriversResult] = await db.select({ count: count() }).from(drivers)
      .where(and(eq(drivers.isApproved, true), eq(drivers.isOnline, true)));
    const [pendingDriversResult] = await db.select({ count: count() }).from(drivers)
      .where(eq(drivers.isApproved, false));

    const [revenueResult] = await db.select({
      total: sql<string>`COALESCE(SUM(${orders.total}), 0)`
    }).from(orders).where(eq(orders.paymentStatus, 'paid'));

    return {
      totalOrders: totalOrdersResult.count,
      totalRestaurants: totalRestaurantsResult.count,
      activeRestaurants: activeRestaurantsResult.count,
      totalDrivers: totalDriversResult.count,
      activeDrivers: activeDriversResult.count,
      pendingDrivers: pendingDriversResult.count,
      revenue: parseFloat(revenueResult.total || '0'),
    };
  }

  async getOrderAnalytics(): Promise<any> {
    const [avgOrderValueResult] = await db.select({
      avg: sql<string>`COALESCE(AVG(${orders.total}), 0)`
    }).from(orders).where(eq(orders.paymentStatus, 'paid'));

    const [completedOrdersResult] = await db.select({ count: count() }).from(orders)
      .where(eq(orders.status, 'delivered'));

    const [totalOrdersResult] = await db.select({ count: count() }).from(orders);

    const completionRate = totalOrdersResult.count > 0 
      ? (completedOrdersResult.count / totalOrdersResult.count) * 100 
      : 0;

    return {
      avgOrderValue: parseFloat(avgOrderValueResult.avg || '0'),
      completionRate: Math.round(completionRate),
      avgDeliveryTime: 28, // This would need more complex calculation
    };
  }
}

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
        isActive: userData.isActive ?? true,
        restaurantId: userData.restaurantId || null,
      },
      { upsert: true, new: true }
    );
    return this.mapUserFromMongo(user);
  }

  async getUserByTelegramId(telegramUserId: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ telegramUserId });
    return user ? this.mapUserFromMongo(user) : undefined;
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
      name: restaurantData.name,
      description: restaurantData.description || null,
      address: restaurantData.address,
      phoneNumber: restaurantData.phoneNumber,
      email: restaurantData.email || null,
      location: restaurantData.location || null,
      imageUrl: restaurantData.imageUrl || null,
      isActive: false,
      isApproved: false,
      rating: 0,
      totalOrders: 0,
    });
    await restaurant.save();
    return this.mapRestaurantFromMongo(restaurant);
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

  // Menu operations
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    const categories = await MenuCategoryModel.find({ restaurantId }).sort({ sortOrder: 1 });
    return categories.map(c => this.mapMenuCategoryFromMongo(c));
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const id = crypto.randomUUID();
    const newCategory = new MenuCategoryModel({
      id,
      restaurantId: category.restaurantId,
      name: category.name,
      description: category.description || null,
      isActive: true,
      sortOrder: 0,
    });
    await newCategory.save();
    return this.mapMenuCategoryFromMongo(newCategory);
  }

  async updateMenuCategory(id: string, category: Partial<InsertMenuCategory>): Promise<MenuCategory> {
    const updated = await MenuCategoryModel.findOneAndUpdate(
      { id },
      category,
      { new: true }
    );
    if (!updated) throw new Error('Category not found');
    return this.mapMenuCategoryFromMongo(updated);
  }

  async deleteMenuCategory(id: string): Promise<void> {
    await MenuCategoryModel.deleteOne({ id });
  }

  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    const items = await MenuItemModel.find({ restaurantId }).sort({ createdAt: -1 });
    return items.map(i => this.mapMenuItemFromMongo(i));
  }

  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    const items = await MenuItemModel.find({ categoryId }).sort({ createdAt: -1 });
    return items.map(i => this.mapMenuItemFromMongo(i));
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const id = crypto.randomUUID();
    const newItem = new MenuItemModel({
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
    });
    await newItem.save();
    return this.mapMenuItemFromMongo(newItem);
  }

  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem> {
    const updated = await MenuItemModel.findOneAndUpdate(
      { id },
      item,
      { new: true }
    );
    if (!updated) throw new Error('Menu item not found');
    return this.mapMenuItemFromMongo(updated);
  }

  async deleteMenuItem(id: string): Promise<void> {
    await MenuItemModel.deleteOne({ id });
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    const orders = await OrderModel.find().sort({ createdAt: -1 });
    return orders.map(o => this.mapOrderFromMongo(o));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const order = await OrderModel.findOne({ id });
    return order ? this.mapOrderFromMongo(order) : undefined;
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    const orders = await OrderModel.find({ status }).sort({ createdAt: -1 });
    return orders.map(o => this.mapOrderFromMongo(o));
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    const orders = await OrderModel.find({ restaurantId }).sort({ createdAt: -1 });
    return orders.map(o => this.mapOrderFromMongo(o));
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    const orders = await OrderModel.find({ customerId }).sort({ createdAt: -1 });
    return orders.map(o => this.mapOrderFromMongo(o));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = crypto.randomUUID();
    const orderNumber = `ORD-${Date.now()}`;
    const newOrder = new OrderModel({
      id,
      orderNumber,
      customerId: order.customerId,
      restaurantId: order.restaurantId,
      driverId: order.driverId || null,
      status: 'pending',
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee || 0,
      tax: order.tax || 0,
      total: order.total,
      paymentStatus: 'pending',
      paymentMethod: order.paymentMethod || null,
      deliveryAddress: order.deliveryAddress,
      deliveryLocation: order.deliveryLocation || null,
      customerNotes: order.customerNotes || null,
      estimatedDeliveryTime: order.estimatedDeliveryTime || null,
      actualDeliveryTime: order.actualDeliveryTime || null,
    });
    await newOrder.save();
    return this.mapOrderFromMongo(newOrder);
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order> {
    const updated = await OrderModel.findOneAndUpdate(
      { id },
      order,
      { new: true }
    );
    if (!updated) throw new Error('Order not found');
    return this.mapOrderFromMongo(updated);
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const updated = await OrderModel.findOneAndUpdate(
      { id },
      { status },
      { new: true }
    );
    if (!updated) throw new Error('Order not found');
    return this.mapOrderFromMongo(updated);
  }

  // Driver operations
  async getDrivers(): Promise<Driver[]> {
    const drivers = await DriverModel.find().sort({ createdAt: -1 });
    return drivers.map(d => this.mapDriverFromMongo(d));
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const driver = await DriverModel.findOne({ id });
    return driver ? this.mapDriverFromMongo(driver) : undefined;
  }

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    const driver = await DriverModel.findOne({ userId });
    return driver ? this.mapDriverFromMongo(driver) : undefined;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const id = crypto.randomUUID();
    const newDriver = new DriverModel({
      id,
      userId: driver.userId,
      licenseNumber: driver.licenseNumber,
      vehicleType: driver.vehicleType,
      vehiclePlate: driver.vehiclePlate,
      licenseImageUrl: driver.licenseImageUrl || null,
      vehicleImageUrl: driver.vehicleImageUrl || null,
      idCardImageUrl: driver.idCardImageUrl || null,
      currentLocation: driver.currentLocation || null,
      isOnline: false,
      isAvailable: false,
      isApproved: false,
      rating: 0,
      totalDeliveries: 0,
      totalEarnings: 0,
      zone: driver.zone || null,
    });
    await newDriver.save();
    return this.mapDriverFromMongo(newDriver);
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver> {
    const updated = await DriverModel.findOneAndUpdate(
      { id },
      driver,
      { new: true }
    );
    if (!updated) throw new Error('Driver not found');
    return this.mapDriverFromMongo(updated);
  }

  async approveDriver(id: string): Promise<Driver> {
    const driver = await DriverModel.findOneAndUpdate(
      { id },
      { isApproved: true },
      { new: true }
    );
    if (!driver) throw new Error('Driver not found');
    return this.mapDriverFromMongo(driver);
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    const drivers = await DriverModel.find({
      isApproved: true,
      isOnline: true,
      isAvailable: true
    });
    return drivers.map(d => this.mapDriverFromMongo(d));
  }

  async updateDriverLocation(id: string, location: any): Promise<Driver> {
    const driver = await DriverModel.findOneAndUpdate(
      { id },
      { currentLocation: location },
      { new: true }
    );
    if (!driver) throw new Error('Driver not found');
    return this.mapDriverFromMongo(driver);
  }

  async updateDriverStatus(id: string, isOnline: boolean, isAvailable: boolean): Promise<Driver> {
    const driver = await DriverModel.findOneAndUpdate(
      { id },
      { isOnline, isAvailable },
      { new: true }
    );
    if (!driver) throw new Error('Driver not found');
    return this.mapDriverFromMongo(driver);
  }

  // Delivery operations
  async getDeliveries(): Promise<Delivery[]> {
    const deliveries = await DeliveryModel.find().sort({ createdAt: -1 });
    return deliveries.map(d => this.mapDeliveryFromMongo(d));
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    const delivery = await DeliveryModel.findOne({ id });
    return delivery ? this.mapDeliveryFromMongo(delivery) : undefined;
  }

  async getDeliveriesByDriver(driverId: string): Promise<Delivery[]> {
    const deliveries = await DeliveryModel.find({ driverId }).sort({ createdAt: -1 });
    return deliveries.map(d => this.mapDeliveryFromMongo(d));
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const id = crypto.randomUUID();
    const newDelivery = new DeliveryModel({
      id,
      orderId: delivery.orderId,
      driverId: delivery.driverId,
      status: 'assigned',
      pickupTime: delivery.pickupTime || null,
      deliveryTime: delivery.deliveryTime || null,
      distance: delivery.distance || null,
      earnings: delivery.earnings || null,
      tips: 0,
      notes: delivery.notes || null,
    });
    await newDelivery.save();
    return this.mapDeliveryFromMongo(newDelivery);
  }

  async updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery> {
    const updated = await DeliveryModel.findOneAndUpdate(
      { id },
      delivery,
      { new: true }
    );
    if (!updated) throw new Error('Delivery not found');
    return this.mapDeliveryFromMongo(updated);
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 });
    return notifications.map(n => this.mapNotificationFromMongo(n));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = crypto.randomUUID();
    const newNotification = new NotificationModel({
      id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || null,
      isRead: false,
    });
    await newNotification.save();
    return this.mapNotificationFromMongo(newNotification);
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const notification = await NotificationModel.findOneAndUpdate(
      { id },
      { isRead: true },
      { new: true }
    );
    if (!notification) throw new Error('Notification not found');
    return this.mapNotificationFromMongo(notification);
  }

  // Analytics operations
  async getDashboardStats(): Promise<any> {
    const [totalOrders, totalRestaurants, activeRestaurants, totalDrivers, activeDrivers, pendingDrivers] = await Promise.all([
      OrderModel.countDocuments(),
      RestaurantModel.countDocuments(),
      RestaurantModel.countDocuments({ isActive: true }),
      DriverModel.countDocuments(),
      DriverModel.countDocuments({ isApproved: true, isOnline: true }),
      DriverModel.countDocuments({ isApproved: false }),
    ]);

    const revenueResult = await OrderModel.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    return {
      totalOrders,
      totalRestaurants,
      activeRestaurants,
      totalDrivers,
      activeDrivers,
      pendingDrivers,
      revenue: revenueResult[0]?.total || 0,
    };
  }

  async getOrderAnalytics(): Promise<any> {
    const [avgResult, completedOrders, totalOrders] = await Promise.all([
      OrderModel.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, avg: { $avg: '$total' } } }
      ]),
      OrderModel.countDocuments({ status: 'delivered' }),
      OrderModel.countDocuments(),
    ]);

    const avgOrderValue = avgResult[0]?.avg || 0;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      completionRate: Math.round(completionRate),
      avgDeliveryTime: 28,
    };
  }

  // Helper methods to map MongoDB documents to schema types
  private mapUserFromMongo(user: IUser): User {
    return {
      id: user.id,
      email: user.email || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      role: user.role || null,
      phoneNumber: user.phoneNumber || null,
      telegramUserId: user.telegramUserId || null,
      telegramUsername: user.telegramUsername || null,
      isActive: user.isActive,
      restaurantId: user.restaurantId || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private mapRestaurantFromMongo(restaurant: IRestaurant): Restaurant {
    return {
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description || null,
      address: restaurant.address,
      phoneNumber: restaurant.phoneNumber,
      email: restaurant.email || null,
      location: restaurant.location || null,
      imageUrl: restaurant.imageUrl || null,
      isActive: restaurant.isActive,
      isApproved: restaurant.isApproved,
      rating: restaurant.rating.toString(),
      totalOrders: restaurant.totalOrders,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    };
  }

  private mapMenuCategoryFromMongo(category: IMenuCategory): MenuCategory {
    return {
      id: category.id,
      restaurantId: category.restaurantId,
      name: category.name,
      description: category.description || null,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
    };
  }

  private mapMenuItemFromMongo(item: IMenuItem): MenuItem {
    return {
      id: item.id,
      restaurantId: item.restaurantId,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || null,
      price: item.price.toString(),
      imageUrl: item.imageUrl || null,
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime || null,
      ingredients: item.ingredients || null,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      spicyLevel: item.spicyLevel,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapOrderFromMongo(order: IOrder): Order {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      restaurantId: order.restaurantId,
      driverId: order.driverId || null,
      status: order.status as any,
      items: order.items,
      subtotal: order.subtotal.toString(),
      deliveryFee: order.deliveryFee.toString(),
      tax: order.tax.toString(),
      total: order.total.toString(),
      paymentStatus: order.paymentStatus as any,
      paymentMethod: order.paymentMethod || null,
      deliveryAddress: order.deliveryAddress,
      deliveryLocation: order.deliveryLocation || null,
      customerNotes: order.customerNotes || null,
      estimatedDeliveryTime: order.estimatedDeliveryTime || null,
      actualDeliveryTime: order.actualDeliveryTime || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private mapDriverFromMongo(driver: IDriver): Driver {
    return {
      id: driver.id,
      userId: driver.userId,
      licenseNumber: driver.licenseNumber,
      vehicleType: driver.vehicleType,
      vehiclePlate: driver.vehiclePlate,
      licenseImageUrl: driver.licenseImageUrl || null,
      vehicleImageUrl: driver.vehicleImageUrl || null,
      idCardImageUrl: driver.idCardImageUrl || null,
      currentLocation: driver.currentLocation || null,
      isOnline: driver.isOnline,
      isAvailable: driver.isAvailable,
      isApproved: driver.isApproved,
      rating: driver.rating.toString(),
      totalDeliveries: driver.totalDeliveries,
      totalEarnings: driver.totalEarnings.toString(),
      zone: driver.zone || null,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    };
  }

  private mapDeliveryFromMongo(delivery: IDelivery): Delivery {
    return {
      id: delivery.id,
      orderId: delivery.orderId,
      driverId: delivery.driverId,
      status: delivery.status as any,
      pickupTime: delivery.pickupTime || null,
      deliveryTime: delivery.deliveryTime || null,
      distance: delivery.distance?.toString() || null,
      earnings: delivery.earnings?.toString() || null,
      tips: delivery.tips.toString(),
      notes: delivery.notes || null,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    };
  }

  private mapNotificationFromMongo(notification: INotification): Notification {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }
}

// Use MongoDB storage
export const storage = new MongoStorage();
