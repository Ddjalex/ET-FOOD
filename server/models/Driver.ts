import mongoose, { Schema, Document } from 'mongoose';

export interface IDriver extends Document {
  _id: string;
  userId: string;
  telegramId: string;
  phoneNumber: string;
  name: string;
  governmentIdFrontUrl?: string;
  governmentIdBackUrl?: string;
  licenseNumber?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  licenseImageUrl?: string;
  vehicleImageUrl?: string;
  idCardImageUrl?: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  status: 'pending_approval' | 'active' | 'rejected' | 'inactive';
  isOnline: boolean;
  isAvailable: boolean;
  isApproved: boolean;
  rating: string;
  totalDeliveries: number;
  totalEarnings: string;
  todayEarnings: string;
  weeklyEarnings: string;
  zone?: string;
  lastOnline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>({
  userId: { type: String, required: true, unique: true },
  telegramId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  name: { type: String, required: true },
  governmentIdFrontUrl: String,
  governmentIdBackUrl: String,
  licenseNumber: String,
  vehicleType: String,
  vehiclePlate: String,
  licenseImageUrl: String,
  vehicleImageUrl: String,
  idCardImageUrl: String,
  currentLocation: {
    lat: Number,
    lng: Number
  },
  status: { 
    type: String, 
    enum: ['pending_approval', 'active', 'rejected', 'inactive'], 
    default: 'pending_approval' 
  },
  isOnline: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  rating: { type: String, default: '0.00' },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: String, default: '0.00' },
  todayEarnings: { type: String, default: '0.00' },
  weeklyEarnings: { type: String, default: '0.00' },
  zone: String,
  lastOnline: Date,
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
export default Driver;