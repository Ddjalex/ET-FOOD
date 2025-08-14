import mongoose, { Schema, Document } from 'mongoose';

export interface IDriver extends Document {
  _id: string;
  userId: string;
  telegramId: string;
  phoneNumber: string;
  name: string;
  profileImageUrl?: string;
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
  liveLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  lastLocationUpdate?: Date;
  isBlocked: boolean;
  status: 'pending_approval' | 'active' | 'rejected' | 'inactive';
  isOnline: boolean;
  isAvailable: boolean;
  isApproved: boolean;
  rating: string;
  totalDeliveries: number;
  totalEarnings: string;
  todayEarnings: string;
  weeklyEarnings: string;
  creditBalance: number;
  // Credit request fields
  creditRequestPending: boolean;
  requestedCreditAmount?: number;
  creditRequestScreenshotUrl?: string;
  creditRequestCreatedAt?: Date;
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
  profileImageUrl: String,
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
  liveLocation: {
    lat: Number,
    lng: Number,
    timestamp: String
  },
  lastLocationUpdate: Date,
  status: { 
    type: String, 
    enum: ['pending_approval', 'active', 'rejected', 'inactive'], 
    default: 'pending_approval' 
  },
  isOnline: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  rating: { type: String, default: '0.00' },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: String, default: '0.00' },
  todayEarnings: { type: String, default: '0.00' },
  weeklyEarnings: { type: String, default: '0.00' },
  creditBalance: { type: Number, default: 0 },
  // Credit request fields
  creditRequestPending: { type: Boolean, default: false },
  requestedCreditAmount: Number,
  creditRequestScreenshotUrl: String,
  creditRequestCreatedAt: Date,
  zone: String,
  lastOnline: Date,
}, {
  timestamps: true,
  id: false, // Disable virtual id field
  versionKey: false, // Disable __v field
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      return ret;
    }
  },
  toObject: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      return ret;
    }
  }
});

// Ensure proper unique indexes only
DriverSchema.index({ telegramId: 1 }, { unique: true });
DriverSchema.index({ userId: 1 }, { unique: true });

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
export default Driver;