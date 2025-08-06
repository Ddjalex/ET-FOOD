import React from 'react';

interface Driver {
  id: string;
  name: string;
  phoneNumber: string;
  isOnline: boolean;
  isAvailable: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
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
  const onlineDrivers = drivers.filter(d => d.currentLocation);

  return (
    <div 
      className="bg-gray-100 rounded-lg flex items-center justify-center"
      style={{ height }}
    >
      <div className="text-center">
        <div className="text-gray-500 mb-2">
          📍 Interactive Map Coming Soon
        </div>
        <div className="text-sm text-gray-400">
          {onlineDrivers.length} drivers with location data
        </div>
        <div className="mt-4 space-y-1">
          {onlineDrivers.slice(0, 3).map(driver => (
            <div key={driver.id} className="text-xs text-gray-500">
              {driver.name}: {driver.currentLocation?.latitude.toFixed(4)}, {driver.currentLocation?.longitude.toFixed(4)}
            </div>
          ))}
          {onlineDrivers.length > 3 && (
            <div className="text-xs text-gray-400">
              +{onlineDrivers.length - 3} more drivers
            </div>
          )}
        </div>
      </div>
    </div>
  );
};