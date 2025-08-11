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
      case 'in_preparation':
        // CRITICAL: This is triggered when kitchen staff click "Start Preparing" button
        console.log(`🍳 KITCHEN STAFF CLICKED "Start Preparing" - triggering driver notifications!`);
        await this.handleOrderInPreparation(order);
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
            const { broadcastToSpecificCustomer } = await import('../telegram/customerBot');
            await broadcastToSpecificCustomer(customer.telegramUserId, {
              title: '👨‍🍳 Your Order is Being Prepared!',
              message: `Great news! Your order ${order.orderNumber} is now being prepared by our kitchen staff. A driver will be assigned soon.`,
              orderNumber: order.orderNumber,
              status: 'preparing'
            });
            console.log(`📱 Notified customer ${customer.telegramUserId} about order preparation start`);
          }
        } catch (error) {
          console.error('Error notifying customer of preparation start:', error);
        }
      }

      // CRITICAL: Trigger immediate driver assignment and notifications when "Start Preparing" is clicked
      await this.triggerDriverAssignmentAndNotification(order);

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

  async triggerDriverAssignmentAndNotification(order: any) {
    try {
      console.log(`🚗 Triggering driver assignment for order ${order.orderNumber}`);

      // Get restaurant location for driver assignment
      const restaurant = await storage.getRestaurant(order.restaurantId);
      if (!restaurant) {
        console.error('Restaurant not found for order:', order.id);
        return;
      }

      const restaurantLocation = {
        lat: restaurant.latitude || restaurant.location?.lat || 9.04,
        lng: restaurant.longitude || restaurant.location?.lng || 38.75
      };

      console.log(`🍽️ Restaurant location for ${order.restaurantId}:`, restaurantLocation);

      // Find and assign driver
      const { driverService } = await import('./driverService');
      const assignedDriver = await driverService.findAndAssignDriver(order, restaurantLocation);
      
      if (assignedDriver) {
        console.log(`✅ Driver ${assignedDriver.id} assigned to order ${order.id}`);
        
        // Update order with assigned driver
        await storage.assignOrderToDriver(order.id, assignedDriver.id);
        
        // Send real-time ride-style notification to assigned driver
        const { io } = await import('../websocket');
        const driverNotificationData = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customerName || 'Customer',
          restaurantId: order.restaurantId,
          restaurantName: restaurant.name || 'Restaurant',
          items: order.items || [],
          totalAmount: order.totalAmount || order.total,
          deliveryFee: order.deliveryFee || 50,
          total: order.total || order.totalAmount,
          status: 'preparing',
          customerLocation: order.deliveryAddress || order.customerLocation,
          restaurantLocation: restaurantLocation,
          estimatedPreparationTime: '25 minutes',
          notes: order.notes || '',
          estimatedEarnings: Math.max((order.totalAmount || order.total || 0) * 0.15, 50),
          distance: 2.3,
          createdAt: new Date().toISOString()
        };

        // Send ride-style notification to specific driver
        io.to(`driver_${assignedDriver.id}`).emit('new_order_notification', {
          order: driverNotificationData,
          urgency: 'high',
          type: 'ride_style_delivery'
        });

        // Also send to driver bot via Telegram
        try {
          const driverBot = await import('../telegram/driverBot');
          await driverBot.notifyDriverOrderAssigned(assignedDriver.telegramId, {
            orderNumber: order.orderNumber,
            restaurantName: restaurant.name || 'Restaurant',
            customerName: order.customerName || 'Customer',
            estimatedEarnings: Math.max((order.totalAmount || order.total || 0) * 0.15, 50),
            distance: 2.3
          });
          console.log(`📱 Telegram notification sent to driver ${assignedDriver.telegramId}`);
        } catch (error) {
          console.error('Error sending Telegram notification to driver:', error);
        }

        console.log(`🚨 Real-time ride-style notification sent to driver ${assignedDriver.id}`);
      } else {
        console.log(`⚠️ No available drivers found for order ${order.orderNumber}`);
        
        // Broadcast to all available drivers
        const { io } = await import('../websocket');
        const broadcastData = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          restaurantName: restaurant.name || 'Restaurant',
          customerName: order.customerName || 'Customer',
          totalAmount: order.totalAmount || order.total,
          estimatedEarnings: Math.max((order.totalAmount || order.total || 0) * 0.15, 50),
          distance: 2.3
        };

        io.emit('new_available_order', broadcastData);
        console.log(`📢 Broadcast sent to all available drivers for order ${order.orderNumber}`);
      }

    } catch (error) {
      console.error('Error in driver assignment and notification:', error);
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
            const { broadcastToSpecificCustomer } = await import('../telegram/customerBot');
            await broadcastToSpecificCustomer(customer.telegramUserId, {
              title: '👨‍🍳 Order Actively Being Prepared!',
              message: `Your order ${order.orderNumber} is now actively being prepared in the kitchen. We'll notify you when it's ready for pickup!`,
              orderNumber: order.orderNumber,
              status: 'in_preparation'
            });
            console.log(`📱 Notified customer ${customer.telegramUserId} about active preparation`);
          }
        } catch (error) {
          console.error('Error notifying customer of active preparation:', error);
        }
      }

      // Get restaurant location for driver assignment
      const restaurant = await storage.getRestaurant(order.restaurantId);
      if (!restaurant) {
        console.error('Restaurant not found for order:', order.id);
        return;
      }

      const restaurantLocation = {
        lat: restaurant.latitude || restaurant.location?.lat,
        lng: restaurant.longitude || restaurant.location?.lng
      };

      console.log(`🍽️ Restaurant location for ${order.restaurantId}:`, restaurantLocation);

      // Find and assign driver when kitchen staff start preparing
      const { driverService } = await import('./driverService');
      
      // Get the best available driver
      const assignedDriver = await driverService.findAndAssignDriver(order, restaurantLocation);
      
      if (assignedDriver) {
        console.log(`✅ Driver ${assignedDriver.id} assigned to order ${order.id}`);
        
        // Update order with assigned driver
        await storage.assignOrderToDriver(order.id, assignedDriver.id);
        
        // Send real-time notification to assigned driver
        const { notifyDriver } = await import('../websocket');
        notifyDriver(assignedDriver.id, 'new_order_notification', {
          driverId: assignedDriver.id,
          order: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            restaurantName: order.restaurantName || restaurant.name,
            customerName: order.customerName || 'Customer',
            totalAmount: order.total || order.totalAmount,
            deliveryFee: 50,
            estimatedEarnings: driverService.calculateEarnings(order),
            distance: restaurantLocation ? driverService.calculateDistance(
              restaurantLocation.lat,
              restaurantLocation.lng,
              assignedDriver.currentLocation?.lat || 0,
              assignedDriver.currentLocation?.lng || 0
            ) : 0,
            restaurantLocation,
            deliveryAddress: order.deliveryAddress,
            status: 'assigned'
          }
        });

        console.log(`🚨 Real-time notification sent to driver ${assignedDriver.id} for order ${order.orderNumber}`);

        // Notify customer about driver assignment
        if (order.customerId) {
          try {
            const customer = await storage.getUser(order.customerId);
            if (customer?.telegramUserId) {
              const customerBot = await import('../telegram/customerBot');
              await customerBot.broadcastToSpecificCustomer(customer.telegramUserId, {
                title: '🚗 Driver Assigned!',
                message: `Great! Driver ${assignedDriver.name || 'Driver'} has been assigned to your order ${order.orderNumber}. They will pick it up once it's ready.`,
                orderNumber: order.orderNumber,
                status: 'driver_assigned',
                driverName: assignedDriver.name
              });
            }
          } catch (error) {
            console.error('Error notifying customer of driver assignment:', error);
          }
        }

      } else {
        console.log(`⚠️ No available drivers for order ${order.id} - will try again when ready`);
      }

      // Broadcast to restaurant staff that order is actively being prepared
      const { broadcast } = await import('../websocket');
      broadcast('order_status_updated', {
        orderId: order.id,
        status: 'in_preparation',
        message: 'Order is actively being prepared in the kitchen'
      });

    } catch (error) {
      console.error('Error handling order in preparation:', error);
    }
  }

  private async handleOrderReady(order: any) {
    try {
      console.log(`📦 Handling order ready for pickup: ${order.orderNumber}`);
      
      // Check if driver is already assigned from preparing phase
      if (order.driverId) {
        console.log(`✅ Driver ${order.driverId} already assigned to order ${order.id}`);
        
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
        // No driver assigned yet, find and assign one now
        console.log(`🔍 No driver assigned yet for order ${order.id}, finding one now...`);
        
        const restaurant = await storage.getRestaurant(order.restaurantId);
        if (!restaurant) {
          console.error(`❌ Restaurant not found for order ${order.id}`);
          throw new Error('Restaurant not found');
        }

        const restaurantLocation = {
          lat: restaurant?.latitude || restaurant?.location?.lat,
          lng: restaurant?.longitude || restaurant?.location?.lng
        };

        console.log(`🍽️ Restaurant location:`, restaurantLocation);

        const { driverService } = await import('./driverService');
        const nearestDriver = await driverService.findNearestDriver(restaurantLocation);
        
        if (nearestDriver) {
          console.log(`✅ Found nearest driver: ${nearestDriver.name || nearestDriver.id}`);
          
          // Assign driver to order
          await driverService.assignOrderToDriver(order.id, nearestDriver.id);
          
          // Update order status to ready
          await storage.updateOrderStatus(order.id, 'ready');
          
          // Send real-time notification to assigned driver
          const { notifyDriver } = await import('../websocket');
          notifyDriver(nearestDriver.id, 'order_ready_for_pickup', {
            driverId: nearestDriver.id,
            orderId: order.id,
            orderNumber: order.orderNumber,
            restaurantName: restaurant.name || order.restaurantName
          });

          console.log(`🚨 Notified driver ${nearestDriver.id} that order ${order.orderNumber} is ready for pickup`);

          // Notify customer about driver assignment
          const { broadcast: customerBroadcast } = await import('../websocket');
          customerBroadcast('order_status_updated', {
            orderId: order.id,
            status: 'ready',
            message: `Your order is ready! Driver ${nearestDriver.name || 'Driver'} will pick it up soon.`
          });

        } else {
          console.log(`⚠️ No available drivers for order ${order.id}`);
          // Update order status anyway but log warning
          await storage.updateOrderStatus(order.id, 'ready');
          
          // Notify that order is ready but no driver available yet
          const { broadcast: customerBroadcast } = await import('../websocket');
          customerBroadcast('order_status_updated', {
            orderId: order.id,
            status: 'ready',
            message: 'Your order is ready! We are finding a driver for you.'
          });
        }
        
        // Always broadcast the new available order to all drivers using enhanced notification
        console.log(`📢 Broadcasting enhanced order notification to drivers: ${order.orderNumber}`);
        const { notifyAllDrivers } = await import('../websocket');
        
        // Get restaurant details for enhanced notification
        const restaurantDetails = await storage.getRestaurant(order.restaurantId);
        
        // Send enhanced notification for interactive modal
        notifyAllDrivers('new_order_notification', {
          driverId: 'all', // Target all available drivers
          order: {
            id: order.id,
            orderId: order.id,
            orderNumber: order.orderNumber,
            restaurantId: order.restaurantId,
            restaurantName: restaurantDetails?.name || order.restaurantName || 'Restaurant',
            restaurantLocation: {
              lat: restaurantDetails?.latitude || restaurantDetails?.location?.lat || 9.005,
              lng: restaurantDetails?.longitude || restaurantDetails?.location?.lng || 38.7639,
              address: restaurantDetails?.address || 'Restaurant Address'
            },
            customerName: order.customerName || 'Customer',
            deliveryAddress: order.deliveryAddress || 'Delivery Address',
            deliveryLocation: {
              lat: order.customerLat || order.deliveryLocation?.lat || 9.015,
              lng: order.customerLng || order.deliveryLocation?.lng || 38.7739
            },
            total: order.total || order.totalAmount,
            estimatedEarnings: Math.max((order.total || order.totalAmount || 0) * 0.15, 50),
            items: order.items || [],
            status: order.status
          }
        });

        // Remove legacy event - only use enhanced interactive notifications
      }
    } catch (error) {
      console.error('Error handling order ready:', error);
      // Don't re-throw the error, just log it to prevent 500 errors
      // The order status will still be updated by the calling function
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
