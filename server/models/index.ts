// MongoDB models - kept for future reference but not used in current implementation
// Current implementation uses in-memory storage for Replit environment compatibility

import mongoose, { Schema, Document } from 'mongoose';

// User Model
export interface IUser extends Document {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: string;
  phoneNumber?: string;
  telegramUserId?: string;
  telegramUsername?: string;
  isActive: boolean;
  restaurantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  email: { type: String, sparse: true },
  firstName: String,
  lastName: String,
  profileImageUrl: String,
  role: { type: String, default: 'customer' },
  phoneNumber: String,
  telegramUserId: { type: String, sparse: true },
  telegramUsername: String,
  isActive: { type: Boolean, default: true },
  restaurantId: String,
}, { timestamps: true });

// Restaurant Model
export interface IRestaurant extends Document {
  id: string;
  name: string;
  description?: string;
  address: string;
  phoneNumber: string;
  email?: string;
  location?: { type: string; coordinates: [number, number] };
  imageUrl?: string;
  isActive: boolean;
  isApproved: boolean;
  rating: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  imageUrl: String,
  isActive: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  rating: { type: Number, default: 0.0 },
  totalOrders: { type: Number, default: 0 },
}, { timestamps: true });

// Menu Category Model
export interface IMenuCategory extends Document {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

const MenuCategorySchema = new Schema<IMenuCategory>({
  id: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

// Menu Item Model
export interface IMenuItem extends Document {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime?: number;
  ingredients?: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  spicyLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>({
  id: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true },
  categoryId: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  imageUrl: String,
  isAvailable: { type: Boolean, default: true },
  preparationTime: Number,
  ingredients: [String],
  isVegetarian: { type: Boolean, default: false },
  isVegan: { type: Boolean, default: false },
  spicyLevel: { type: Number, default: 0 },
}, { timestamps: true });

// Order Model
export interface IOrder extends Document {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  driverId?: string;
  status: string;
  items: any[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  paymentStatus: string;
  paymentMethod?: string;
  deliveryAddress: string;
  deliveryLocation?: { type: string; coordinates: [number, number] };
  customerNotes?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  id: { type: String, required: true, unique: true },
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  restaurantId: { type: String, required: true },
  driverId: String,
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'delivered', 'cancelled'],
    default: 'pending'
  },
  items: { type: [Schema.Types.Mixed], required: true },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: String,
  deliveryAddress: { type: String, required: true },
  deliveryLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  customerNotes: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
}, { timestamps: true });

// Driver Model
export interface IDriver extends Document {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleType: string;
  vehiclePlate: string;
  licenseImageUrl?: string;
  vehicleImageUrl?: string;
  idCardImageUrl?: string;
  currentLocation?: { type: string; coordinates: [number, number] };
  isOnline: boolean;
  isAvailable: boolean;
  isApproved: boolean;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  zone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, unique: true },
  licenseNumber: { type: String, required: true, unique: true },
  vehicleType: { type: String, required: true },
  vehiclePlate: { type: String, required: true },
  licenseImageUrl: String,
  vehicleImageUrl: String,
  idCardImageUrl: String,
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  isOnline: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  rating: { type: Number, default: 0.0 },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0.0 },
  zone: String,
}, { timestamps: true });

// Delivery Model
export interface IDelivery extends Document {
  id: string;
  orderId: string;
  driverId: string;
  status: string;
  pickupTime?: Date;
  deliveryTime?: Date;
  distance?: number;
  earnings?: number;
  tips: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema = new Schema<IDelivery>({
  id: { type: String, required: true, unique: true },
  orderId: { type: String, required: true, unique: true },
  driverId: { type: String, required: true },
  status: {
    type: String,
    enum: ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'],
    default: 'assigned'
  },
  pickupTime: Date,
  deliveryTime: Date,
  distance: Number,
  earnings: Number,
  tips: { type: Number, default: 0 },
  notes: String,
}, { timestamps: true });

// Notification Model
export interface INotification extends Document {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

// Export models
export const User = mongoose.model<IUser>('User', UserSchema);
export const Restaurant = mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
export const MenuCategory = mongoose.model<IMenuCategory>('MenuCategory', MenuCategorySchema);
export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
export const Order = mongoose.model<IOrder>('Order', OrderSchema);
export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
export const Delivery = mongoose.model<IDelivery>('Delivery', DeliverySchema);
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);