import mongoose from 'mongoose';

const CommissionSettingsSchema = new mongoose.Schema({
  restaurantCommissionRate: { type: Number, required: true, default: 15 }, // Default 15% commission from restaurants
  driverCommissionRate: { type: Number, required: true, default: 5 }, // Default 5% commission from drivers
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String, required: true }, // Admin user ID who updated settings
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'commission_settings'
});

export const CommissionSettings = mongoose.model('CommissionSettings', CommissionSettingsSchema);