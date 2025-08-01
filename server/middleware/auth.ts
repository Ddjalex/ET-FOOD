import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../storage';
import { UserRole, type User } from '@shared/schema';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    user?: User;
  }
}

// Admin login authentication middleware
export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user has admin role
    if (!user.role || !['superadmin', 'restaurant_admin', 'kitchen_staff'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is disabled' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!req.user.role || !roles.includes(req.user.role as string)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Superadmin only middleware
export const requireSuperadmin = requireRole([UserRole.SUPERADMIN]);

// Restaurant admin and above middleware
export const requireRestaurantAdmin = requireRole([UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN]);

// Kitchen staff and above middleware
export const requireKitchenAccess = requireRole([UserRole.SUPERADMIN, UserRole.RESTAURANT_ADMIN, UserRole.KITCHEN_STAFF]);

// Session-based auth check
export const requireSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: 'Please log in' });
  }
  
  req.user = req.session.user;
  next();
};

// Hash password utility
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Verify password utility
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};