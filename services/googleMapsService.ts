import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Get API key from environment (called at runtime, not module load)
const getApiKey = (): string => {
  // Try import.meta.env first (Vite's way)
  const fromImportMeta = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
  if (fromImportMeta && typeof fromImportMeta === 'string' && fromImportMeta.trim() !== '') {
    return fromImportMeta.trim();
  }
  
  // Fallback to process.env (in case of build-time)
  const fromProcess = (process.env as any)?.VITE_GOOGLE_MAPS_API_KEY;
  if (fromProcess && typeof fromProcess === 'string' && fromProcess.trim() !== '') {
    return fromProcess.trim();
  }
  
  console.warn('Google Maps API Key check:', {
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': fromImportMeta,
    'process.env.VITE_GOOGLE_MAPS_API_KEY': fromProcess,
    'import.meta.env keys': Object.keys(import.meta.env || {}).filter(k => k.includes('GOOGLE')),
  });
  
  return '';
};

// Track initialization state
let isInitialized = false;
let isInitializing = false;
let initializationPromise: Promise<typeof google.maps> | null = null;

/**
 * Initialize Google Maps API using functional API (v2.0+)
 * This uses setOptions() and importLibrary() instead of Loader class
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

  // Get API key at runtime
  const apiKey = getApiKey();

  if (!apiKey || apiKey === '') {
    const errorMsg = 'VITE_GOOGLE_MAPS_API_KEY environment variable is not set or is empty. Please check your .env.local file.';
    console.error('Google Maps API Key Error:', errorMsg);
    console.error('Debug info:', {
      'import.meta.env available': !!import.meta.env,
      'process.env available': !!process.env,
      'all env keys': Object.keys(import.meta.env || {}),
    });
    throw new Error(errorMsg);
  }

  // Mark as initializing and create promise
  isInitializing = true;
  initializationPromise = (async () => {
    try {
      console.log('Initializing Google Maps API with key:', apiKey.substring(0, 10) + '...');
      
      // Set options once (this is idempotent)
      // Must be called before any importLibrary calls
      setOptions({
        apiKey,
        version: 'weekly',
      });

      console.log('Google Maps setOptions called, importing libraries...');

      // Import libraries - this will load them if not already loaded
      // Note: importLibrary loads libraries dynamically and requires setOptions to be called first
      // Import maps first, then others
      await importLibrary('maps');
      console.log('Maps library imported');
      
      await Promise.all([
        importLibrary('places'),
        importLibrary('geometry'),
        importLibrary('geocoding'),
      ]);
      console.log('All libraries imported');

      // Wait a bit to ensure google.maps is fully available
      let retries = 0;
      const maxRetries = 10;
      while (!window.google?.maps && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!window.google?.maps) {
        throw new Error(
          `Google Maps API failed to load. window.google.maps is not available after ${maxRetries} retries. ` +
          'Please check: 1) API key is valid, 2) Required APIs are enabled in Google Cloud Console, ' +
          '3) No browser extensions are blocking the requests.'
        );
      }

      console.log('Google Maps API loaded successfully');
      isInitialized = true;
      isInitializing = false;
      
      return window.google.maps;
    } catch (error: any) {
      isInitializing = false;
      const errorMessage = error?.message || String(error);
      console.error('Error loading Google Maps API:', errorMessage);
      
      // Provide helpful error messages
      if (errorMessage.includes('NoApiKeys') || errorMessage.includes('ApiProjectMapError')) {
        throw new Error(
          'Google Maps API Key Error: ' +
          'The API key is missing, invalid, or the required APIs are not enabled. ' +
          'Please check: 1) VITE_GOOGLE_MAPS_API_KEY in .env.local, ' +
          '2) Maps JavaScript API is enabled in Google Cloud Console, ' +
          '3) Places API is enabled, 4) Geocoding API is enabled.'
        );
      }
      
      if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || errorMessage.includes('CSP')) {
        throw new Error(
          'Google Maps API is being blocked by browser extension or Content Security Policy. ' +
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
    
    // Import geometry library to ensure it's loaded
    await importLibrary('geometry');

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
    
    // Import places library to ensure Autocomplete is available
    await importLibrary('places');

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

