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
      if (driver.currentLocation && driver.currentLocation.lat && driver.currentLocation.lng) {
        const distance = this.calculateDistance(
          restaurantLocation.lat,
          restaurantLocation.lng,
          driver.currentLocation.lat,
          driver.currentLocation.lng
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
        distance: restaurantLocation ? this.calculateDistance(
          restaurantLocation.lat,
          restaurantLocation.lng,
          nearestDriver.currentLocation?.lat || 0,
          nearestDriver.currentLocation?.lng || 0
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
    const order = await storage.getOrder(orderId);
    const driver = await storage.getDriver(driverId);

    if (!order || !driver) {
      throw new Error('Order or driver not found');
    }

    // Update order with driver
    await storage.updateOrder(orderId, { driverId, status: 'assigned' });

    // Create delivery record
    const delivery = await storage.createDelivery({
      orderId,
      driverId,
      status: 'assigned',
    });

    // Update driver availability
    await storage.updateDriverStatus(driverId, true, false); // online but not available

    // Notify driver
    await storage.createNotification({
      userId: driver.userId,
      type: 'order',
      title: 'New Delivery Assignment',
      message: `You have been assigned order #${order.orderNumber}`,
      data: { orderId, deliveryId: delivery.id },
    });

    return { order, delivery };
  }

  async updateDeliveryStatus(deliveryId: string, status: string) {
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

    await storage.updateOrderStatus(order.id, orderStatus);

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
