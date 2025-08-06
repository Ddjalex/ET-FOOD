# BeU Delivery System

## Overview
BeU Delivery is a comprehensive food delivery platform inspired by Ethiopia's delivery ecosystem, built around Telegram. It connects restaurants, drivers, and customers through interconnected dashboards and a Telegram bot interface. Key capabilities include real-time order tracking, driver management, restaurant administration, and seamless integration with Telegram Mini Web Apps. The project aims to provide a full-stack solution for efficient food delivery.

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