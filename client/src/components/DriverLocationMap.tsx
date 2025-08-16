import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom driver icons
const onlineDriverIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const offlineDriverIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Driver {
  id: string;
  name?: string;
  phoneNumber?: string;
  isOnline: boolean;
  isAvailable: boolean;
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

interface DriverLocationMapProps {
  drivers: Driver[];
  height?: string;
}

export const DriverLocationMap: React.FC<DriverLocationMapProps> = ({ 
  drivers, 
  height = '400px' 
}) => {
  // Default center (Addis Ababa, Ethiopia)
  const defaultCenter: [number, number] = [9.0155, 38.7635];

  // Helper function to extract coordinates from various formats
  const getDriverCoordinates = (location: any): [number, number] | null => {
    if (!location) return null;
    
    // Handle array format [lat, lng]
    if (Array.isArray(location) && location.length === 2) {
      const lat = Number(location[0]);
      const lng = Number(location[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return [lat, lng];
      }
    }
    
    // Handle object format with lat/lng or latitude/longitude
    if (typeof location === 'object') {
      const lat = Number(location.lat || location.latitude);
      const lng = Number(location.lng || location.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return [lat, lng];
      }
    }
    
    return null;
  };

  // Filter drivers with valid locations
  const driversWithLocation = drivers.filter(d => {
    const coords = getDriverCoordinates(d.currentLocation);
    return coords !== null;
  }).map(d => ({
    ...d,
    coordinates: getDriverCoordinates(d.currentLocation)!
  })) as (Driver & { coordinates: [number, number] })[];

  console.log('Total drivers:', drivers.length);
  console.log('Drivers with valid location:', driversWithLocation.length);
  if (driversWithLocation.length > 0) {
    console.log('First driver with location:', driversWithLocation[0]);
  }

  return (
    <div 
      className="w-full rounded-lg overflow-hidden border border-gray-200"
      style={{ height }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {driversWithLocation.map((driver) => (
          <Marker
            key={driver.id}
            position={driver.coordinates}
            icon={driver.isOnline ? onlineDriverIcon : offlineDriverIcon}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">
                  {driver.name || `${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`.trim() || 'Driver'}
                </div>
                <div className="text-gray-600">
                  {driver.phoneNumber || driver.user?.phoneNumber || 'No phone'}
                </div>
                <div className="mt-1">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    driver.isOnline 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {driver.isOnline ? 'Online' : 'Offline'}
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
                <div className="mt-1 text-xs text-gray-500">
                  {driver.coordinates[0].toFixed(4)}, {driver.coordinates[1].toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      
    </div>
  );
};