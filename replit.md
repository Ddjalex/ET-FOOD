# BeU Delivery System

## Overview
BeU Delivery is a comprehensive food delivery platform inspired by Ethiopia's delivery ecosystem, built around Telegram. It connects restaurants, drivers, and customers through interconnected dashboards and a Telegram bot interface. Key capabilities include real-time order tracking, driver management, restaurant administration, and seamless integration with Telegram Mini Web Apps. The project aims to provide a full-stack solution for efficient food delivery with a vision to enhance local delivery services and support small businesses.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend utilizes **React with TypeScript** and **Vite**, leveraging **shadcn/ui components** built on **Radix UI primitives** for consistent design and accessibility. Styling is handled by **Tailwind CSS**. The design focuses on intuitive interfaces for customers, drivers, and restaurant staff, including interactive order cards for drivers and streamlined credit management for superadmins.

### Technical Implementations
The system features real-time order tracking, automated real-time driver assignment based on proximity, and phase-based navigation for drivers using OpenStreetMap data. It supports a comprehensive driver credit system for financial management, including Cash-on-Delivery (COD) order support with automatic credit deduction and distance-based delivery fee calculation. Location sharing for drivers is integrated natively with Telegram's live location feature, automating their online/offline status. Reverse geocoding converts coordinates to human-readable addresses, including support for local languages.

### Feature Specifications
Key features include:
- **Order Management**: Real-time order status updates, preparation notifications, and assignment.
- **Driver Management**: Automated assignment, real-time location tracking, credit management, and performance history.
- **Restaurant Administration**: Order oversight, menu management, and special offers creation.
- **Customer Experience**: Telegram bot ordering, real-time notifications, and an intuitive Mini Web App.
- **Special Offers System**: Kitchen staff management panel for creating and activating promotional offers, displayed to customers via a slider.

### System Design Choices
The architecture is component-based, utilizing `wouter` for lightweight client-side routing. Real-time communication is established via WebSockets for targeted notifications. Authentication is session-based with role-based access control. The backend is built with **Node.js and Express.js**, providing RESTful APIs and WebSocket support. A dedicated service layer separates business logic for orders, drivers, and restaurants.

## External Dependencies

### Core Frameworks & Libraries
- **React + TypeScript**: Frontend development
- **Express.js**: Backend web server
- **Node.js**: Backend runtime environment
- **Telegraf.js**: Telegram Bot API framework

### Database
- **MongoDB**: Primary NoSQL database (with existing production data, managed with Mongoose ODM)

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **Lucide Icons**: Icon library

### State Management and Data Handling
- **TanStack React Query**: Server state management
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation
- **Multer**: Multipart form data handling

### Real-time Communication
- **WebSocket (ws)**: Bidirectional communication
- **Socket.IO**: Enhanced WebSocket support

### Authentication and Security
- **Replit Auth**: OAuth authentication
- **express-session**: Session management
- **Passport.js**: Authentication middleware

### Mapping and Geocoding
- **OpenStreetMap Nominatim API**: For reverse geocoding and navigation data