import { MongoStorage } from '../mongoStorage';
import { broadcast } from '../websocket';

export class DriverStatusMonitor {
  private storage: MongoStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly OFFLINE_THRESHOLD_MINUTES = 10; // Consider driver offline after 10 minutes of inactivity

  constructor(storage: MongoStorage) {
    this.storage = storage;
  }

  start() {
    console.log('🔄 Starting driver status monitoring...');
    
    // Check every 2 minutes
    this.intervalId = setInterval(async () => {
      await this.checkDriverStatuses();
    }, 2 * 60 * 1000);
    
    // Run initial check
    this.checkDriverStatuses();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Driver status monitoring stopped');
    }
  }

  private async checkDriverStatuses() {
    try {
      const drivers = await this.storage.getAllDrivers();
      const now = new Date();
      const offlineThreshold = new Date(now.getTime() - (this.OFFLINE_THRESHOLD_MINUTES * 60 * 1000));

      for (const driver of drivers) {
        // Skip if driver is already offline
        if (!driver.isOnline) continue;

        // Check if driver has been inactive
        const lastOnline = driver.lastOnline ? new Date(driver.lastOnline) : new Date(0);
        
        if (lastOnline < offlineThreshold) {
          console.log(`🔴 Setting driver ${driver.name} (${driver.id}) offline due to inactivity`);
          console.log(`Last online: ${lastOnline.toISOString()}, Threshold: ${offlineThreshold.toISOString()}`);
          
          // Update driver to offline status
          await this.storage.updateDriverStatus(driver.id, false, false);
          
          // Broadcast status update to admin dashboards
          broadcast('driver_status_changed', {
            driverId: driver.id,
            name: driver.name,
            isOnline: false,
            isAvailable: false,
            lastOnline: driver.lastOnline
          });
        }
      }
    } catch (error) {
      console.error('❌ Error checking driver statuses:', error);
    }
  }

  // Method to manually refresh a driver's online status (called when they send location updates)
  async refreshDriverStatus(driverId: string) {
    try {
      const driver = await this.storage.getDriverById(driverId);
      if (driver && driver.isOnline && driver.currentLocation) {
        // Handle different location formats
        let lat: number, lng: number;
        if (Array.isArray(driver.currentLocation)) {
          lat = driver.currentLocation[0];
          lng = driver.currentLocation[1];
        } else {
          lat = (driver.currentLocation as any).lat || (driver.currentLocation as any).latitude || 0;
          lng = (driver.currentLocation as any).lng || (driver.currentLocation as any).longitude || 0;
        }
        
        // Update lastOnline timestamp
        await this.storage.updateDriverLocation(driverId, { lat, lng });
        console.log(`🔄 Refreshed status for driver ${driver.name} (${driverId})`);
      }
    } catch (error) {
      console.error('❌ Error refreshing driver status:', error);
    }
  }
}