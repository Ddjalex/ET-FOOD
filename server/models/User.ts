import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: 'superadmin' | 'restaurant_admin' | 'kitchen_staff' | 'driver' | 'customer';
  phoneNumber?: string;
  telegramUserId?: string;
  telegramUsername?: string;
  password?: string;
  isActive: boolean;
  restaurantId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, sparse: true, unique: true },
  firstName: String,
  lastName: String,
  profileImageUrl: String,
  role: {
    type: String,
    enum: ['superadmin', 'restaurant_admin', 'kitchen_staff', 'driver', 'customer'],
    required: true
  },
  phoneNumber: String,
  telegramUserId: { type: String, sparse: true, unique: true },
  telegramUsername: String,
  password: String,
  isActive: { type: Boolean, default: true },
  restaurantId: String,
  createdBy: String,
}, {
  timestamps: true
});

// Ensure no 'id' field index exists that conflicts with _id
UserSchema.index({}, { background: true });

export const User = mongoose.model<IUser>('User', UserSchema);