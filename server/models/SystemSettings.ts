import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  _id: string;
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  deliveryFee: number;
  maxDeliveryDistance: number;
  orderTimeout: number;
  enableSMSNotifications: boolean;
  enableEmailNotifications: boolean;
  maintenanceMode: boolean;
  companyLogo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
  companyName: { type: String, required: true, default: 'BeU Delivery' },
  supportEmail: { type: String, required: true, default: 'support@beu-delivery.com' },
  supportPhone: { type: String, required: true, default: '+251-911-123456' },
  deliveryFee: { type: Number, required: true, default: 25.00 },
  maxDeliveryDistance: { type: Number, required: true, default: 10 },
  orderTimeout: { type: Number, required: true, default: 30 },
  enableSMSNotifications: { type: Boolean, default: true },
  enableEmailNotifications: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  companyLogo: String,
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

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);