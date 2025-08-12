import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: String, required: true },
  quantity: { type: Number, required: true },
  imageUrl: { type: String },
  specialInstructions: { type: String }
});

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  customerName: { type: String },
  customerPhone: { type: String },
  restaurantId: { type: String, required: true },
  restaurantName: { type: String },
  driverId: { type: String }, // Driver assignment field
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  totalAmount: { type: Number }, // Alternative total field
  deliveryFee: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  deliveryAddress: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    phoneNumber: { type: String, required: true }
  },
  // Human-readable address names for better UX
  restaurantAddressName: { type: String },
  customerAddressName: { type: String },
  paymentMethod: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'ready_for_pickup', 'assigned', 'driver_assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  specialInstructions: { type: String },
  estimatedDeliveryTime: { type: Date },
  actualDeliveryTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  // Explicitly use only _id and prevent creation of custom id field
  _id: true,
  id: false,
  // Use a different collection name to avoid conflicts
  collection: 'beu_orders'
});

// Update the updatedAt field before saving
OrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Order = mongoose.model('Order', OrderSchema);