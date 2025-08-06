import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Circle, Navigation, Clock } from 'lucide-react';
import { DriverLocationMap } from './DriverLocationMap';

interface Driver {
  id: string;
  name: string;
  phoneNumber: string;
  telegramId: string;
  isOnline: boolean;
  isAvailable: boolean;
  isApproved: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  rating: string;
  totalDeliveries: number;
  vehicleType?: string;
  vehiclePlate?: string;
  lastOnline?: string;
}

interface NearbyDriversProps {
  restaurantLocation?: {
    lat: number;
    lng: number;
  };
}

export default function NearbyDrivers({ restaurantLocation }: NearbyDriversProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadDrivers();
    setupWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Filter online and available drivers
    const online = drivers.filter(driver => 
      driver.isOnline && 
      driver.isAvailable && 
      driver.isApproved && 
      driver.currentLocation
    );
    setOnlineDrivers(online);
  }, [drivers]);

  const setupWebSocket = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected for nearby drivers');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle driver status updates
          if (data.type === 'driver_status_updated' && data.data) {
            setDrivers(prevDrivers => 
              prevDrivers.map(driver => 
                driver.id === data.data.id ? { ...driver, ...data.data } : driver
              )
            );
          }
          
          // Handle driver location updates
          if (data.type === 'driver_location_updated' && data.driverId && data.location) {
            setDrivers(prevDrivers => 
              prevDrivers.map(driver => 
                driver.id === data.driverId 
                  ? { 
                      ...driver, 
                      currentLocation: data.location,
                      isOnline: true, // Location update implies driver is online
                      lastOnline: new Date().toISOString()
                    }
                  : driver
              )
            );
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current.onclose = () => {
        console.log('Nearby drivers WebSocket connection closed');
        // Attempt to reconnect after 3 seconds
        setTimeout(setupWebSocket, 3000);
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetch('/api/drivers/nearby', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      console.error('Failed to load nearby drivers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
  };

  const getDriverDistance = (driver: Driver) => {
    if (!driver.currentLocation || !restaurantLocation) {
      return null;
    }
    
    const distance = calculateDistance(
      restaurantLocation.lat,
      restaurantLocation.lng,
      driver.currentLocation.lat,
      driver.currentLocation.lng
    );
    
    return distance;
  };

  const getStatusBadge = (driver: Driver) => {
    if (driver.isOnline && driver.isAvailable) {
      return <Badge className="bg-green-500 hover:bg-green-600 text-white">Available</Badge>;
    }
    if (driver.isOnline) {
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Online</Badge>;
    }
    return <Badge variant="outline">Offline</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Nearby Drivers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold">{drivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Circle className="h-5 w-5 text-green-600 fill-current" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Online Now</p>
                <p className="text-2xl font-bold text-green-600">{onlineDrivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Navigation className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-orange-600">
                  {drivers.filter(d => d.isOnline && d.isAvailable).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Driver Locations Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DriverLocationMap 
            drivers={onlineDrivers.map(driver => ({
              ...driver,
              currentLocation: driver.currentLocation ? {
                latitude: driver.currentLocation.lat,
                longitude: driver.currentLocation.lng
              } : undefined
            }))} 
            height="400px"
          />
        </CardContent>
      </Card>

      {/* Online Drivers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Circle className="h-5 w-5 text-green-500 fill-current" />
              Available Drivers ({onlineDrivers.length})
            </CardTitle>
            <div className="text-sm text-gray-500">
              Real-time updates • Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {onlineDrivers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No drivers available at the moment</p>
              <p className="text-sm">Drivers will appear here when they come online</p>
            </div>
          ) : (
            <div className="space-y-4">
              {onlineDrivers
                .sort((a, b) => {
                  const distanceA = getDriverDistance(a);
                  const distanceB = getDriverDistance(b);
                  if (!distanceA && !distanceB) return 0;
                  if (!distanceA) return 1;
                  if (!distanceB) return -1;
                  return distanceA - distanceB;
                })
                .map((driver) => {
                  const distance = getDriverDistance(driver);
                  return (
                    <div 
                      key={driver.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{driver.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{driver.phoneNumber}</span>
                            {driver.vehicleType && (
                              <>
                                <span>•</span>
                                <span>{driver.vehicleType}</span>
                              </>
                            )}
                            {driver.vehiclePlate && (
                              <>
                                <span>•</span>
                                <span>{driver.vehiclePlate}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(driver)}
                            {distance && (
                              <Badge variant="outline" className="text-xs">
                                {distance.toFixed(1)} km
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ⭐ {driver.rating} • {driver.totalDeliveries} deliveries
                          </div>
                        </div>
                        
                        {driver.lastOnline && (
                          <div className="text-xs text-gray-400">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(driver.lastOnline).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}