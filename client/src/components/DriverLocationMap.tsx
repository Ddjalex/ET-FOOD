import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom driver icon
const driverIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMyNTYzZWIiLz4KPHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI1IiB5PSI1Ij4KPHBhdGggZD0iTTggNmgxdjEySDh6TTEwIDEwaDEuNXYySDEwek0xMyA2aDF2MTJoLTF6IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

const onlineDriverIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMyMmM1NWUiLz4KPHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI1IiB5PSI1Ij4KPHBhdGggZD0iTTggNmgxdjEySDh6TTEwIDEwaDEuNXYySDEwek0xMyA2aDF2MTJoLTF6IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

interface Driver {
  id: string;
  name: string;
  phoneNumber: string;
  isOnline: boolean;
  isAvailable: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp?: string;
  };
  rating: string;
  totalDeliveries: number;
  vehicleType: string;
  vehiclePlate: string;
}

interface DriverLocationMapProps {
  drivers: Driver[];
  height?: string;
}

export const DriverLocationMap: React.FC<DriverLocationMapProps> = ({ 
  drivers, 
  height = '400px' 
}) => {
  const mapRef = useRef<L.Map>(null);
  
  // Filter drivers with valid locations
  const driversWithLocation = drivers.filter(
    driver => driver.currentLocation && 
    typeof driver.currentLocation.latitude === 'number' && 
    typeof driver.currentLocation.longitude === 'number'
  );

  // Default center - Addis Ababa, Ethiopia
  const defaultCenter: [number, number] = [9.0320, 38.7469];
  
  // Calculate map bounds if there are drivers with locations
  const bounds = driversWithLocation.length > 0 
    ? driversWithLocation.map(driver => [
        driver.currentLocation!.latitude, 
        driver.currentLocation!.longitude
      ] as [number, number])
    : [defaultCenter];

  useEffect(() => {
    if (mapRef.current && driversWithLocation.length > 0) {
      const leafletBounds = L.latLngBounds(bounds);
      mapRef.current.fitBounds(leafletBounds, { padding: [20, 20] });
    }
  }, [driversWithLocation.length]);

  return (
    <div className="relative" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {driversWithLocation.map((driver) => (
          <Marker
            key={driver.id}
            position={[driver.currentLocation!.latitude, driver.currentLocation!.longitude]}
            icon={driver.isOnline ? onlineDriverIcon : driverIcon}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-lg mb-2">{driver.name}</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Phone:</strong> {driver.phoneNumber}</p>
                  <p><strong>Vehicle:</strong> {driver.vehicleType} ({driver.vehiclePlate})</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                      driver.isOnline 
                        ? driver.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {driver.isOnline 
                        ? driver.isAvailable 
                          ? 'Online & Available' 
                          : 'Online & Busy'
                        : 'Offline'
                      }
                    </span>
                  </p>
                  <p><strong>Rating:</strong> {driver.rating}⭐ ({driver.totalDeliveries} deliveries)</p>
                  {driver.currentLocation?.timestamp && (
                    <p><strong>Last Updated:</strong> {new Date(driver.currentLocation.timestamp).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md z-[1000] text-sm">
        <h4 className="font-semibold mb-2">Driver Status</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Online & Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Offline</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Total Drivers: {drivers.length}<br/>
            With Location: {driversWithLocation.length}
          </p>
        </div>
      </div>
    </div>
  );
};