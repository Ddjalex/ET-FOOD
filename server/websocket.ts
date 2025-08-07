import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { storage } from './storage';

export interface SocketUser {
  userId: string;
  role: string;
  restaurantId?: string;
}

declare module 'socket.io' {
  interface Socket {
    user?: SocketUser;
  }
}

let io: SocketIOServer;

export const initWebSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Authentication middleware for socket connections
    socket.on('authenticate', async (data: { userId: string }) => {
      try {
        console.log(`🔍 WebSocket authentication attempt for userId: ${data.userId}`);
        
        // First try to get user from users table
        let user = await storage.getUser(data.userId);
        let isDriver = false;
        
        // If not found, or if found user doesn't have driver role, check drivers table
        if (!user || user.role !== 'driver') {
          console.log(`🔍 User not found or not driver role, checking drivers table...`);
          const driver = await storage.getDriver(data.userId);
          if (driver) {
            console.log(`✅ Found driver: ${driver.name} (${driver.id})`);
            // Create a user-like object for driver authentication
            user = {
              id: driver.id,
              role: 'driver',
              email: null,
              firstName: driver.name?.split(' ')[0] || null,
              lastName: driver.name?.split(' ').slice(1).join(' ') || null,
              profileImageUrl: null,
              phoneNumber: driver.phoneNumber,
              telegramUserId: driver.telegramId,
              telegramUsername: null,
              password: null,
              isActive: driver.isApproved,
              restaurantId: null,
              createdBy: null,
              createdAt: driver.createdAt,
              updatedAt: driver.updatedAt
            };
            isDriver = true;
          }
        }
        
        if (user) {
          socket.user = {
            userId: user.id,
            role: user.role || 'customer',
            restaurantId: user.restaurantId || undefined
          };
          
          // Join role-specific rooms
          socket.join(`role:${user.role}`);
          socket.join(`user:${user.id}`);
          
          if (user.restaurantId) {
            socket.join(`restaurant:${user.restaurantId}`);
          }
          
          // For drivers, join driver-specific room
          if (user.role === 'driver' || isDriver) {
            socket.join(`driver:${user.id}`);
            console.log(`🔗 Driver ${user.id} joined driver room`);
          }
          
          socket.emit('authenticated', { success: true, user: socket.user });
          console.log(`✅ User ${user.id} authenticated with role ${user.role}${isDriver ? ' (via drivers table)' : ''}`);
        } else {
          console.log(`❌ Authentication failed - no user or driver found for ID: ${data.userId}`);
          socket.emit('authentication_error', { message: 'User not found' });
        }
      } catch (error) {
        console.error('❌ Socket authentication error:', error);
        socket.emit('authentication_error', { message: 'Authentication failed' });
      }
    });

    // Driver-specific events
    socket.on('driver-online', async (driverId: string) => {
      console.log(`Driver ${driverId} came online`);
      socket.join(`driver:${driverId}`);
    });

    // Test handler for manual trigger of enhanced order notifications
    socket.on('trigger_test_order', (data) => {
      console.log('🧪 Triggering test order notification:', data);
      
      if (data.type === 'new_order_notification') {
        // Broadcast to all drivers
        io.to('role:driver').emit('new_order_notification', data.data);
        console.log('📢 Broadcasted test order notification to all drivers');
      }
    });

    // Enhanced test handler for interactive modal
    socket.on('enhanced_notification_test', (data) => {
      console.log('🚨 Enhanced notification test triggered:', data);
      
      // Send the enhanced notification to all drivers
      io.to('role:driver').emit('new_order_notification', data);
      console.log('📢 Enhanced interactive notification sent to all drivers');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getSocketIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initWebSocket first.');
  }
  return io;
};

// Notification functions
export const broadcast = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
    console.log(`Broadcasting ${event}:`, data);
  }
};

export const notifyRestaurantAdmin = (restaurantId: string, event: string, data: any) => {
  if (io) {
    io.to(`restaurant:${restaurantId}`).to('role:restaurant_admin').emit(event, data);
  }
};

export const notifyKitchenStaff = (restaurantId: string, event: string, data: any) => {
  if (io) {
    io.to(`restaurant:${restaurantId}`).to('role:kitchen_staff').emit(event, data);
  }
};

export const notifyCustomer = (customerId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${customerId}`).emit(event, data);
  }
};

export const notifyAllCustomers = (event: string, data: any) => {
  if (io) {
    io.to('role:customer').emit(event, data);
  }
};

export const broadcastMenuUpdate = (restaurantId: string, menuData: any) => {
  if (io) {
    // Notify all customers about menu updates for this restaurant
    io.emit('menu_updated', {
      restaurantId,
      menu: menuData
    });
  }
};

// Notify SuperAdmin about driver registrations
export const notifySuperAdmin = (event: string, data: any) => {
  if (io) {
    io.to('role:superadmin').emit(event, data);
    console.log(`SuperAdmin notification - ${event}:`, data);
  }
};

// Driver-specific notifications
export const notifyDriver = (driverId: string, event: string, data: any) => {
  if (io) {
    io.to(`driver:${driverId}`).emit(event, data);
    console.log(`Driver ${driverId} notification - ${event}:`, data);
  }
};

export const notifyAllDrivers = (event: string, data: any) => {
  if (io) {
    io.to('role:driver').emit(event, data);
    console.log(`All drivers notification - ${event}:`, data);
  }
};

// Enhanced broadcast function for targeted notifications
export const targetedBroadcast = (targets: string[], event: string, data: any) => {
  if (io) {
    targets.forEach(target => {
      if (target.startsWith('driver:')) {
        io.to(target).emit(event, data);
      } else if (target.startsWith('restaurant:')) {
        io.to(target).emit(event, data);
      } else if (target.startsWith('user:')) {
        io.to(target).emit(event, data);
      } else if (target.startsWith('role:')) {
        io.to(target).emit(event, data);
      }
    });
    console.log(`Targeted broadcast ${event} to [${targets.join(', ')}]:`, data);
  }
};