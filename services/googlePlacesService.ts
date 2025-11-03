import { initGoogleMapsLoader } from './googleMapsService';

// Generate session token for Autocomplete (cost optimization)
let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

const getSessionToken = async (): Promise<google.maps.places.AutocompleteSessionToken> => {
  await initGoogleMapsLoader();
  
  if (!sessionToken) {
    sessionToken = new google.maps.places.AutocompleteSessionToken();
  }
  return sessionToken;
};

export const resetSessionToken = () => {
  sessionToken = null;
};

/**
 * Search places using Autocomplete Service (per session billing)
 */
export const searchPlaces = async (
  query: string,
  types: string[] = ['cafe', 'restaurant', 'establishment']
): Promise<google.maps.places.AutocompletePrediction[]> => {
  try {
    await initGoogleMapsLoader();
    
    const service = new google.maps.places.AutocompleteService();
    const token = await getSessionToken();
    
    return new Promise((resolve, reject) => {
      service.getPlacePredictions(
        {
          input: query,
          types: types,
          sessionToken: token,
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
};

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: google.maps.places.PlacePhoto[];
  opening_hours?: google.maps.places.PlaceOpeningHours;
  business_status?: string;
  price_level?: number;
  types?: string[];
  geometry?: {
    location: google.maps.LatLng;
  };
  address_components?: google.maps.GeocoderAddressComponent[];
}

/**
 * Get detailed information about a place
 */
export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails> => {
  try {
    await initGoogleMapsLoader();
    
    // Create a dummy div for PlacesService (required by API)
    const div = document.createElement('div');
    const service = new google.maps.places.PlacesService(div);
    const token = await getSessionToken();
    
    return new Promise((resolve, reject) => {
      service.getDetails(
        {
          placeId: placeId,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'formatted_phone_number',
            'international_phone_number',
            'website',
            'rating',
            'user_ratings_total',
            'photos',
            'opening_hours',
            'business_status',
            'price_level',
            'types',
            'geometry',
            'address_components',
          ],
          sessionToken: token,
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            // Reset session token after successful place selection
            resetSessionToken();
            resolve(place as PlaceDetails);
          } else {
            reject(new Error(`Place details failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
};

/**
 * Get photo URL from PlacePhoto
 */
export const getPhotoUrl = (
  photo: google.maps.places.PlacePhoto,
  maxWidth: number = 400
): string => {
  return photo.getUrl({ maxWidth });
};

/**
 * Extract city and country from address components
 */
export const parseAddressComponents = (
  components?: google.maps.GeocoderAddressComponent[]
) => {
  if (!components) return { city: '', country: '' };
  
  let city = '';
  let country = '';
  
  for (const component of components) {
    if (component.types.includes('locality')) {
      city = component.long_name;
    } else if (component.types.includes('administrative_area_level_1') && !city) {
      city = component.long_name;
    } else if (component.types.includes('country')) {
      country = component.long_name;
    }
  }
  
  return { city, country };
};

/**
 * Format opening hours for display
 */
export const formatOpeningHours = (
  openingHours?: google.maps.places.PlaceOpeningHours
): string[] => {
  if (!openingHours || !openingHours.weekday_text) {
    return [];
  }
  return openingHours.weekday_text;
};

/**
 * Check if place is currently open
 */
export const isPlaceOpen = (
  openingHours?: google.maps.places.PlaceOpeningHours
): { isOpen: boolean; text: string } => {
  if (!openingHours) {
    return { isOpen: false, text: 'Hours not available' };
  }
  
  if (openingHours.isOpen?.()) {
    return { isOpen: true, text: 'Open now' };
  } else {
    return { isOpen: false, text: 'Closed' };
  }
};

/**
 * Format business status
 */
export const formatBusinessStatus = (status?: string): string => {
  switch (status) {
    case 'OPERATIONAL':
      return 'Operational';
    case 'CLOSED_TEMPORARILY':
      return 'Temporarily closed';
    case 'CLOSED_PERMANENTLY':
      return 'Permanently closed';
    default:
      return 'Status unknown';
  }
};

/**
 * Format price level
 */
export const formatPriceLevel = (priceLevel?: number): string => {
  if (priceLevel === undefined) return '';
  
  switch (priceLevel) {
    case 0:
      return 'Free';
    case 1:
      return '€';
    case 2:
      return '€€';
    case 3:
      return '€€€';
    case 4:
      return '€€€€';
    default:
      return '';
  }
};

/**
 * Convert PlaceDetails to database format
 */
export const placeDetailsToDbFormat = (place: PlaceDetails) => {
  const { city, country } = parseAddressComponents(place.address_components);
  
  return {
    google_place_id: place.place_id,
    cafe_name: place.name,
    address: place.formatted_address,
    city: city,
    country: country,
    latitude: place.geometry?.location.lat(),
    longitude: place.geometry?.location.lng(),
    phone: place.formatted_phone_number || place.international_phone_number,
    website: place.website,
    google_rating: place.rating,
    google_review_count: place.user_ratings_total,
    google_photo_url: place.photos?.[0] ? getPhotoUrl(place.photos[0], 800) : null,
    google_formatted_phone: place.formatted_phone_number,
    google_international_phone: place.international_phone_number,
    google_website: place.website,
    google_opening_hours: place.opening_hours ? {
      weekday_text: place.opening_hours.weekday_text,
      open_now: place.opening_hours.isOpen?.() || false,
    } : null,
    google_business_status: place.business_status,
    google_price_level: place.price_level,
    google_types: place.types,
    google_data_synced_at: new Date().toISOString(),
  };
};

