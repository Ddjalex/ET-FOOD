import mongoose, { Schema, Document } from 'mongoose';

export interface IDriver extends Document {
  _id: string;
  userId: string;
  licenseNumber: string;
  vehicleType: string;
  vehiclePlate: string;
  licenseImageUrl?: string;
  vehicleImageUrl?: string;
  idCardImageUrl?: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  isOnline: boolean;
  isAvailable: boolean;
  isApproved: boolean;
  rating: string;
  totalDeliveries: number;
  totalEarnings: string;
  zone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>({
  userId: { type: String, required: true, unique: true },
  licenseNumber: { type: String, required: true },
  vehicleType: { type: String, required: true },
  vehiclePlate: { type: String, required: true },
  licenseImageUrl: String,
  vehicleImageUrl: String,
  idCardImageUrl: String,
  currentLocation: {
    lat: Number,
    lng: Number
  },
  isOnline: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  rating: { type: String, default: '0.00' },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: String, default: '0.00' },
  zone: String,
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