import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MapPin, User, Phone, LogOut, RefreshCw, Store } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import SpecialOffersSlider from '@/components/SpecialOffersSlider';

interface Customer {
  userId: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rating: string;
  deliveryTime: string;
  deliveryFee: string;
  minimumOrder: string;
}

interface CustomerOrderProps {
  customer: Customer;
  onLogout: () => void;
}

export function CustomerOrder({ customer, onLogout }: CustomerOrderProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  // Fetch restaurants
  const { data: restaurants = [], isLoading: isLoadingRestaurants, refetch: refetchRestaurants } = useQuery({
    queryKey: ['/api/telegram/restaurants'],
    enabled: !!location, // Only fetch when location is available
  });

  // Request location on component mount
  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);

    try {
      // Check if Telegram WebApp location is available
      if ((window as any).Telegram?.WebApp) {
        const webApp = (window as any).Telegram.WebApp;
        
        // Try to use Telegram's location API first
        if (webApp.LocationManager) {
          webApp.LocationManager.getLocation((locationData: any) => {
            if (locationData.latitude && locationData.longitude) {
              const newLocation = {
                lat: locationData.latitude,
                lng: locationData.longitude
              };
              setLocation(newLocation);
              console.log('✅ Location from Telegram WebApp:', newLocation);
              toast({
                title: "Location obtained",
                description: "Your location has been detected successfully",
              });
              setIsGettingLocation(false);
              return;
            }
          });
        }
      }

      // Fallback to browser geolocation
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setLocation(newLocation);
      console.log('✅ Location from browser:', newLocation);
      
      toast({
        title: "Location obtained",
        description: "Your location has been detected successfully",
      });

    } catch (error: any) {
      console.error('❌ Error getting location:', error);
      
      let errorMessage = 'Unable to get your location';
      
      if (error.code === 1) {
        errorMessage = 'Location access denied. Please enable location services and refresh.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please check your GPS settings.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timeout. Please try again.';
      }
      
      setLocationError(errorMessage);
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    console.log('Selected restaurant:', restaurant);
    // Here you would navigate to the restaurant menu or handle restaurant selection
    toast({
      title: "Restaurant selected",
      description: `You selected ${restaurant.name}`,
    });
  };

  const handleOfferAddToCart = (offer: any) => {
    toast({
      title: "Added to Cart",
      description: `${offer.offerTitle} has been added to your cart!`,
    });
    console.log('Special offer added to cart:', offer);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Customer Info Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <div>
                <CardTitle className="text-lg">
                  Hello, {customer.firstName}!
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {customer.phoneNumber}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Location Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Your Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isGettingLocation ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Getting your location...
            </div>
          ) : location ? (
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                Location detected
              </Badge>
              <p className="text-sm text-muted-foreground">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </p>
              <Button variant="outline" size="sm" onClick={requestLocation}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Location
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {locationError && (
                <div className="p-3 bg-destructive/10 rounded-md">
                  <p className="text-sm text-destructive">{locationError}</p>
                </div>
              )}
              <Button onClick={requestLocation} variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Enable Location
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Special Offers Slider */}
      <SpecialOffersSlider onAddToCart={handleOfferAddToCart} />

      {/* Restaurants List */}
      {location && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Available Restaurants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRestaurants ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading restaurants...
              </div>
            ) : restaurants.length > 0 ? (
              <div className="grid gap-4">
                {restaurants.map((restaurant: Restaurant) => (
                  <Card 
                    key={restaurant.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleRestaurantSelect(restaurant)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {restaurant.imageUrl && (
                          <img 
                            src={restaurant.imageUrl} 
                            alt={restaurant.name}
                            className="w-16 h-16 rounded-md object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{restaurant.name}</h3>
                          {restaurant.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {restaurant.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <Badge variant="secondary">
                              ★ {restaurant.rating || 'N/A'}
                            </Badge>
                            <span className="text-muted-foreground">
                              {restaurant.deliveryTime || '30-45 min'}
                            </span>
                            <span className="text-muted-foreground">
                              Min: {restaurant.minimumOrder || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium mb-2">No restaurants found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  There are no restaurants available in your area at the moment.
                </p>
                <Button variant="outline" onClick={() => refetchRestaurants()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}