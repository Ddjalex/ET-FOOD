import { storage } from '../storage';

class DriverService {
  async findNearestDriver(deliveryLocation: any) {
    const availableDrivers = await storage.getAvailableDrivers();
    
    if (availableDrivers.length === 0) {
      return null;
    }

    // Simple algorithm - in a real app, you'd use proper geospatial queries
    // For now, just return the first available driver
    return availableDrivers[0];
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
