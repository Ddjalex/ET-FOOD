/**
 * Geocoding Service
 * Converts coordinates to human-readable addresses using OpenStreetMap Nominatim API
 */

interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    house_number?: string;
    neighbourhood?: string;
  };
}

class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';
  private readonly userAgent = 'BeU-Delivery/1.0';

  /**
   * Convert latitude and longitude to a human-readable address
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const url = `${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data: NominatimResponse = await response.json();
      return this.formatAddress(data);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Return formatted coordinates as fallback
      return this.formatCoordinates(lat, lng);
    }
  }

  /**
   * Format the Nominatim response into a user-friendly address
   */
  private formatAddress(data: NominatimResponse): string {
    const { address } = data;
    
    if (!address) {
      return this.extractFromDisplayName(data.display_name);
    }

    const parts: string[] = [];

    // Add house number and road
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    // Add neighbourhood or suburb
    if (address.neighbourhood && !parts.some(p => p.includes(address.neighbourhood!))) {
      parts.push(address.neighbourhood);
    } else if (address.suburb && !parts.some(p => p.includes(address.suburb!))) {
      parts.push(address.suburb);
    }

    // Add city
    if (address.city && !parts.some(p => p.includes(address.city!))) {
      parts.push(address.city);
    }

    // If we have no meaningful parts, extract from display name
    if (parts.length === 0) {
      return this.extractFromDisplayName(data.display_name);
    }

    return parts.join(', ');
  }

  /**
   * Extract meaningful address from display name
   */
  private extractFromDisplayName(displayName: string): string {
    // Split display name and take the first 2-3 meaningful parts
    const parts = displayName.split(',').map(part => part.trim());
    
    // Filter out country and long codes
    const filtered = parts.filter((part, index) => {
      if (index >= 3) return false; // Take only first 3 parts
      if (part.match(/^\d{5,}$/)) return false; // Remove postal codes
      if (part.toLowerCase() === 'ethiopia') return false; // Remove country
      return true;
    });

    return filtered.slice(0, 2).join(', ') || 'Address not found';
  }

  /**
   * Format coordinates as fallback when geocoding fails
   */
  private formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  /**
   * Geocode multiple locations in batch
   */
  async reverseGeocodeMultiple(locations: Array<{lat: number, lng: number}>): Promise<string[]> {
    const promises = locations.map(loc => this.reverseGeocode(loc.lat, loc.lng));
    
    // Add delay between requests to respect rate limits
    const results: string[] = [];
    for (const promise of promises) {
      const result = await promise;
      results.push(result);
      
      // Add 1 second delay between requests to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * Get location info for both restaurant and delivery address
   */
  async getOrderLocationInfo(restaurantLocation: {lat: number, lng: number}, deliveryLocation: {lat: number, lng: number}): Promise<{
    restaurantAddressName: string;
    customerAddressName: string;
  }> {
    try {
      // Process both locations with a slight delay
      const restaurantAddressName = await this.reverseGeocode(restaurantLocation.lat, restaurantLocation.lng);
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const customerAddressName = await this.reverseGeocode(deliveryLocation.lat, deliveryLocation.lng);

      return {
        restaurantAddressName,
        customerAddressName
      };
    } catch (error) {
      console.error('Error getting order location info:', error);
      
      // Return fallback coordinates
      return {
        restaurantAddressName: this.formatCoordinates(restaurantLocation.lat, restaurantLocation.lng),
        customerAddressName: this.formatCoordinates(deliveryLocation.lat, deliveryLocation.lng)
      };
    }
  }
}

export const geocodingService = new GeocodingService();