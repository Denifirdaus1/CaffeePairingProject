// Track initialization state
let isInitialized = false;
let isInitializing = false;
let initializationPromise: Promise<typeof google.maps> | null = null;

/**
 * Initialize Google Maps API
 * NOTE: API is now loaded via inline bootstrap script in index.html
 * This function just waits for it to be available and imports libraries
 */
export const initGoogleMapsLoader = async (): Promise<typeof google.maps> => {
  // If already initialized, return immediately
  if (isInitialized && window.google?.maps) {
    return window.google.maps;
  }

  // If currently initializing, wait for existing promise
  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }

  // Mark as initializing and create promise
  isInitializing = true;
  initializationPromise = (async () => {
    try {
      console.log('🗺️ Waiting for Google Maps API to load (via inline bootstrap)...');

      // Wait for google.maps to be available (loaded by inline script)
      let retries = 0;
      const maxRetries = 50; // 5 seconds total
      while (!window.google?.maps && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!window.google?.maps) {
        throw new Error(
          `❌ Google Maps API failed to load after ${maxRetries * 100}ms. ` +
          'Please check: 1) API key is set in Vercel environment variables, ' +
          '2) Maps JavaScript API is enabled in Google Cloud Console, ' +
          '3) Billing is enabled in Google Cloud Console, ' +
          '4) API restrictions allow your domain, ' +
          '5) No browser extensions are blocking requests.'
        );
      }

      console.log('✅ Google Maps API detected, importing libraries...');

      // Import required libraries using google.maps.importLibrary (from bootstrap)
      await Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('places'),
        google.maps.importLibrary('geometry'),
        google.maps.importLibrary('geocoding'),
      ]);
      
      console.log('✅ All Google Maps libraries loaded successfully');
      isInitialized = true;
      isInitializing = false;
      
      return window.google.maps;
    } catch (error: any) {
      isInitializing = false;
      const errorMessage = error?.message || String(error);
      console.error('❌ Error loading Google Maps API:', errorMessage);
      
      // Provide helpful error messages
      if (errorMessage.includes('NoApiKeys') || errorMessage.includes('ApiProjectMapError')) {
        throw new Error(
          '🔑 Google Maps API Key Error: ' +
          'The API key is missing, invalid, or the required APIs are not enabled. ' +
          'Please check: 1) VITE_GOOGLE_MAPS_API_KEY in Vercel env vars, ' +
          '2) Maps JavaScript API is enabled in Google Cloud Console, ' +
          '3) Places API is enabled, 4) Geocoding API is enabled, ' +
          '5) Billing is enabled in your Google Cloud project.'
        );
      }
      
      if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || errorMessage.includes('CSP')) {
        throw new Error(
          '🚫 Google Maps API is being blocked by browser extension or Content Security Policy. ' +
          'Please disable ad blockers or browser extensions that block Google Maps requests.'
        );
      }
      
      throw error;
    }
  })();

  return initializationPromise;
};

/**
 * Calculate distance between two coordinates (in meters)
 * Uses Haversine formula via Google Maps Geometry library
 */
export const calculateDistance = async (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): Promise<number> => {
  try {
    await initGoogleMapsLoader();

    const point1 = new google.maps.LatLng(lat1, lng1);
    const point2 = new google.maps.LatLng(lat2, lng2);

    const distance = google.maps.geometry.spherical.computeDistanceBetween(point1, point2);

    return distance; // Returns distance in meters
  } catch (error) {
    console.error('Error calculating distance:', error);
    throw error;
  }
};

/**
 * Format distance in meters to human-readable string
 * @param meters Distance in meters
 * @returns Formatted string (e.g., "50m", "1.2km")
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * Initialize Places Autocomplete on an input element
 * @param inputElement HTML input element
 * @param onPlaceSelect Callback when a place is selected
 * @param locationBias Optional location bias for autocomplete results
 */
export const initAutocomplete = async (
  inputElement: HTMLInputElement,
  onPlaceSelect: (place: {
    formattedAddress: string;
    location: { lat: number; lng: number };
    city?: string;
    country?: string;
    addressComponents: google.maps.places.PlaceResult['address_components'];
  }) => void,
  locationBias?: { lat: number; lng: number }
): Promise<google.maps.places.Autocomplete> => {
  try {
    await initGoogleMapsLoader();

    const autocomplete = new google.maps.places.Autocomplete(inputElement, {
      fields: ['formatted_address', 'geometry', 'address_components'],
      types: ['establishment', 'geocode'],
    });

    if (locationBias) {
      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(locationBias.lat - 0.1, locationBias.lng - 0.1),
        new google.maps.LatLng(locationBias.lat + 0.1, locationBias.lng + 0.1)
      );
      autocomplete.setBounds(bounds);
    }

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        console.error('No location data found for selected place');
        return;
      }

      const location = place.geometry.location;
      const lat = location.lat();
      const lng = location.lng();

      // Extract city and country from address components
      let city: string | undefined;
      let country: string | undefined;

      if (place.address_components) {
        for (const component of place.address_components) {
          const types = component.types;
          if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            city = component.long_name;
          }
          if (types.includes('country')) {
            country = component.long_name;
          }
        }
      }

      onPlaceSelect({
        formattedAddress: place.formatted_address || '',
        location: { lat, lng },
        city,
        country,
        addressComponents: place.address_components || [],
      });
    });

    return autocomplete;
  } catch (error) {
    console.error('Error initializing autocomplete:', error);
    throw error;
  }
};

/**
 * Initialize Place Autocomplete Element (New API)
 * This uses the newer PlaceAutocompleteElement API
 */
export const initPlaceAutocompleteElement = async (
  containerElement: HTMLElement,
  onPlaceSelect: (place: {
    displayName?: string;
    formattedAddress: string;
    location: { lat: number; lng: number };
    city?: string;
    country?: string;
    addressComponents: google.maps.places.PlaceResult['address_components'];
  }) => void
): Promise<any> => {
  try {
    await initGoogleMapsLoader();

    // Check if PlaceAutocompleteElement is available
    if (!(window as any).google?.maps?.places?.PlaceAutocompleteElement) {
      throw new Error('PlaceAutocompleteElement is not available. Make sure you are using the latest Maps JavaScript API.');
    }

    const placeAutocomplete = new (window as any).google.maps.places.PlaceAutocompleteElement({
      requestedResultFields: ['formatted_address', 'geometry', 'address_components', 'displayName'],
    });

    containerElement.appendChild(placeAutocomplete);

    placeAutocomplete.addEventListener('gmp-placeselect', async (event: any) => {
      const place = await event.place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
      });

      if (!place.location) {
        console.error('No location data found for selected place');
        return;
      }

      const lat = place.location.lat;
      const lng = place.location.lng;

      // Extract city and country from address components
      let city: string | undefined;
      let country: string | undefined;

      if (place.addressComponents) {
        for (const component of place.addressComponents) {
          const types = component.types;
          if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            city = component.longText || component.longName;
          }
          if (types.includes('country')) {
            country = component.longText || component.longName;
          }
        }
      }

      onPlaceSelect({
        displayName: place.displayName,
        formattedAddress: place.formattedAddress || '',
        location: { lat, lng },
        city,
        country,
        addressComponents: place.addressComponents || [],
      });
    });

    return placeAutocomplete;
  } catch (error) {
    console.error('Error initializing PlaceAutocompleteElement:', error);
    // Fallback to regular autocomplete
    throw error;
  }
};

/**
 * Get current user location using browser geolocation API
 */
export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

