// Distance calculation service for delivery fees

export interface DistanceCalculation {
  distanceKm: number;
  deliveryFee: number;
  estimatedDuration: number; // minutes
}

export class DistanceService {
  private static readonly BASE_FEE = 15; // Base delivery fee in ETB
  private static readonly RATE_PER_KM = 5; // Additional fee per kilometer in ETB
  private static readonly MIN_FEE = 10; // Minimum delivery fee in ETB
  
  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }
  
  /**
   * Calculate delivery fee based on distance
   */
  static calculateDeliveryFee(distanceKm: number): number {
    const calculatedFee = this.BASE_FEE + (distanceKm * this.RATE_PER_KM);
    return Math.max(calculatedFee, this.MIN_FEE);
  }
  
  /**
   * Estimate delivery duration based on distance (assuming avg speed of 25 km/h)
   */
  static estimateDeliveryDuration(distanceKm: number): number {
    const avgSpeedKmh = 25;
    const durationHours = distanceKm / avgSpeedKmh;
    return Math.ceil(durationHours * 60); // Convert to minutes and round up
  }
  
  /**
   * Calculate complete distance and fee information
   */
  static async calculateDistanceAndFee(
    restaurantLat: number,
    restaurantLng: number,
    customerLat: number,
    customerLng: number
  ): Promise<DistanceCalculation> {
    const distanceKm = this.calculateDistance(
      restaurantLat, 
      restaurantLng, 
      customerLat, 
      customerLng
    );
    
    const deliveryFee = this.calculateDeliveryFee(distanceKm);
    const estimatedDuration = this.estimateDeliveryDuration(distanceKm);
    
    return {
      distanceKm,
      deliveryFee,
      estimatedDuration
    };
  }
  
  /**
   * Get distance using OpenStreetMap routing API (more accurate for actual road distance)
   */
  static async getRouteDistance(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): Promise<{ distanceKm: number; durationMinutes: number } | null> {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false&alternatives=false&steps=false`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = route.distance / 1000; // Convert meters to kilometers
        const durationMinutes = Math.ceil(route.duration / 60); // Convert seconds to minutes
        
        return {
          distanceKm: Math.round(distanceKm * 100) / 100,
          durationMinutes
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching route from OSRM:', error);
      return null;
    }
  }
  
  /**
   * Calculate delivery fee using actual road distance when possible
   */
  static async calculateAccurateDistanceAndFee(
    restaurantLat: number,
    restaurantLng: number,
    customerLat: number,
    customerLng: number
  ): Promise<DistanceCalculation> {
    // Try to get accurate route distance first
    const routeData = await this.getRouteDistance(
      restaurantLat, 
      restaurantLng, 
      customerLat, 
      customerLng
    );
    
    if (routeData) {
      const deliveryFee = this.calculateDeliveryFee(routeData.distanceKm);
      return {
        distanceKm: routeData.distanceKm,
        deliveryFee,
        estimatedDuration: routeData.durationMinutes
      };
    }
    
    // Fallback to straight-line distance
    return this.calculateDistanceAndFee(
      restaurantLat,
      restaurantLng,
      customerLat,
      customerLng
    );
  }
  
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}