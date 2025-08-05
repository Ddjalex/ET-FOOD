# BeU Delivery System

## Overview

BeU Delivery is a comprehensive food delivery platform inspired by Ethiopia's delivery ecosystem, built around Telegram's messaging platform. The system provides a full-stack solution connecting restaurants, drivers, and customers through multiple interconnected dashboards and a Telegram bot interface. The platform features real-time order tracking, driver management, restaurant administration, and seamless integration with Telegram Mini Web Apps for enhanced user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application is built using **React with TypeScript** and **Vite** as the build tool. The UI framework leverages **shadcn/ui components** built on top of **Radix UI primitives** for consistent, accessible design patterns. The styling is implemented using **Tailwind CSS** with custom CSS variables for theming.

**Key architectural decisions:**
- **Component-based architecture**: Reusable UI components organized in `/components/ui/` with custom business logic components in `/components/`
- **Client-side routing**: Uses `wouter` for lightweight routing without the complexity of React Router
- **State management**: Combines React Query (TanStack Query) for server state and React Context for local state management
- **Real-time communication**: WebSocket integration for live updates across dashboards
- **Authentication flow**: Session-based authentication with role-based access control

### Backend Architecture
The server is built on **Node.js with Express.js** framework, providing RESTful APIs and WebSocket support for real-time features.

**Core backend components:**
- **Database layer**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with session management using connect-pg-simple
- **File uploads**: Multer middleware for handling driver documents and restaurant images
- **Real-time features**: WebSocket server for order updates and dashboard notifications
- **Service layer**: Dedicated services for orders, drivers, and restaurants with business logic separation

### Database Design
Uses **PostgreSQL** as the primary database with **Drizzle ORM** for schema management and migrations.

**Key schema decisions:**
- **User roles**: Enum-based role system (superadmin, restaurant_admin, kitchen_staff, driver, customer)
- **Geospatial data**: PostGIS point types for location tracking and driver positioning
- **Order lifecycle**: Status-based order management with audit trails
- **File storage**: Local file system with organized directory structure for uploads
- **Session management**: PostgreSQL-backed session storage for authentication persistence

**Recent Changes (August 2025):**
- **Project Migration to Standard Replit Environment Completed**: Successfully migrated from Replit Agent to standard Replit environment with full functionality restored
- **Order Creation System Fixed**: Resolved MongoDB connection issues in storage layer, fixed data type mismatches, and verified order placement functionality works correctly
- **Telegram Bot Integration Verified**: Both customer and driver bots are running successfully with proper environment variable configuration
- **Environment Variables Configured**: Set up secure secret management with SESSION_SECRET, AUTH_SECRET, and Telegram bot tokens
- **Telegram Bots Activated**: Customer bot (Enbela_bot) and Driver bot (EnbelaDriver_bot) are now running successfully
- **MongoDB Integration**: Successfully integrated MongoDB database using connection string mongodb+srv://almeseged:A1l2m3e4s5@cluster0.t6sz6bo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
- **Telegram Mini Web App Implementation**: 
  - Built comprehensive Telegram Mini Web App with contact/location sharing
  - Implemented restaurant browsing, menu display, and shopping cart functionality
  - Created seamless ordering flow with checkout process
  - Added session management between Telegram bot and Mini Web App
  - Integrated customer location sharing and order placement workflow
  - **FIXED HTTPS Issue**: Resolved Telegram Mini Web App URL error by using proper HTTPS domain instead of localhost
  - **Real Restaurant Data Integration**: Connected Mini Web App to display actual restaurants from database instead of mock data
  - **Menu Items Display**: Successfully showing real menu items from Flavour Cafe, Rich Cafe, and WINA JUICE restaurants
- **Order Flow Implementation**: Added complete order submission API endpoint with real-time kitchen staff notifications
- **WebSocket Integration**: Implemented real-time notifications for kitchen staff when customers place orders through Mini Web App
- **Critical Data Isolation Bug Fixed**: 
  - Fixed restaurant staff creation endpoint to use correct restaurant ID from URL parameter
  - Previously all staff were being assigned to superadmin's restaurant due to using user.restaurantId instead of req.params.restaurantId
  - Data isolation between restaurants now properly maintained
- **Authentication System Fixed**: 
  - Created alm@gmail.com superadmin user with password: beu123
  - Created default superadmin@beu-delivery.com with password: superadmin123
  - Fixed TypeScript errors in authentication routes and middleware
- **Kitchen Staff Login System**: 
  - Created separate kitchen staff login page at /kitchen-login route
  - Added dedicated routing and authentication for kitchen staff
  - Fixed role-based access control for kitchen dashboard
- **Restaurant Creation System**: 
  - Fixed restaurant creation API endpoint (/api/superadmin/restaurants)
  - Enhanced restaurant creation to automatically create restaurant admin users
  - Verified restaurant creation functionality with test data
- **Frontend Fixes**: 
  - Updated CreateRestaurant component to use correct API endpoints
  - Fixed useAdminAuth hook integration in kitchen dashboard
  - Resolved TypeScript type errors across components
- **Storage Architecture**: Implemented MongoDB as primary storage with automatic connection
- **Security Enhancements**: Proper client/server separation maintained during migration
- **Multi-Tenant Data Isolation**: Fixed critical bug ensuring restaurant staff data is properly isolated between restaurants

### Telegram Integration
The platform integrates deeply with Telegram's ecosystem through multiple touchpoints:

**Bot architecture:**
- **Core bot**: Central Telegraf.js bot handling user interactions and command routing
- **Role-specific modules**: Separate bot handlers for customers and drivers with specialized workflows
- **Mini Web Apps**: React applications served as Telegram Web Apps for complex interactions
- **Real-time notifications**: Bot-based order updates and status notifications

### External Dependencies

**Core Framework Dependencies:**
- **React + TypeScript**: Frontend framework with type safety
- **Express.js**: Backend web server framework
- **Drizzle ORM**: Type-safe PostgreSQL database toolkit
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)

**UI and Styling:**
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide Icons**: Icon library (via Radix UI components)
- **shadcn/ui**: Pre-built component library built on Radix UI

**State Management and Data Fetching:**
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema validation

**Real-time and Communication:**
- **WebSocket (ws)**: Real-time bidirectional communication
- **Socket.IO**: Enhanced WebSocket support for dashboard updates
- **Telegraf.js**: Telegram Bot API framework

**Authentication and Security:**
- **Replit Auth**: OAuth-based authentication provider
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store
- **Passport.js**: Authentication middleware

**File Handling and Storage:**
- **Multer**: Multipart form data handling for file uploads
- **Local file system**: Organized directory structure for document storage

**Development and Build Tools:**
- **Vite**: Fast development server and build tool
- **esbuild**: Fast JavaScript bundler for production builds
- **TypeScript**: Static type checking and enhanced developer experience
- **ESLint + Prettier**: Code formatting and linting (configured via package.json)

**Database and Migrations:**
- **drizzle-kit**: Database migration and schema management tool
- **PostgreSQL**: Primary relational database system