import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuCategory extends Document {
  restaurantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

const MenuCategorySchema: Schema = new Schema({
  restaurantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Add compound index for restaurant and sort order
MenuCategorySchema.index({ restaurantId: 1, sortOrder: 1 });

export const MenuCategory = mongoose.model<IMenuCategory>('MenuCategory', MenuCategorySchema);