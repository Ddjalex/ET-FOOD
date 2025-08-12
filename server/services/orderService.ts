import { storage } from '../storage';
import { geocodingService } from './geocodingService';

export class OrderService {
  async updateOrderStatus(orderId: string, status: string, restaurantId?: string) {
    try {
      console.log(`🔄 OrderService: Updating order ${orderId} to status: ${status}`);
      
      // Update the order status
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      console.log(`✅ Order ${orderId} updated to status: ${status}`);
      
      // Handle specific status changes
      if (status === 'in_preparation') {
        await this.handleOrderInPreparation(updatedOrder);
      } else if (status === 'ready_for_pickup') {
        await this.handleOrderReady(updatedOrder);
      } else if (status === 'driver_assigned') {
        await this.handleDriverAssigned(updatedOrder);
      } else if (status === 'picked_up') {
        await this.handleOrderPickedUp(updatedOrder);
      } else if (status === 'delivered') {
        await this.handleOrderDelivered(updatedOrder);
      }
      
      return updatedOrder;
    } catch (error) {
      console.error(`❌ Error updating order ${orderId} to ${status}:`, error);
      throw error;
    }
  }

  async triggerDriverAssignmentAndNotification(order: any) {
    try {
      console.log(`🚗 Triggering driver assignment for order ${order.orderNumber}`);
      
      // Get restaurant information with proper location handling
      const restaurant = await storage.getRestaurant(order.restaurantId);
      if (!restaurant) {
        console.error(`❌ Restaurant not found for order ${order.id}`);
        return;
      }
      
      console.log(`🍽️ Restaurant location for ${restaurant.id}:`, restaurant.location);
      
      // Find the closest available driver
      const assignedDriver = await this.findClosestAvailableDriver(
        restaurant.location?.[0] || 0,
        restaurant.location?.[1] || 0,
        order.id
      );

      if (assignedDriver) {
        console.log(`🚨 Found driver ${assignedDriver.name} (${assignedDriver.id}) for order ${order.orderNumber}`);
        
        // Update order with driver assignment
        await storage.updateOrder(order.id, { driverId: assignedDriver.id });
        
        // Create comprehensive order data for driver notification
        const orderData = {
          driverId: assignedDriver.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          restaurantName: restaurant.name || 'Restaurant',
          restaurantAddress: restaurant.address || 'Restaurant Address',
          restaurantLocation: {
            latitude: restaurant.location?.[0] || 0,
            longitude: restaurant.location?.[1] || 0
          },
          customerName: order.customerName || 'Customer',
          customerPhone: order.customerPhone || '',
          customerAddress: order.deliveryAddress || 'Customer Address',
          customerLocation: {
            latitude: order.deliveryLocation?.latitude || 0,
            longitude: order.deliveryLocation?.longitude || 0
          },
          totalAmount: order.totalAmount || order.total,
          estimatedEarnings: Math.max((order.totalAmount || order.total || 0) * 0.15, 50),
          distance: 2.3,
          status: 'driver_assigned',
          items: order.items || []
        };

        // Send WebSocket notification to specific driver
        console.log(`📡 Sending WebSocket notification to driver ${assignedDriver.id}`);
        const { notifyDriver } = await import('../websocket');
        notifyDriver(assignedDriver.id, 'new_order_assigned', orderData);
        
        // Also send Telegram notification
        try {
          console.log(`📱 Sending Telegram notification to driver ${assignedDriver.telegramId}`);
          const driverBot = await import('../telegram/driverBot');
          if (driverBot.notifyDriverNewOrder) {
            if (assignedDriver.telegramId) {
              await driverBot.notifyDriverNewOrder(assignedDriver.telegramId, {
              orderNumber: order.orderNumber,
              restaurantName: restaurant.name || 'Restaurant',
              customerName: order.customerName || 'Customer',
              estimatedEarnings: Math.max((order.totalAmount || order.total || 0) * 0.15, 50),
              distance: 2.3
              });
            }
          }
        } catch (telegramError: any) {
          console.error('❌ Error sending Telegram notification:', telegramError);
        }

        console.log(`🚨 Real-time ride-style notification sent to driver ${assignedDriver.id}`);
      } else {
        console.log(`⚠️ No available drivers found for order ${order.orderNumber}`);
        
        // Broadcast to all available drivers
        const { getIO } = await import('../websocket');
        try {
          const io = getIO();
          const broadcastData = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            restaurantName: restaurant.name || 'Restaurant',
            customerName: order.customerName || 'Customer',
            totalAmount: order.totalAmount || order.total,
            estimatedEarnings: Math.max((order.totalAmount || order.total || 0) * 0.15, 50),
            distance: 2.3,
            restaurantLocation: {
              latitude: restaurant.location?.[0] || 0,
              longitude: restaurant.location?.[1] || 0
            }
          };

          io.emit('new_available_order', broadcastData);
          console.log(`📢 Broadcast sent to all available drivers for order ${order.orderNumber}`);
        } catch (wsError) {
          console.error('❌ WebSocket broadcast error:', wsError);
        }
      }

    } catch (error) {
      console.error('❌ Error in driver assignment and notification:', error);
    }
  }

  async handleOrderInPreparation(order: any) {
    try {
      console.log(`👨‍🍳 Order actively being prepared: ${order.orderNumber}`);
      
      // Send notification to customer that order is actively being prepared
      if (order.customerId) {
        try {
          const customer = await storage.getUser(order.customerId);
          if (customer?.telegramUserId) {
            const customerBot = await import('../telegram/customerBot');
            // Replace with WebSocket notification since method doesn't exist
            const { broadcast } = await import('../websocket');
            broadcast('order_status_updated', {
              customerId: customer.telegramUserId,
              title: '👨‍🍳 Order Actively Being Prepared!',
              message: `Your order ${order.orderNumber} is now actively being prepared in the kitchen. We'll notify you when it's ready for pickup!`,
              orderNumber: order.orderNumber,
              status: 'in_preparation'
            });
            console.log(`📱 Notified customer ${customer.telegramUserId} about active preparation`);
          }
        } catch (error) {
          console.error('❌ Error notifying customer of active preparation:', error);
        }
      }

      // CRITICAL FIX: Trigger driver assignment when kitchen starts preparing
      console.log(`🚗 Kitchen started preparing - triggering driver assignment for order ${order.orderNumber}`);
      await this.triggerDriverAssignmentAndNotification(order);

      // Notify customer that preparation has started via WebSocket
      const { broadcast } = await import('../websocket');
      broadcast('order_status_updated', {
        orderId: order.id,
        status: 'in_preparation',
        message: 'Your order is now being actively prepared!'
      });

    } catch (error) {
      console.error('❌ Error handling order in preparation:', error);
    }
  }

  async handleOrderReady(order: any) {
    try {
      console.log(`📦 Handling order ready for pickup: ${order.orderNumber}`);
      
      // Check if driver is already assigned from preparing phase
      if (order.driverId) {
        console.log(`✅ Driver ${order.driverId} already assigned to order ${order.id}`);
        
        // Update order status to ready_for_pickup
        await storage.updateOrderStatus(order.id, 'ready_for_pickup');

        // Notify assigned driver that order is ready for pickup
        const { notifyDriver } = await import('../websocket');
        notifyDriver(order.driverId, 'order_ready_for_pickup', {
          driverId: order.driverId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          restaurantName: order.restaurantName || 'Restaurant'
        });
        
        console.log(`📱 Notified driver ${order.driverId} that order ${order.orderNumber} is ready for pickup`);
      } else {
        console.log(`⚠️ No driver assigned yet for order ${order.id}, triggering assignment`);
        await this.triggerDriverAssignmentAndNotification(order);
      }

    } catch (error: any) {
      console.error(`❌ Error handling order ready: ${error.message}`);
    }
  }

  async handleDriverAssigned(order: any) {
    try {
      console.log(`🚗 Driver assigned to order: ${order.orderNumber}`);
      
      // Get driver information
      const driver = await storage.getDriver(order.driverId);
      if (driver) {
        // Notify customer about driver assignment
        const { broadcast } = await import('../websocket');
        broadcast('driver_assigned', {
          orderId: order.id,
          driverName: driver.name || 'Driver',
          driverPhone: driver.phoneNumber || '',
          estimatedArrival: '20-30 minutes'
        });
        
        console.log(`📱 Customer notified about driver assignment for order ${order.orderNumber}`);
      }
    } catch (error) {
      console.error('❌ Error handling driver assignment:', error);
    }
  }

  async handleOrderPickedUp(order: any) {
    try {
      console.log(`📦 Order picked up: ${order.orderNumber}`);
      
      // Notify customer that order is picked up
      const { broadcast } = await import('../websocket');
      broadcast('order_picked_up', {
        orderId: order.id,
        message: 'Your order has been picked up and is on its way!'
      });
      
    } catch (error) {
      console.error('❌ Error handling order pickup:', error);
    }
  }

  async handleOrderDelivered(order: any) {
    try {
      console.log(`✅ Order delivered: ${order.orderNumber}`);
      
      // Notify customer that order is delivered
      const { broadcast } = await import('../websocket');
      broadcast('order_delivered', {
        orderId: order.id,
        message: 'Your order has been delivered! Thank you for choosing us.'
      });
      
    } catch (error) {
      console.error('❌ Error handling order delivery:', error);
    }
  }

  async findClosestAvailableDriver(restaurantLat: number, restaurantLng: number, orderId: string) {
    try {
      console.log(`🔍 Finding driver for order ${orderId}...`);
      
      // Get all available drivers
      const drivers = await storage.getAvailableDrivers();
      console.log(`📋 Found ${drivers.length} available drivers`);
      
      if (drivers.length === 0) {
        console.log(`❌ No available drivers found for order: ${orderId}`);
        return null;
      }
      
      // For now, just return the first available driver
      // In a real implementation, you would calculate distances
      const selectedDriver = drivers[0];
      console.log(`✅ Selected driver: ${selectedDriver.name} (${selectedDriver.id})`);
      
      return selectedDriver;
    } catch (error) {
      console.error('❌ Error finding available driver:', error);
      return null;
    }
  }

  // Add missing methods required by routes.ts
  async createOrder(orderData: any) {
    try {
      console.log('Creating new order:', orderData);
      const order = await storage.createOrder(orderData);
      console.log('Order created successfully:', order.id);
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async triggerAutomatedDriverAssignment(orderId: string) {
    try {
      console.log(`Triggering automated driver assignment for order: ${orderId}`);
      
      // Get the order details
      const order = await storage.getOrder(orderId);
      if (!order) {
        console.error(`Order ${orderId} not found`);
        return;
      }

      // Trigger the driver assignment workflow
      await this.triggerDriverAssignmentAndNotification(order);
      console.log(`Automated driver assignment completed for order: ${orderId}`);
    } catch (error) {
      console.error('Error in automated driver assignment:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();