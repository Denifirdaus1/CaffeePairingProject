import React, { useEffect, useRef, useState } from 'react';
import { initAutocomplete, initGoogleMapsLoader } from '../services/googleMapsService';
import { importLibrary } from '@googlemaps/js-api-loader';

interface LocationData {
  formattedAddress: string;
  location: { lat: number; lng: number };
  city?: string;
  country?: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  value?: LocationData | null;
  error?: string;
  required?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  value,
  error,
  required = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(value || null);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      if (!inputRef.current || isInitialized) return;

      try {
        setIsLoading(true);
        const autocomplete = await initAutocomplete(
          inputRef.current,
          (place) => {
            setSelectedLocation(place);
            onLocationSelect(place);
            updateMapPreview(place.location, true);
          }
        );
        autocompleteRef.current = autocomplete;
        setIsInitialized(true);
      } catch (error: any) {
        console.error('Error initializing autocomplete:', error);
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('API key') || errorMessage.includes('NoApiKeys')) {
          alert('Google Maps API Key Error. Please check your .env.local file and ensure VITE_GOOGLE_MAPS_API_KEY is set correctly.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAutocomplete();
  }, [isInitialized, onLocationSelect]);

  useEffect(() => {
    const initializeMap = async () => {
      if (mapRef.current && !mapInstanceRef.current) {
        // Default to Munich, Germany if no value provided
        const defaultLocation = value?.location || { lat: 48.1351, lng: 11.5820 };
        await updateMapPreview(defaultLocation, true); // true = clickable
      } else if (value && mapInstanceRef.current) {
        await updateMapPreview(value.location, true);
      }
    };
    
    initializeMap();
  }, [value]);

  const updateMapPreview = async (location: { lat: number; lng: number }, isClickable: boolean = false) => {
    if (!mapRef.current) return;

    try {
      // Initialize Google Maps API first
      await initGoogleMapsLoader();
      
      // Ensure google.maps is available
      if (!window.google?.maps) {
        console.error('window.google.maps is not available after initGoogleMapsLoader');
        return;
      }
      
      const { Map } = await importLibrary('maps');

      if (!mapInstanceRef.current) {
        // Initialize map
        mapInstanceRef.current = new Map(mapRef.current, {
          center: location,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          clickableIcons: false,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#1a1a1a' }],
            },
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#e8e1da' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#0f0f0f' }],
            },
          ],
        });
      }

      // Update map center
      mapInstanceRef.current.setCenter(location);
      mapInstanceRef.current.setZoom(15);

      // If map is clickable, add click listener
      if (isClickable && mapInstanceRef.current) {
        mapInstanceRef.current.addListener('click', async (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const clickedLocation = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            
            // Reverse geocode to get address
            try {
              await importLibrary('geocoding');
              const geocoder = new google.maps.Geocoder();
              
              geocoder.geocode({ location: new google.maps.LatLng(clickedLocation.lat, clickedLocation.lng) }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  const result = results[0];
                  let city: string | undefined;
                  let country: string | undefined;

                  if (result.address_components) {
                    for (const component of result.address_components) {
                      const types = component.types;
                      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                        city = component.long_name;
                      }
                      if (types.includes('country')) {
                        country = component.long_name;
                      }
                    }
                  }

                  const locationData: LocationData = {
                    formattedAddress: result.formatted_address || '',
                    location: clickedLocation,
                    city,
                    country,
                  };

                  setSelectedLocation(locationData);
                  onLocationSelect(locationData);
                  updateMapPreview(clickedLocation, true); // Update marker position
                }
              });
            } catch (error) {
              console.error('Error reverse geocoding:', error);
            }
          }
        });
      }

      // Update or create marker using standard Marker
      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          map: mapInstanceRef.current,
          position: location,
          animation: google.maps.Animation.DROP,
          draggable: isClickable, // Allow dragging if clickable
        });

        // Add drag end listener if draggable
        if (isClickable) {
          markerRef.current.addListener('dragend', async () => {
            const position = markerRef.current?.getPosition();
            if (position) {
              const draggedLocation = { lat: position.lat(), lng: position.lng() };
              
              // Reverse geocode dragged location
              try {
                await importLibrary('geocoding');
                const geocoder = new google.maps.Geocoder();
                
                geocoder.geocode({ location: position }, (results, status) => {
                  if (status === 'OK' && results && results[0]) {
                    const result = results[0];
                    let city: string | undefined;
                    let country: string | undefined;

                    if (result.address_components) {
                      for (const component of result.address_components) {
                        const types = component.types;
                        if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                          city = component.long_name;
                        }
                        if (types.includes('country')) {
                          country = component.long_name;
                        }
                      }
                    }

                    const locationData: LocationData = {
                      formattedAddress: result.formatted_address || '',
                      location: draggedLocation,
                      city,
                      country,
                    };

                    setSelectedLocation(locationData);
                    onLocationSelect(locationData);
                  }
                });
              } catch (error) {
                console.error('Error reverse geocoding:', error);
              }
            }
          });
        }
      } else {
        markerRef.current.setPosition(location);
      }
    } catch (error) {
      console.error('Error updating map preview:', error);
    }
  };

  const handleInputChange = () => {
    // Clear selection when user types
    if (selectedLocation) {
      setSelectedLocation(null);
      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-brand-text/90 mb-2">
          Café Location {required && '*'}
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            required={required}
            value={selectedLocation?.formattedAddress || ''}
            onChange={handleInputChange}
            placeholder="Search for your café location..."
            className={`w-full bg-brand-bg border ${
              error ? 'border-red-500' : 'border-brand-accent/50'
            } rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors pr-10`}
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-accent"></div>
            </div>
          )}
          {!isLoading && (
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
        {!error && (
          <p className="mt-1 text-xs text-brand-text-muted">
            Start typing to search for your café location. Select from the suggestions.
          </p>
        )}
      </div>

      {/* Interactive Map Picker */}
      <div className="rounded-xl overflow-hidden border border-brand-accent/30">
        <div
          ref={mapRef}
          className="w-full h-96 bg-brand-surface cursor-pointer"
          style={{ minHeight: '384px' }}
        />
        <div className="bg-brand-surface/50 p-3 border-t border-brand-accent/30">
          <div className="text-sm text-brand-text mb-2">
            <div className="font-semibold text-white mb-1">
              {selectedLocation ? selectedLocation.formattedAddress : 'Click on the map to select location'}
            </div>
            {selectedLocation && selectedLocation.city && selectedLocation.country && (
              <div className="text-brand-text-muted">
                {selectedLocation.city}, {selectedLocation.country}
              </div>
            )}
            {selectedLocation && (
              <div className="text-xs text-brand-text-muted mt-1">
                Coordinates: {selectedLocation.location.lat.toFixed(6)}, {selectedLocation.location.lng.toFixed(6)}
              </div>
            )}
            {!selectedLocation && (
              <div className="text-xs text-brand-text-muted mt-1">
                You can also search above or click on the map to set location
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

