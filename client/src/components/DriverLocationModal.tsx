import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bicycle icon for drivers
const bicycleIcon = new DivIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #10B981, #059669);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
    ">
      🚲
    </div>
  `,
  className: 'custom-bicycle-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

// Offline bicycle icon
const offlineBicycleIcon = new DivIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #EF4444, #DC2626);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
    ">
      🚲
    </div>
  `,
  className: 'custom-bicycle-marker-offline',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

interface Driver {
  id: string;
  name?: string;
  phoneNumber?: string;
  isOnline: boolean;
  isAvailable: boolean;
  vehicleType?: string;
  currentLocation?: {
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
  } | [number, number];
  user?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
}

interface DriverLocationModalProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DriverLocationModal: React.FC<DriverLocationModalProps> = ({ 
  driver, 
  isOpen, 
  onClose 
}) => {
  if (!driver || !driver.currentLocation) {
    return null;
  }

  // Helper function to extract coordinates from various formats
  const getCoordinates = (location: any): [number, number] | null => {
    if (!location) return null;
    
    // Handle array format [lat, lng]
    if (Array.isArray(location) && location.length === 2) {
      const lat = Number(location[0]);
      const lng = Number(location[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
    
    // Handle object format with lat/lng or latitude/longitude
    if (typeof location === 'object') {
      const lat = Number(location.lat || location.latitude);
      const lng = Number(location.lng || location.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
    
    return null;
  };

  const coordinates = getCoordinates(driver.currentLocation);
  if (!coordinates) {
    return null;
  }

  const driverName = driver.name || 
    (driver.user?.firstName && driver.user?.lastName 
      ? `${driver.user.firstName} ${driver.user.lastName}`
      : driver.user?.firstName || driver.user?.lastName || 'Unknown Driver');

  const driverPosition: [number, number] = coordinates;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              🚲
            </div>
            <div>
              <h3 className="text-xl font-bold">{driverName}</h3>
              <p className="text-sm text-gray-500">Real-time Location on OpenStreetMap</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Driver Status */}
          <div className="flex items-center gap-2">
            <Badge variant={driver.isOnline ? 'default' : 'secondary'}>
              {driver.isOnline ? '🟢 Online' : '🔴 Offline'}
            </Badge>
            {driver.isOnline && driver.isAvailable && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Available for orders
              </Badge>
            )}
            <Badge variant="outline" className="bg-gray-50 text-gray-700">
              {driver.vehicleType || 'Bicycle'} 🚲
            </Badge>
          </div>

          {/* Map Container */}
          <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
              center={driverPosition}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <Marker
                position={driverPosition}
                icon={driver.isOnline ? bicycleIcon : offlineBicycleIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold text-lg mb-2">
                      {driverName}
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-600">
                        📱 {driver.phoneNumber || driver.user?.phoneNumber || 'No phone'}
                      </div>
                      <div className="text-gray-600">
                        🚲 {driver.vehicleType || 'Bicycle'}
                      </div>
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          driver.isOnline 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {driver.isOnline ? '🟢 Online' : '🔴 Offline'}
                        </span>
                        {driver.isOnline && (
                          <span className={`ml-1 inline-block px-2 py-1 text-xs rounded-full ${
                            driver.isAvailable 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {driver.isAvailable ? 'Available' : 'Busy'}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        📍 {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Location Details - Simplified */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                📍 Location Details
              </h4>
              <div className="text-xs text-gray-500 font-mono">
                {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                Status: {driver.isOnline ? 'Live tracking active' : 'Location not active'}
              </span>
              <span className="text-gray-600">
                Vehicle: {driver.vehicleType || 'Bicycle'} 🚲
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};