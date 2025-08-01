import { storage } from '../storage';
import { type InsertRestaurant } from '@shared/schema';

class RestaurantService {
  async createRestaurant(restaurantData: InsertRestaurant) {
    const restaurant = await storage.createRestaurant(restaurantData);
    
    // Notify superadmin of new restaurant registration
    await storage.createNotification({
      userId: 'superadmin', // You'd need to implement a way to get superadmin IDs
      type: 'restaurant',
      title: 'New Restaurant Registration',
      message: `${restaurant.name} has registered and is awaiting approval`,
      data: { restaurantId: restaurant.id },
    });

    return restaurant;
  }

  async approveRestaurant(restaurantId: string) {
    const restaurant = await storage.approveRestaurant(restaurantId);
    
    // Notify restaurant admin of approval
    const restaurantAdmins = await storage.getRestaurants(); // You'd need to implement getting users by restaurant
    
    return restaurant;
  }

  async updateMenuItemAvailability(itemId: string, isAvailable: boolean) {
    const item = await storage.updateMenuItem(itemId, { isAvailable });
    
    // You could broadcast this change to all connected clients
    // via WebSocket for real-time menu updates
    
    return item;
  }

  async getRestaurantAnalytics(restaurantId: string) {
    const orders = await storage.getOrdersByRestaurant(restaurantId);
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + Number(o.total), 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      totalOrders,
      completedOrders,
      totalRevenue,
      averageOrderValue,
      completionRate: Math.round(completionRate),
    };
  }
}

export const restaurantService = new RestaurantService();
