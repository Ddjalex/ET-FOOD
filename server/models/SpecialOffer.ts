import mongoose from 'mongoose';

const SpecialOfferSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true },
  offerTitle: { type: String, required: true },
  offerImageURL: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  discountedPrice: { type: Number, required: true },
  discountPercentage: { type: Number, required: true },
  isLive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'specialOffers'
});

// Update the updatedAt field before saving
SpecialOfferSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const SpecialOffer = mongoose.model('SpecialOffer', SpecialOfferSchema);