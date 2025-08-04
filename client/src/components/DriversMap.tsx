import { useEffect } from 'react';
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
  userId: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  isOnline: boolean;
  isAvailable: boolean;
  isApproved: boolean;
  vehicleType: string;
  vehiclePlate: string;
  user?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
}

interface DriversMapProps {
  drivers: Driver[];
  className?: string;
}

export default function DriversMap({ drivers, className = '' }: DriversMapProps) {
  // Default center (Addis Ababa, Ethiopia)
  const defaultCenter: [number, number] = [9.0155, 38.7635];

  // Filter drivers with valid locations
  const driversWithLocation = drivers.filter(
    driver => driver.currentLocation && 
    driver.currentLocation.lat && 
    driver.currentLocation.lng &&
    driver.isApproved
  );

  return (
    <div className={`h-96 w-full rounded-lg overflow-hidden border ${className}`}>
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
            position={[driver.currentLocation!.lat, driver.currentLocation!.lng]}
            icon={driver.isOnline ? onlineDriverIcon : offlineDriverIcon}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">
                  {driver.user?.firstName} {driver.user?.lastName}
                </div>
                <div className="text-xs text-gray-600">
                  {driver.vehicleType} - {driver.vehiclePlate}
                </div>
                <div className="text-xs text-gray-600">
                  Phone: {driver.user?.phoneNumber}
                </div>
                <div className="text-xs mt-1">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                    driver.isOnline ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  {driver.isOnline ? 'Online' : 'Offline'}
                  {driver.isAvailable && driver.isOnline && (
                    <span className="ml-2 text-green-600">Available</span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}