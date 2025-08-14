import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ShoppingCart, Percent } from 'lucide-react';

interface SpecialOffer {
  _id: string;
  restaurantId: string;
  offerTitle: string;
  offerImageURL: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  isLive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SpecialOffersSliderProps {
  onAddToCart?: (offer: SpecialOffer) => void;
}

export default function SpecialOffersSlider({ onAddToCart }: SpecialOffersSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch live special offers
  const { data: offers = [], isLoading } = useQuery<SpecialOffer[]>({
    queryKey: ['/api/customer/offers'],
    queryFn: async () => {
      const response = await fetch('/api/customer/offers');
      if (!response.ok) throw new Error('Failed to fetch offers');
      const data = await response.json();
      return data.offers;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const handleAddToCart = (offer: SpecialOffer) => {
    if (onAddToCart) {
      onAddToCart(offer);
    } else {
      // Default behavior - could show a toast or redirect
      console.log('Added to cart:', offer);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-6">
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-500">Loading special offers...</span>
        </div>
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return null; // Don't show anything if no offers
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Percent className="h-5 w-5 text-red-500" />
          Special Offers
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={offers.length <= 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={offers.length <= 1}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg">
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {offers.map((offer, index) => (
            <div key={offer._id} className="w-full flex-shrink-0">
              <Card className="overflow-hidden bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Image Section */}
                    <div className="w-1/3 relative">
                      <img
                        src={offer.offerImageURL}
                        alt={offer.offerTitle}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-red-500 text-white font-bold">
                          {offer.discountPercentage}% OFF
                        </Badge>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="w-2/3 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                          {offer.offerTitle}
                        </h3>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm line-through text-gray-500">
                            ${offer.originalPrice.toFixed(2)}
                          </span>
                          <span className="text-xl font-bold text-green-600">
                            ${offer.discountedPrice.toFixed(2)}
                          </span>
                          <span className="text-sm text-green-600 font-medium">
                            Save ${(offer.originalPrice - offer.discountedPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Limited time offer
                        </div>
                        <Button
                          onClick={() => handleAddToCart(offer)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Order Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      {offers.length > 1 && (
        <div className="flex justify-center mt-3 gap-1">
          {offers.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-red-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}

      {/* Auto-scroll for multiple offers */}
      {offers.length > 1 && (
        <div className="text-xs text-center text-gray-500 mt-2">
          Swipe or use arrows to see more offers
        </div>
      )}
    </div>
  );
}