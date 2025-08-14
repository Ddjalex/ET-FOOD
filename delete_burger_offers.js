// Script to delete specific burger offers from MongoDB

import mongoose from 'mongoose';

// Connect to MongoDB using the same connection string
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    // Define the SpecialOffer schema with correct collection name
    const specialOfferSchema = new mongoose.Schema({
      restaurantId: { type: String, required: true },
      offerTitle: { type: String, required: true },
      offerImageURL: { type: String },
      originalPrice: { type: Number, required: true },
      discountedPrice: { type: Number, required: true },
      discountPercentage: { type: Number, required: true },
      isLive: { type: Boolean, default: false }
    }, {
      timestamps: true,
      collection: 'specialOffers'
    });

    const SpecialOffer = mongoose.models.SpecialOffer || mongoose.model('SpecialOffer', specialOfferSchema);

    // Find and delete specific burger offers by ID
    const burgerIds = [
      new mongoose.Types.ObjectId('689dc0de1e9c933b89e20dc0'), 
      new mongoose.Types.ObjectId('689db9152b40389c5b2d1924')
    ];
    
    const burgersToDelete = await SpecialOffer.find({
      _id: { $in: burgerIds }
    });

    console.log('Found burger offers to delete:', burgersToDelete.length);
    burgersToDelete.forEach(offer => {
      console.log(`- ${offer.offerTitle}: ${offer.originalPrice} -> ${offer.discountedPrice} ETB (Save ${offer.originalPrice - offer.discountedPrice} ETB)`);
    });

    // Set offers to not live instead of deleting
    const updateResult = await SpecialOffer.updateMany({
      _id: { $in: burgerIds }
    }, {
      $set: { isLive: false }
    });

    console.log(`Updated ${updateResult.modifiedCount} burger offers to not live`);

    // List all offers to debug
    const allOffers = await SpecialOffer.find({});
    console.log(`Total offers in collection: ${allOffers.length}`);
    
    allOffers.forEach(offer => {
      console.log(`ID: ${offer._id}, Title: ${offer.offerTitle}, Live: ${offer.isLive}, Price: ${offer.discountedPrice}`);
    });
    
    // Verify remaining live offers
    const remainingOffers = await SpecialOffer.find({ isLive: true });
    console.log(`Remaining live offers: ${remainingOffers.length}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();