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
        const user = await storage.getUser(data.userId);
        if (user) {
          socket.user = {
            userId: user.id,
            role: user.role || 'customer',
            restaurantId: user.restaurantId || undefined
          };
          
          // Join role-specific rooms
          socket.join(`role:${user.role}`);
          if (user.restaurantId) {
            socket.join(`restaurant:${user.restaurantId}`);
          }
          
          socket.emit('authenticated', { success: true, user: socket.user });
          console.log(`User ${user.id} authenticated with role ${user.role}`);
        } else {
          socket.emit('authentication_error', { message: 'User not found' });
        }
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('authentication_error', { message: 'Authentication failed' });
      }
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

// General broadcast function
export const broadcast = (event: { type: string, data: any }) => {
  if (io) {
    io.emit(event.type, event.data);
  }
};