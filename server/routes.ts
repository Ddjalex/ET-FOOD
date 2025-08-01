import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupTelegramBots } from "./telegram/bot";
import { orderService } from "./services/orderService";
import { driverService } from "./services/driverService";
import { restaurantService } from "./services/restaurantService";
import { uploadMiddleware } from "./middleware/upload";
import { adminAuth, requireSuperadmin, requireRestaurantAdmin, requireKitchenAccess, requireSession, hashPassword } from "./middleware/auth";
import { insertOrderSchema, insertRestaurantSchema, insertDriverSchema, insertMenuItemSchema, insertMenuCategorySchema, UserRole } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Setup Telegram bots
  await setupTelegramBots();

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message) => {
      console.log('Received:', message.toString());
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin Authentication Routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Initialize superadmin if it doesn't exist
      const existingSuperAdmin = await storage.getUserByEmail('superadmin@beu-delivery.com');
      if (!existingSuperAdmin) {
        const hashedPassword = await hashPassword('admin123');
        await storage.createAdminUser({
          email: 'superadmin@beu-delivery.com',
          firstName: 'Super',
          lastName: 'Admin',
          role: UserRole.SUPERADMIN,
          password: hashedPassword,
          isActive: true
        });
        console.log('Superadmin created with email: superadmin@beu-delivery.com and password: admin123');
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if user has admin role
      if (!user.role || !['superadmin', 'restaurant_admin', 'kitchen_staff'].includes(user.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is disabled' });
      }

      // Store user in session
      req.session.user = user;
      res.json({ 
        message: 'Login successful', 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          restaurantId: user.restaurantId
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/admin/me', requireSession, (req, res) => {
    res.json({
      id: req.user!.id,
      email: req.user!.email,
      firstName: req.user!.firstName,
      lastName: req.user!.lastName,
      role: req.user!.role,
      restaurantId: req.user!.restaurantId
    });
  });

  // Initialize superadmin (development only)
  app.post('/api/init-superadmin', async (req, res) => {
    try {
      // Check if superadmin already exists
      const existingSuperAdmin = await storage.getUserByEmail('superadmin@beu-delivery.com');
      if (existingSuperAdmin) {
        return res.json({ message: 'Superadmin already exists', email: 'superadmin@beu-delivery.com' });
      }

      // Create superadmin
      const hashedPassword = await hashPassword('superadmin123');
      const superAdmin = await storage.createAdminUser({
        email: 'superadmin@beu-delivery.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: UserRole.SUPERADMIN,
        password: hashedPassword,
        isActive: true
      });

      res.json({ 
        message: 'Superadmin created successfully',
        email: 'superadmin@beu-delivery.com',
        password: 'superadmin123'
      });
    } catch (error) {
      console.error('Error creating superadmin:', error);
      res.status(500).json({ message: 'Failed to create superadmin' });
    }
  });

  // Superadmin Routes
  app.post('/api/superadmin/restaurant-admin', requireSession, requireSuperadmin, async (req, res) => {
    try {
      const { email, firstName, lastName, password, restaurantId } = req.body;

      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create restaurant admin
      const adminUser = await storage.createAdminUser({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: UserRole.RESTAURANT_ADMIN,
        restaurantId: restaurantId || null,
        createdBy: req.user!.id,
        isActive: true
      });

      res.status(201).json({
        message: 'Restaurant admin created successfully',
        user: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          role: adminUser.role,
          restaurantId: adminUser.restaurantId
        }
      });
    } catch (error) {
      console.error('Error creating restaurant admin:', error);
      res.status(500).json({ message: 'Failed to create restaurant admin' });
    }
  });

  // Restaurant Admin Routes
  app.post('/api/admin/kitchen-staff', requireSession, requireRestaurantAdmin, async (req, res) => {
    try {
      const { email, firstName, lastName, password } = req.body;

      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create kitchen staff
      const kitchenUser = await storage.createAdminUser({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: UserRole.KITCHEN_STAFF,
        restaurantId: req.user!.restaurantId,
        createdBy: req.user!.id,
        isActive: true
      });

      res.status(201).json({
        message: 'Kitchen staff created successfully',
        user: {
          id: kitchenUser.id,
          email: kitchenUser.email,
          firstName: kitchenUser.firstName,
          lastName: kitchenUser.lastName,
          role: kitchenUser.role,
          restaurantId: kitchenUser.restaurantId
        }
      });
    } catch (error) {
      console.error('Error creating kitchen staff:', error);
      res.status(500).json({ message: 'Failed to create kitchen staff' });
    }
  });

  // Dashboard Analytics
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/analytics', isAuthenticated, async (req, res) => {
    try {
      const analytics = await storage.getOrderAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // User hierarchy management routes
  
  // Superadmin: Create restaurant admin and restaurant
  app.post('/api/admin/restaurants', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'superadmin') {
        return res.status(403).json({ message: "Only superadmin can create restaurants" });
      }

      const { restaurantData, adminData } = req.body;
      
      // Create restaurant first
      const restaurant = await storage.createRestaurant(restaurantData);
      
      // Create restaurant admin user
      const restaurantAdmin = await storage.upsertUser({
        ...adminData,
        role: 'restaurant_admin',
        restaurantId: restaurant.id
      });

      res.json({ restaurant, admin: restaurantAdmin });
    } catch (error) {
      console.error("Error creating restaurant and admin:", error);
      res.status(500).json({ message: "Failed to create restaurant and admin" });
    }
  });

  // Restaurant Admin: Create kitchen staff
  app.post('/api/restaurant/kitchen-staff', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'restaurant_admin') {
        return res.status(403).json({ message: "Only restaurant admin can create kitchen staff" });
      }

      const staffData = {
        ...req.body,
        role: 'kitchen_staff',
        restaurantId: user.restaurantId
      };
      
      const kitchenStaff = await storage.upsertUser(staffData);
      res.json(kitchenStaff);
    } catch (error) {
      console.error("Error creating kitchen staff:", error);
      res.status(500).json({ message: "Failed to create kitchen staff" });
    }
  });

  // Restaurant routes
  app.get('/api/restaurants', isAuthenticated, async (req, res) => {
    try {
      const restaurants = await storage.getRestaurants();
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get('/api/restaurants/:id', isAuthenticated, async (req, res) => {
    try {
      const restaurant = await storage.getRestaurant(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.post('/api/restaurants', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertRestaurantSchema.parse(req.body);
      const restaurant = await storage.createRestaurant(validatedData);
      broadcast({ type: 'restaurant_created', data: restaurant });
      res.status(201).json(restaurant);
    } catch (error) {
      console.error("Error creating restaurant:", error);
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  });

  app.put('/api/restaurants/:id', isAuthenticated, async (req, res) => {
    try {
      const restaurant = await storage.updateRestaurant(req.params.id, req.body);
      broadcast({ type: 'restaurant_updated', data: restaurant });
      res.json(restaurant);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(500).json({ message: "Failed to update restaurant" });
    }
  });

  app.post('/api/restaurants/:id/approve', isAuthenticated, async (req, res) => {
    try {
      const restaurant = await storage.approveRestaurant(req.params.id);
      broadcast({ type: 'restaurant_approved', data: restaurant });
      res.json(restaurant);
    } catch (error) {
      console.error("Error approving restaurant:", error);
      res.status(500).json({ message: "Failed to approve restaurant" });
    }
  });

  app.delete('/api/restaurants/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteRestaurant(req.params.id);
      broadcast({ type: 'restaurant_deleted', data: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      res.status(500).json({ message: "Failed to delete restaurant" });
    }
  });

  // Menu routes
  app.get('/api/restaurants/:id/menu-categories', async (req, res) => {
    try {
      const categories = await storage.getMenuCategories(req.params.id);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching menu categories:", error);
      res.status(500).json({ message: "Failed to fetch menu categories" });
    }
  });

  app.post('/api/restaurants/:id/menu-categories', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMenuCategorySchema.parse({
        ...req.body,
        restaurantId: req.params.id,
      });
      const category = await storage.createMenuCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating menu category:", error);
      res.status(500).json({ message: "Failed to create menu category" });
    }
  });

  app.get('/api/restaurants/:id/menu-items', async (req, res) => {
    try {
      const items = await storage.getMenuItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.post('/api/restaurants/:id/menu-items', isAuthenticated, uploadMiddleware.single('image'), async (req, res) => {
    try {
      const validatedData = insertMenuItemSchema.parse({
        ...req.body,
        restaurantId: req.params.id,
        imageUrl: req.file?.path,
      });
      const item = await storage.createMenuItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req, res) => {
    try {
      const { status, restaurant } = req.query;
      let orders;
      
      if (status) {
        orders = await storage.getOrdersByStatus(status as string);
      } else if (restaurant) {
        orders = await storage.getOrdersByRestaurant(restaurant as string);
      } else {
        orders = await storage.getOrders();
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await orderService.createOrder(validatedData);
      broadcast({ type: 'order_created', data: order });
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put('/api/orders/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(req.params.id, status);
      broadcast({ type: 'order_status_updated', data: order });
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Driver routes
  app.get('/api/drivers', isAuthenticated, async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.get('/api/drivers/available', isAuthenticated, async (req, res) => {
    try {
      const drivers = await storage.getAvailableDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching available drivers:", error);
      res.status(500).json({ message: "Failed to fetch available drivers" });
    }
  });

  app.post('/api/drivers', uploadMiddleware.fields([
    { name: 'licenseImage', maxCount: 1 },
    { name: 'vehicleImage', maxCount: 1 },
    { name: 'idCardImage', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const validatedData = insertDriverSchema.parse({
        ...req.body,
        licenseImageUrl: files.licenseImage?.[0]?.path,
        vehicleImageUrl: files.vehicleImage?.[0]?.path,
        idCardImageUrl: files.idCardImage?.[0]?.path,
      });
      const driver = await storage.createDriver(validatedData);
      broadcast({ type: 'driver_registered', data: driver });
      res.status(201).json(driver);
    } catch (error) {
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  app.post('/api/drivers/:id/approve', isAuthenticated, async (req, res) => {
    try {
      const driver = await storage.approveDriver(req.params.id);
      broadcast({ type: 'driver_approved', data: driver });
      res.json(driver);
    } catch (error) {
      console.error("Error approving driver:", error);
      res.status(500).json({ message: "Failed to approve driver" });
    }
  });

  app.put('/api/drivers/:id/location', async (req, res) => {
    try {
      const { location } = req.body;
      const driver = await storage.updateDriverLocation(req.params.id, location);
      broadcast({ type: 'driver_location_updated', data: driver });
      res.json(driver);
    } catch (error) {
      console.error("Error updating driver location:", error);
      res.status(500).json({ message: "Failed to update driver location" });
    }
  });

  app.put('/api/drivers/:id/status', async (req, res) => {
    try {
      const { isOnline, isAvailable } = req.body;
      const driver = await storage.updateDriverStatus(req.params.id, isOnline, isAvailable);
      broadcast({ type: 'driver_status_updated', data: driver });
      res.json(driver);
    } catch (error) {
      console.error("Error updating driver status:", error);
      res.status(500).json({ message: "Failed to update driver status" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  return httpServer;
}
