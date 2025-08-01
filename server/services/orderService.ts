import { storage } from '../storage';
import { driverService } from './driverService';
import { type InsertOrder } from '@shared/schema';

class OrderService {
  async createOrder(orderData: InsertOrder) {
    const order = await storage.createOrder(orderData);
    
    // Notify restaurant (in a real app, you'd send this via WebSocket or notification)
    await storage.createNotification({
      userId: order.restaurantId,
      type: 'order',
      title: 'New Order Received',
      message: `Order #${order.orderNumber} has been placed`,
      data: { orderId: order.id },
    });

    return order;
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await storage.updateOrderStatus(orderId, status);

    // Handle status-specific logic
    switch (status) {
      case 'confirmed':
        await this.handleOrderConfirmed(order);
        break;
      case 'ready':
        await this.handleOrderReady(order);
        break;
      case 'delivered':
        await this.handleOrderDelivered(order);
        break;
    }

    return order;
  }

  private async handleOrderConfirmed(order: any) {
    // Notify customer
    await storage.createNotification({
      userId: order.customerId,
      type: 'order',
      title: 'Order Confirmed',
      message: `Your order #${order.orderNumber} has been confirmed and is being prepared`,
      data: { orderId: order.id },
    });
  }

  private async handleOrderReady(order: any) {
    // Find and assign driver
    const driver = await driverService.findNearestDriver(order.deliveryLocation);
    
    if (driver) {
      await storage.updateOrder(order.id, { driverId: driver.id, status: 'assigned' });
      await storage.createDelivery({
        orderId: order.id,
        driverId: driver.id,
        status: 'assigned',
      });

      // Notify driver
      await storage.createNotification({
        userId: driver.userId,
        type: 'order',
        title: 'New Delivery Assignment',
        message: `You have been assigned order #${order.orderNumber}`,
        data: { orderId: order.id },
      });

      // Notify customer
      await storage.createNotification({
        userId: order.customerId,
        type: 'order',
        title: 'Driver Assigned',
        message: `Your order #${order.orderNumber} has been assigned to a driver`,
        data: { orderId: order.id },
      });
    }
  }

  private async handleOrderDelivered(order: any) {
    // Update delivery status
    if (order.driverId) {
      const deliveries = await storage.getDeliveriesByDriver(order.driverId);
      const delivery = deliveries.find(d => d.orderId === order.id);
      
      if (delivery) {
        await storage.updateDelivery(delivery.id, {
          status: 'delivered',
          deliveryTime: new Date(),
        });
      }
    }

    // Notify customer
    await storage.createNotification({
      userId: order.customerId,
      type: 'order',
      title: 'Order Delivered',
      message: `Your order #${order.orderNumber} has been delivered successfully`,
      data: { orderId: order.id },
    });
  }
}

export const orderService = new OrderService();
