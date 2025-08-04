import { db } from "./db";
import { IStorage } from './storage';
import { eq, and, sql } from 'drizzle-orm';
import {
  users,
  restaurants,
  menuCategories,
  menuItems,
  orders,
  drivers,
  deliveries,
  notifications,
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

export class PostgresStorage implements IStorage {
  
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const result = await db.insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.email,
          set: userData,
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async getUserByTelegramId(telegramUserId: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users)
        .where(eq(users.telegramUserId, telegramUserId))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user by telegram ID:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users)
        .where(eq(users.email, email))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    try {
      const result = await db.update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async createAdminUser(userData: any): Promise<User> {
    try {
      const result = await db.insert(users)
        .values({
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  }

  // Restaurant operations
  async getRestaurants(): Promise<Restaurant[]> {
    try {
      return await db.select().from(restaurants).where(eq(restaurants.isActive, true));
    } catch (error) {
      console.error('Error getting restaurants:', error);
      return [];
    }
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    try {
      return await db.select().from(restaurants);
    } catch (error) {
      console.error('Error getting all restaurants:', error);
      return [];
    }
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    try {
      const result = await db.select().from(restaurants)
        .where(eq(restaurants.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting restaurant:', error);
      return undefined;
    }
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    try {
      const result = await db.insert(restaurants)
        .values({
          ...restaurant,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }
  }

  async updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant> {
    try {
      const result = await db.update(restaurants)
        .set({ ...restaurant, updatedAt: new Date() })
        .where(eq(restaurants.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating restaurant:', error);
      throw error;
    }
  }

  async deleteRestaurant(id: string): Promise<void> {
    try {
      await db.delete(restaurants).where(eq(restaurants.id, id));
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      throw error;
    }
  }

  async approveRestaurant(id: string): Promise<Restaurant> {
    try {
      const result = await db.update(restaurants)
        .set({ isApproved: true, updatedAt: new Date() })
        .where(eq(restaurants.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error approving restaurant:', error);
      throw error;
    }
  }

  // Admin user operations
  async getAllAdminUsers(): Promise<User[]> {
    try {
      return await db.select().from(users)
        .where(sql`${users.role} IN ('superadmin', 'restaurant_admin', 'kitchen_staff')`);
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }

  // Menu operations
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    try {
      return await db.select().from(menuCategories)
        .where(eq(menuCategories.restaurantId, restaurantId));
    } catch (error) {
      console.error('Error getting menu categories:', error);
      return [];
    }
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    try {
      const result = await db.insert(menuCategories)
        .values({
          ...category,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating menu category:', error);
      throw error;
    }
  }

  async updateMenuCategory(id: string, category: Partial<InsertMenuCategory>): Promise<MenuCategory> {
    try {
      const result = await db.update(menuCategories)
        .set({ ...category, updatedAt: new Date() })
        .where(eq(menuCategories.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating menu category:', error);
      throw error;
    }
  }

  async deleteMenuCategory(id: string): Promise<void> {
    try {
      await db.delete(menuCategories).where(eq(menuCategories.id, id));
    } catch (error) {
      console.error('Error deleting menu category:', error);
      throw error;
    }
  }

  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    try {
      return await db.select().from(menuItems)
        .where(eq(menuItems.restaurantId, restaurantId));
    } catch (error) {
      console.error('Error getting menu items:', error);
      return [];
    }
  }

  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    try {
      return await db.select().from(menuItems)
        .where(eq(menuItems.categoryId, categoryId));
    } catch (error) {
      console.error('Error getting menu items by category:', error);
      return [];
    }
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    try {
      const result = await db.insert(menuItems)
        .values({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  }

  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem> {
    try {
      const result = await db.update(menuItems)
        .set({ ...item, updatedAt: new Date() })
        .where(eq(menuItems.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  async deleteMenuItem(id: string): Promise<void> {
    try {
      await db.delete(menuItems).where(eq(menuItems.id, id));
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    try {
      return await db.select().from(orders);
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  async getOrder(id: string): Promise<Order | undefined> {
    try {
      const result = await db.select().from(orders)
        .where(eq(orders.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting order:', error);
      return undefined;
    }
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    try {
      return await db.select().from(orders)
        .where(eq(orders.status, status as any));
    } catch (error) {
      console.error('Error getting orders by status:', error);
      return [];
    }
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    try {
      return await db.select().from(orders)
        .where(eq(orders.restaurantId, restaurantId));
    } catch (error) {
      console.error('Error getting orders by restaurant:', error);
      return [];
    }
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      return await db.select().from(orders)
        .where(eq(orders.customerId, customerId));
    } catch (error) {
      console.error('Error getting orders by customer:', error);
      return [];
    }
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      const result = await db.insert(orders)
        .values({
          ...order,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order> {
    try {
      const result = await db.update(orders)
        .set({ ...order, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    try {
      const result = await db.update(orders)
        .set({ status: status as any, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Driver operations
  async getDrivers(): Promise<Driver[]> {
    try {
      return await db.select().from(drivers);
    } catch (error) {
      console.error('Error getting drivers:', error);
      return [];
    }
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    try {
      const result = await db.select().from(drivers)
        .where(eq(drivers.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting driver:', error);
      return undefined;
    }
  }

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    try {
      const result = await db.select().from(drivers)
        .where(eq(drivers.userId, userId))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting driver by user ID:', error);
      return undefined;
    }
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    try {
      const result = await db.insert(drivers)
        .values({
          ...driver,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating driver:', error);
      throw error;
    }
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver> {
    try {
      const result = await db.update(drivers)
        .set({ ...driver, updatedAt: new Date() })
        .where(eq(drivers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  }

  async approveDriver(id: string): Promise<Driver> {
    try {
      const result = await db.update(drivers)
        .set({ isApproved: true, updatedAt: new Date() })
        .where(eq(drivers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error approving driver:', error);
      throw error;
    }
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    try {
      return await db.select().from(drivers)
        .where(and(eq(drivers.isAvailable, true), eq(drivers.isOnline, true)));
    } catch (error) {
      console.error('Error getting available drivers:', error);
      return [];
    }
  }

  async updateDriverLocation(id: string, location: any): Promise<Driver> {
    try {
      const result = await db.update(drivers)
        .set({ currentLocation: location, updatedAt: new Date() })
        .where(eq(drivers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  }

  async updateDriverStatus(id: string, isOnline: boolean, isAvailable: boolean): Promise<Driver> {
    try {
      const result = await db.update(drivers)
        .set({ isOnline, isAvailable, updatedAt: new Date() })
        .where(eq(drivers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating driver status:', error);
      throw error;
    }
  }

  // Delivery operations
  async getDeliveries(): Promise<Delivery[]> {
    try {
      return await db.select().from(deliveries);
    } catch (error) {
      console.error('Error getting deliveries:', error);
      return [];
    }
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    try {
      const result = await db.select().from(deliveries)
        .where(eq(deliveries.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting delivery:', error);
      return undefined;
    }
  }

  async getDeliveriesByDriver(driverId: string): Promise<Delivery[]> {
    try {
      return await db.select().from(deliveries)
        .where(eq(deliveries.driverId, driverId));
    } catch (error) {
      console.error('Error getting deliveries by driver:', error);
      return [];
    }
  }

  async getDeliveriesByOrder(orderId: string): Promise<Delivery[]> {
    try {
      return await db.select().from(deliveries)
        .where(eq(deliveries.orderId, orderId));
    } catch (error) {
      console.error('Error getting deliveries by order:', error);
      return [];
    }
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    try {
      const result = await db.insert(deliveries)
        .values({
          ...delivery,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating delivery:', error);
      throw error;
    }
  }

  async updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery> {
    try {
      const result = await db.update(deliveries)
        .set({ ...delivery, updatedAt: new Date() })
        .where(eq(deliveries.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating delivery:', error);
      throw error;
    }
  }

  async updateDeliveryStatus(id: string, status: string): Promise<Delivery> {
    try {
      const result = await db.update(deliveries)
        .set({ status: status as any, updatedAt: new Date() })
        .where(eq(deliveries.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      return await db.select().from(notifications)
        .where(eq(notifications.userId, userId));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    try {
      return await db.select().from(notifications)
        .where(eq(notifications.userId, userId));
    } catch (error) {
      console.error('Error getting notifications by user:', error);
      return [];
    }
  }

  // System settings methods
  async getSystemSettings(): Promise<any> {
    return {
      companyName: "BeU Delivery",
      companyLogo: null,
      deliveryFee: "5.00",
      taxRate: "0.15"
    };
  }

  async updateSystemSettings(settings: any): Promise<any> {
    // For now, just return the settings as we don't have a system_settings table
    return settings;
  }

  async updateCompanyLogo(logoUrl: string): Promise<void> {
    // For now, just log - would need system_settings table
    console.log('Company logo updated:', logoUrl);
  }

  // Password management methods
  async verifyAdminPassword(adminId: string, password: string): Promise<boolean> {
    try {
      const user = await this.getUser(adminId);
      if (!user?.password) return false;
      
      // In a real implementation, you'd use bcrypt to compare
      // For now, simple comparison (should use bcrypt in production)
      return user.password === password;
    } catch (error) {
      console.error('Error verifying admin password:', error);
      return false;
    }
  }

  async updateAdminPassword(adminId: string, newPassword: string): Promise<void> {
    try {
      await db.update(users)
        .set({ password: newPassword, updatedAt: new Date() })
        .where(eq(users.id, adminId));
    } catch (error) {
      console.error('Error updating admin password:', error);
      throw error;
    }
  }

  // Driver management methods
  async getAllDrivers(): Promise<Driver[]> {
    return this.getDrivers();
  }

  async rejectDriver(driverId: string): Promise<void> {
    try {
      await db.update(drivers)
        .set({ isApproved: false, updatedAt: new Date() })
        .where(eq(drivers.id, driverId));
    } catch (error) {
      console.error('Error rejecting driver:', error);
      throw error;
    }
  }

  // Analytics operations
  async getDashboardStats(): Promise<any> {
    try {
      const totalOrders = await db.select().from(orders);
      const totalRestaurants = await db.select().from(restaurants);
      const totalDrivers = await db.select().from(drivers);
      
      return {
        totalOrders: totalOrders.length,
        totalRestaurants: totalRestaurants.length,
        totalDrivers: totalDrivers.length,
        totalRevenue: "0.00"
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalOrders: 0,
        totalRestaurants: 0,
        totalDrivers: 0,
        totalRevenue: "0.00"
      };
    }
  }

  async getOrderAnalytics(): Promise<any> {
    try {
      const orders = await this.getOrders();
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const completedOrders = orders.filter(o => o.status === 'delivered').length;
      
      return {
        pendingOrders,
        completedOrders,
        totalOrders: orders.length
      };
    } catch (error) {
      console.error('Error getting order analytics:', error);
      return {
        pendingOrders: 0,
        completedOrders: 0,
        totalOrders: 0
      };
    }
  }

  // Notification operations - removed duplicate methods

  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const result = await db.insert(notifications)
        .values({
          ...notification,
          createdAt: new Date(),
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    try {
      const result = await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Kitchen Staff specific methods
  async getMenuItemsByStatus(restaurantId: string, status: string): Promise<MenuItem[]> {
    try {
      return await db.select().from(menuItems)
        .where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.status, status)));
    } catch (error) {
      console.error('Error getting menu items by status:', error);
      return [];
    }
  }

  async getMenuCategoriesByStatus(restaurantId: string, status: string): Promise<MenuCategory[]> {
    try {
      return await db.select().from(menuCategories)
        .where(and(eq(menuCategories.restaurantId, restaurantId), eq(menuCategories.status, status)));
    } catch (error) {
      console.error('Error getting menu categories by status:', error);
      return [];
    }
  }

  async getActiveRestaurantMenu(restaurantId: string): Promise<any> {
    try {
      const categories = await db.select().from(menuCategories)
        .where(and(
          eq(menuCategories.restaurantId, restaurantId),
          eq(menuCategories.status, 'active'),
          eq(menuCategories.isActive, true)
        ));

      const categoriesWithItems = [];
      
      for (const category of categories) {
        const items = await db.select().from(menuItems)
          .where(and(
            eq(menuItems.categoryId, category.id),
            eq(menuItems.status, 'active'),
            eq(menuItems.isAvailable, true)
          ));
        
        categoriesWithItems.push({
          ...category,
          items: items
        });
      }

      return categoriesWithItems;
    } catch (error) {
      console.error('Error getting active restaurant menu:', error);
      return [];
    }
  }

  async updateOrder(orderId: string, updates: any): Promise<Order> {
    try {
      const result = await db.update(orders)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }
}