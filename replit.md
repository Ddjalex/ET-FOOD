# BeU Delivery System

## Overview
BeU Delivery is a comprehensive food delivery platform inspired by Ethiopia's delivery ecosystem, built around Telegram. It connects restaurants, drivers, and customers through interconnected dashboards and a Telegram bot interface. Key capabilities include real-time order tracking, driver management, restaurant administration, and seamless integration with Telegram Mini Web Apps. The project aims to provide a full-stack solution for efficient food delivery.

**Migration Status**: ✅ Successfully migrated from Replit Agent to standard Replit environment (August 2025). All systems operational including Telegram bots (Enbela_bot for customers, EnbelaDriver_bot for drivers), database connections, real-time features, and broadcast messaging functionality. Final migration completed with bot tokens configured and all broadcast features working properly. **Migration verified and completed August 8, 2025** - All services running successfully in standard Replit environment with bot tokens properly configured.

**Real-Time Driver Notification Enhancement (August 7, 2025)**: ✅ Implemented enhanced real-time notification system for "Start Preparing" event. When kitchen staff click "Start Preparing", the system now automatically finds nearest available driver, assigns the order, and sends immediate real-time WebSocket notification to driver's app. Driver app enhanced with visual popup notifications, sound alerts, and proper socket authentication for reliable message delivery.

**Broadcast Issue Fully Resolved (August 7, 2025)**: ✅ Customer broadcast messages now working correctly after implementing comprehensive fake customer replacement system. Fixed core issue where customers had fake telegram IDs (999991, 999992) that don't correspond to real Telegram users. Implemented debug endpoint `/api/debug/replace-fake-customers` to replace fake customers with real telegram user (383870190). Both customer and driver broadcasts confirmed fully operational with actual telegram user receiving messages.

**Latest Feature Implementation (August 6, 2025)**:
- ✅ **OpenStreetMap Navigation System**: Implemented comprehensive turn-by-turn navigation for drivers using OpenStreetMap data
- ✅ **Automated Real-Time Driver Assignment**: Orders automatically trigger driver assignment when marked as "ready"
- ✅ **Phase-Based Navigation**: Phase 1 (to restaurant), Phase 2 (to customer) with clear UI indicators
- ✅ **Enhanced Real-Time Notifications**: Targeted WebSocket notifications for drivers, customers, and restaurants
- ✅ **Mobile-First Navigation**: Smart detection for mobile map apps with web fallback
- ✅ **Security Enhancement**: Maintained strict driver visibility restrictions for restaurant admins

## Recent Updates (August 2025)
- **OpenStreetMap Integration**: Full navigation system using OSM data with mobile app integration (Maps.me) and web fallback
- **Automated Driver Assignment**: Real-time workflow triggered when kitchen staff mark orders as "ready"
- **Enhanced Driver Experience**: Phase indicators, address information, and improved navigation buttons
- **Real-Time Communication**: Targeted notifications for order status changes, driver assignments, and delivery updates
- **WebSocket Enhancement**: Driver-specific rooms and targeted broadcasting for better performance
- **Navigation Features**: Current location detection, turn-by-turn directions, and multi-platform support
- **Driver Management Improvements (August 7, 2025)**: Fixed MongoDB aggregation for proper driver data display, removed vehicle information from management panel, enhanced profile picture support, and resolved broadcast functionality errors
- **Broadcast Messages Fix (August 7, 2025)**: Fixed broadcast messages functionality by correcting domain configuration for Replit environment (REPLIT_DEV_DOMAIN)
- **Customer Broadcast Resolution (August 7, 2025)**: Resolved customer broadcast issue by replacing fake customers with real telegram users, implemented comprehensive fake customer replacement system, added `deleteUser` method to storage interface, and verified both customer and driver broadcasts work correctly with real telegram user (383870190)
- **Kitchen Staff Dashboard Fix (August 7, 2025)**: Fixed "Start Prepare" button functionality by correcting order status logic - button now appears for 'confirmed' orders instead of 'preparing' orders, enhanced real-time notifications for both customers and drivers when orders are prepared and ready for pickup
- **Enhanced Driver Assignment (August 7, 2025)**: Improved "Start Preparing" workflow to automatically find and assign nearest available driver when order preparation begins, implemented immediate WebSocket notifications to driver app with visual popups and sound alerts, added proper socket authentication for reliable real-time communication

**Interactive Driver Order Notification System Completed (August 7, 2025)**: ✅ Successfully overhauled the driver notification system from simple text popups to fully interactive order cards. Removed all legacy notification broadcasts that were interfering with the enhanced system. Implemented comprehensive interactive modal with OpenStreetMap integration, accept/reject API endpoints, distance calculations, and proper order data structures. System now sends detailed order objects with all necessary information (orderId, customerName, restaurantName, locations, status) enabling rich driver interactions through the mini web app interface.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application uses **React with TypeScript** and **Vite**, leveraging **shadcn/ui components** built on **Radix UI primitives** for consistent design. Styling is handled by **Tailwind CSS**. It employs a component-based architecture, `wouter` for lightweight client-side routing, and combines React Query for server state with React Context for local state. Real-time communication is established via WebSockets, and authentication uses session-based control with role-based access.

### Backend Architecture
The server is built with **Node.js and Express.js**, providing RESTful APIs and WebSocket support. It utilizes **PostgreSQL with Drizzle ORM** for database operations, Replit Auth for authentication with `connect-pg-simple` for session management, and Multer for file uploads. A dedicated service layer separates business logic for orders, drivers, and restaurants.

### Database Design
**PostgreSQL** is the primary database, managed with **Drizzle ORM**. Key schema decisions include enum-based user roles, PostGIS point types for geospatial data, status-based order management, and local file system storage for uploads. PostgreSQL also backs session management for authentication.

### Telegram Integration
The platform deeply integrates with Telegram via a **Telegraf.js** bot, featuring role-specific modules for customers and drivers. Complex interactions are handled through **React-based Telegram Mini Web Apps**, and real-time order updates are delivered via bot notifications.

## External Dependencies

### Core Framework Dependencies
- **React + TypeScript**: Frontend development
- **Express.js**: Backend web server
- **Drizzle ORM**: Type-safe PostgreSQL toolkit
- **Neon Database**: Serverless PostgreSQL hosting

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Icons**: Icon library
- **shadcn/ui**: Pre-built component library

### State Management and Data Fetching
- **TanStack React Query**: Server state management
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation

### Real-time and Communication
- **WebSocket (ws)**: Bidirectional communication
- **Socket.IO**: Enhanced WebSocket support
- **Telegraf.js**: Telegram Bot API framework

### Authentication and Security
- **Replit Auth**: OAuth authentication
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store
- **Passport.js**: Authentication middleware

### File Handling and Storage
- **Multer**: Multipart form data handling
- **Local file system**: Document storage

### Development and Build Tools
- **Vite**: Fast development server and build tool
- **esbuild**: Fast JavaScript bundler
- **TypeScript**: Static type checking
- **ESLint + Prettier**: Code formatting and linting

### Database and Migrations
- **drizzle-kit**: Database migration and schema management
- **PostgreSQL**: Primary relational database