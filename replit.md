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
- Successfully migrated from MongoDB to PostgreSQL for Replit compatibility
- Implemented PostgreSQL storage with Drizzle ORM for type-safe database operations
- Fixed security architecture with proper client/server separation
- Resolved frontend component errors (missing Trash icon imports)
- Completed database schema deployment and migration
- Enhanced authentication and session management for Replit environment
- **Latest Update**: Added comprehensive Restaurant Management and Admin Management features
  - Restaurant Management: Edit restaurant details, block/unblock functionality with real-time updates
  - Admin Management: Edit admin user information, block/unblock admin accounts with proper role management
  - Fixed ALEX Wondimu login issue - password successfully updated to "beu123" (alm@gmail.com)
  - Backend API routes implemented for all management operations with MongoDB persistence
  - Enhanced SuperAdmin dashboard with functional edit dialogs and form validation
  - All changes properly saved to MongoDB cluster with immediate UI feedback

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