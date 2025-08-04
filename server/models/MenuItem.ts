import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime?: number;
  ingredients: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  spicyLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema: Schema = new Schema({
  restaurantId: { type: String, required: true, index: true },
  categoryId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  isAvailable: { type: Boolean, default: true },
  preparationTime: { type: Number }, // in minutes
  ingredients: [{ type: String }],
  isVegetarian: { type: Boolean, default: false },
  isVegan: { type: Boolean, default: false },
  spicyLevel: { type: Number, default: 0, min: 0, max: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add compound indexes
MenuItemSchema.index({ restaurantId: 1, categoryId: 1 });
MenuItemSchema.index({ restaurantId: 1, isAvailable: 1 });

// Update the updatedAt field before saving
MenuItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);