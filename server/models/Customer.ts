import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  telegramUserId: {
    type: String,
    required: false
  },
  telegramUsername: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  orderHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  defaultAddress: {
    lat: { type: Number },
    lng: { type: Number },
    addressName: { type: String },
    fullAddress: { type: String }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
customerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Customer = mongoose.model('Customer', customerSchema);