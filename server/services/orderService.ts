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
      case 'preparing':
        await this.handleOrderPreparing(order);
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

  async handleOrderPreparing(order: any) {
    try {
      console.log(`🍳 Handling order preparing: ${order.orderNumber}`);
      
      // Send immediate notification to customer via Telegram
      if (order.customerId) {
        try {
          const customer = await storage.getUser(order.customerId);
          if (customer?.telegramUserId) {
            const { broadcastToSpecificCustomer } = require('../telegram/customerBot');
            await broadcastToSpecificCustomer(customer.telegramUserId, {
              title: '👨‍🍳 Your Order is Being Prepared!',
              message: `Great news! Your order ${order.orderNumber} is now being prepared by our kitchen staff. It will be ready soon for pickup.`,
              orderNumber: order.orderNumber,
              status: 'preparing'
            });
            console.log(`📱 Notified customer ${customer.telegramUserId} about order preparation start`);
          }
        } catch (error) {
          console.error('Error notifying customer of preparation start:', error);
        }
      }

      // Get restaurant location for nearby driver detection
      const restaurant = await storage.getRestaurant(order.restaurantId);
      if (!restaurant) {
        console.error('Restaurant not found for order:', order.id);
        return;
      }

      const restaurantLocation = {
        lat: restaurant.latitude || restaurant.location?.lat,
        lng: restaurant.longitude || restaurant.location?.lng
      };

      // Notify nearby drivers about new order
      const { driverService } = await import('./driverService');
      const notifiedDriver = await driverService.notifyNearbyDrivers(order, restaurantLocation);
      
      if (notifiedDriver) {
        console.log(`Order ${order.id} notification sent to driver ${notifiedDriver.id}`);
      } else {
        console.log(`No available drivers for order ${order.id}`);
      }

      // Notify customer that preparation has started
      const { broadcast } = await import('../websocket');
      broadcast('order_status_updated', {
        orderId: order.id,
        status: 'preparing',
        message: 'Your order preparation has started!'
      });

    } catch (error) {
      console.error('Error handling order preparation:', error);
    }
  }

  private async handleOrderReady(order: any) {
    // This method is called when kitchen marks order as ready
    // At this point, a driver should already be assigned from the preparing phase
    if (order.driverId) {
      // Update order status to ready
      await storage.updateOrderStatus(order.id, 'ready');

      // Notify assigned driver that order is ready for pickup
      const { notifyDriver } = await import('../websocket');
      notifyDriver(order.driverId, 'order_ready_for_pickup', {
        driverId: order.driverId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        restaurantName: order.restaurantName
      });

      // Notify customer
      const { broadcast: customerBroadcast } = await import('../websocket');
      customerBroadcast('order_status_updated', {
        orderId: order.id,
        status: 'ready',
        message: 'Your order is ready and driver is on the way!'
      });

    } else {
      // Fallback: No driver assigned yet, find one now
      const restaurant = await storage.getRestaurant(order.restaurantId);
      const restaurantLocation = {
        lat: restaurant?.latitude || restaurant?.location?.lat,
        lng: restaurant?.longitude || restaurant?.location?.lng
      };

      const { driverService } = await import('./driverService');
      const nearestDriver = await driverService.findNearestDriver(restaurantLocation);
      
      if (nearestDriver) {
        await driverService.assignOrderToDriver(order.id, nearestDriver.id);
      }
    }
  }

  private async handleOrderPickedUp(order: any) {
    try {
      // Notify customer that order has been picked up
      const { broadcast } = await import('../websocket');
      broadcast('order_status_updated', {
        orderId: order.id,
        status: 'picked_up',
        message: 'Your order has been picked up and is on its way!'
      });

      // Notify driver with delivery phase information
      const { notifyDriver } = await import('../websocket');
      notifyDriver(order.driverId, 'order_pickup_confirmed', {
        driverId: order.driverId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: 'Order picked up successfully! Navigate to customer location.'
      });

    } catch (error) {
      console.error('Error handling order pickup:', error);
    }
  }

  private async handleOrderDelivered(order: any) {
    try {
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

        // Make driver available again
        await storage.updateDriverStatus(order.driverId, true, true);
      }

      // Notify customer of successful delivery
      const { broadcast } = await import('../websocket');
      broadcast('order_status_updated', {
        orderId: order.id,
        status: 'delivered',
        message: 'Your order has been delivered successfully!'
      });

      // Update driver dashboard
      const { notifyDriver } = await import('../websocket');
      notifyDriver(order.driverId, 'delivery_completed', {
        driverId: order.driverId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        earnings: this.calculateDeliveryEarnings(order)
      });

      // Notify customer
      await storage.createNotification({
        userId: order.customerId,
        type: 'order',
        title: 'Order Delivered',
        message: `Your order #${order.orderNumber} has been delivered successfully`,
        data: { orderId: order.id },
      });

    } catch (error) {
      console.error('Error handling order delivery:', error);
    }
  }

  private calculateDeliveryEarnings(order: any): number {
    const baseEarnings = (order.totalAmount || 0) * 0.15; // 15% of order total
    const minEarnings = 50; // Minimum 50 ETB per delivery
    return Math.max(baseEarnings, minEarnings);
  }

  async triggerAutomatedDriverAssignment(orderId: string) {
    try {
      const order = await storage.getOrder(orderId);
      if (!order) {
        console.error('Order not found for automated assignment:', orderId);
        return;
      }

      // Only trigger if order is ready and doesn't have a driver
      if (order.status === 'ready' && !order.driverId) {
        const restaurant = await storage.getRestaurant(order.restaurantId);
        const restaurantLocation = {
          lat: restaurant?.latitude || restaurant?.location?.lat,
          lng: restaurant?.longitude || restaurant?.location?.lng
        };

        const { driverService } = await import('./driverService');
        const nearestDriver = await driverService.findNearestDriver(restaurantLocation);
        
        if (nearestDriver) {
          await driverService.assignOrderToDriver(orderId, nearestDriver.id);
          console.log(`Automated assignment: Order ${orderId} assigned to driver ${nearestDriver.id}`);
          
          // Real-time notification to all parties
          const { notifyDriver, broadcast } = await import('../websocket');
          
          // Notify the assigned driver
          notifyDriver(nearestDriver.id, 'order_driver_assigned', {
            orderId,
            driverId: nearestDriver.id,
            orderNumber: order.orderNumber,
            restaurantName: order.restaurantName,
            message: 'You have been assigned a new order!'
          });

          // Notify customer and restaurant
          broadcast('order_status_updated', {
            orderId,
            status: 'driver_assigned',
            message: 'Driver assigned and on the way to pickup!',
            driverInfo: {
              name: nearestDriver.firstName + ' ' + nearestDriver.lastName,
              phone: nearestDriver.phone
            }
          });
          
          return nearestDriver;
        } else {
          console.log('No available drivers for automated assignment:', orderId);
        }
      }
    } catch (error) {
      console.error('Error in automated driver assignment:', error);
    }
    return null;
  }
}

export const orderService = new OrderService();
