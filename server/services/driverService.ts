import { storage } from '../storage';

class DriverService {
  async findNearestDriver(restaurantLocation: any) {
    const availableDrivers = await storage.getAvailableDrivers();
    
    if (availableDrivers.length === 0) {
      return null;
    }

    if (!restaurantLocation || !restaurantLocation.lat || !restaurantLocation.lng) {
      // If no restaurant location, return first available driver
      return availableDrivers[0];
    }

    // Calculate distances and find nearest driver
    let nearestDriver = null;
    let shortestDistance = Infinity;

    for (const driver of availableDrivers) {
      if (driver.currentLocation && Array.isArray(driver.currentLocation) && driver.currentLocation.length >= 2) {
        const distance = this.calculateDistance(
          restaurantLocation.lat,
          restaurantLocation.lng,
          driver.currentLocation[0],
          driver.currentLocation[1]
        );
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestDriver = driver;
        }
      }
    }

    // Return nearest driver or first available if none have location
    return nearestDriver || availableDrivers[0];
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async findAndAssignDriver(order: any, restaurantLocation: any) {
    try {
      console.log(`🔍 Finding driver for order ${order.orderNumber}...`);
      
      const nearestDriver = await this.findNearestDriver(restaurantLocation);
      
      if (!nearestDriver) {
        console.log('❌ No available drivers found for order:', order.id);
        return null;
      }

      console.log(`✅ Found nearest driver: ${nearestDriver.name || nearestDriver.id}`);
      
      // Mark driver as busy (online but not available)
      await storage.updateDriverStatus(nearestDriver.id, true, false);
      console.log(`📝 Updated driver ${nearestDriver.id} status to busy`);

      return nearestDriver;

    } catch (error) {
      console.error('Error finding and assigning driver:', error);
      return null;
    }
  }

  async notifyNearbyDrivers(order: any, restaurantLocation: any) {
    try {
      const nearestDriver = await this.findNearestDriver(restaurantLocation);
      
      if (!nearestDriver) {
        console.log('No available drivers found for order:', order.id);
        return null;
      }

      // Send real-time notification to driver via WebSocket
      const notificationData = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        restaurantName: order.restaurantName,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee || 50,
        estimatedEarnings: this.calculateEarnings(order),
        distance: restaurantLocation && nearestDriver.currentLocation && Array.isArray(nearestDriver.currentLocation) ? this.calculateDistance(
          restaurantLocation.lat,
          restaurantLocation.lng,
          nearestDriver.currentLocation[0] || 0,
          nearestDriver.currentLocation[1] || 0
        ) : 0,
        restaurantLocation,
        deliveryAddress: order.deliveryAddress
      };

      // Broadcast to specific driver via WebSocket
      const { notifyDriver } = await import('../websocket');
      notifyDriver(nearestDriver.id, 'new_order_notification', {
        driverId: nearestDriver.id,
        order: notificationData
      });

      console.log(`Notified driver ${nearestDriver.id} about new order ${order.id}`);
      return nearestDriver;

    } catch (error) {
      console.error('Error notifying nearby drivers:', error);
      return null;
    }
  }

  calculateEarnings(order: any): number {
    const baseEarnings = (order.totalAmount || 0) * 0.15; // 15% of order total
    const minEarnings = 50; // Minimum 50 ETB per delivery
    return Math.max(baseEarnings, minEarnings);
  }

  async assignOrderToDriver(orderId: string, driverId: string) {
    try {
      console.log(`🔗 Attempting to assign order ${orderId} to driver ${driverId}`);
      
      const order = await storage.getOrder(orderId);
      const driver = await storage.getDriver(driverId);

      if (!order) {
        console.error(`❌ Order not found: ${orderId}`);
        throw new Error(`Order not found: ${orderId}`);
      }
      
      if (!driver) {
        console.error(`❌ Driver not found: ${driverId}`);
        throw new Error(`Driver not found: ${driverId}`);
      }

      console.log(`✅ Found order ${order.orderNumber} and driver ${driver.name || driver.id}`);

      // Update order with driver
      await storage.updateOrder(orderId, { driverId, status: 'driver_assigned' });
      console.log(`📝 Updated order ${orderId} with driver assignment`);

      // Create delivery record
      const delivery = await storage.createDelivery({
        orderId,
        driverId,
        status: 'picked_up',
      });
      console.log(`📋 Created delivery record for order ${orderId}`);

      // Update driver availability
      await storage.updateDriverStatus(driverId, true, false); // online but not available
      console.log(`🚗 Updated driver ${driverId} status to busy`);

      // Notify driver via notification system
      try {
        await storage.createNotification({
          userId: driver.userId,
          type: 'order',
          title: 'New Delivery Assignment',
          message: `You have been assigned order #${order.orderNumber}`,
          data: { orderId, deliveryId: delivery.id },
        });
        console.log(`📬 Created notification for driver ${driverId}`);
      } catch (notifyError) {
        console.error('Error creating notification:', notifyError);
        // Don't fail the assignment if notification fails
      }

      return { order, delivery };
    } catch (error) {
      console.error('Error in assignOrderToDriver:', error);
      throw error;
    }
  }

  async updateDeliveryStatus(deliveryId: string, status: 'picked_up' | 'delivered' | 'failed' | 'assigned' | 'in_transit') {
    const delivery = await storage.updateDelivery(deliveryId, { status });
    const order = await storage.getOrder(delivery.orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Update order status based on delivery status
    let orderStatus = order.status;
    switch (status) {
      case 'picked_up':
        orderStatus = 'picked_up';
        break;
      case 'delivered':
        orderStatus = 'delivered';
        await storage.updateDelivery(deliveryId, { deliveryTime: new Date() });
        // Make driver available again
        if (delivery.driverId) {
          await storage.updateDriverStatus(delivery.driverId, true, true);
        }
        break;
    }

    if (order.id && orderStatus) {
      await storage.updateOrderStatus(order.id, orderStatus);
    }

    // Notify customer of status change
    await storage.createNotification({
      userId: order.customerId,
      type: 'order',
      title: 'Delivery Update',
      message: `Your order #${order.orderNumber} is ${status.replace('_', ' ')}`,
      data: { orderId: order.id, deliveryId },
    });

    return delivery;
  }
}

export const driverService = new DriverService();
