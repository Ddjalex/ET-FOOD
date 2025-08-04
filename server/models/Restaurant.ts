import mongoose, { Schema, Document } from 'mongoose';

export interface IRestaurant extends Document {
  _id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  isApproved: boolean;
  rating: string;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: String,
  description: String,
  imageUrl: String,
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  rating: { type: String, default: '0.00' },
  totalOrders: { type: Number, default: 0 },
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

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);