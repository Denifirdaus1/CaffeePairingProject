import React, { useEffect, useRef, useState } from 'react';
import { initGoogleMapsLoader } from '../services/googleMapsService';

interface LocationData {
  formattedAddress: string;
  location: { lat: number; lng: number };
  city?: string;
  country?: string;
}

interface LocationPickerManualProps {
  onLocationSelect: (location: LocationData) => void;
  value?: LocationData | null;
  error?: string;
  required?: boolean;
}

/**
 * LocationPicker with Google Maps JavaScript API
 * Features: Copy-paste coordinates, draggable marker, interactive map
 */
export const LocationPickerManual: React.FC<LocationPickerManualProps> = ({
  onLocationSelect,
  value,
  error,
  required = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  
  const [latitude, setLatitude] = useState<string>(value?.location?.lat?.toString() || '');
  const [longitude, setLongitude] = useState<string>(value?.location?.lng?.toString() || '');
  const [coordinateInput, setCoordinateInput] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(value || null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string>('');

  // Normalize number input: accept both comma and dot as decimal separator
  // Must be defined before useEffect hooks that use it
  const normalizeNumber = (value: string): string => {
    // Replace comma with dot for German/European locale compatibility
    return value.replace(/,/g, '.');
  };

  useEffect(() => {
    if (value) {
      setLatitude(value.location.lat.toString());
      setLongitude(value.location.lng.toString());
      setSelectedLocation(value);
    }
  }, [value]);

  const updateLocation = (lat: number, lng: number) => {
    const locationData: LocationData = {
      formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      location: { lat, lng },
      city: undefined,
      country: undefined,
    };

    setSelectedLocation(locationData);
    onLocationSelect(locationData);
  };

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      // Check if we have valid coordinates to initialize with (normalize comma to dot)
      const lat = parseFloat(normalizeNumber(latitude));
      const lng = parseFloat(normalizeNumber(longitude));
      const hasCoords = !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

      if (!hasCoords) {
        console.log('Waiting for valid coordinates before initializing map');
        return;
      }

      try {
        console.log('Initializing Google Maps API...');
        await initGoogleMapsLoader();
        
        const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
        const { Marker } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

        console.log('Creating map with coordinates:', { lat, lng });

        // Create map WITHOUT mapId to avoid ApiProjectMapError
        const map = new Map(mapRef.current, {
          center: { lat, lng },
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        googleMapRef.current = map;

        // Create draggable marker (basic Marker doesn't require mapId)
        const marker = new Marker({
          map,
          position: { lat, lng },
          draggable: true,
          title: 'Drag to adjust location',
        });

        markerRef.current = marker as any;

        // Handle marker drag
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (position) {
            const newLat = position.lat();
            const newLng = position.lng();
            setLatitude(newLat.toFixed(6));
            setLongitude(newLng.toFixed(6));
            updateLocation(newLat, newLng);
          }
        });

        // Handle map click to move marker
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            marker.setPosition(e.latLng);
            setLatitude(newLat.toFixed(6));
            setLongitude(newLng.toFixed(6));
            updateLocation(newLat, newLng);
          }
        });

        setMapReady(true);
        setMapError('');
        console.log('Google Maps initialized successfully');

      } catch (error: any) {
        console.error('Error initializing Google Maps:', error);
        setMapError(error.message || 'Failed to load Google Maps');
      }
    };

    initMap();
  }, [latitude, longitude]); // Re-init when coordinates change from empty to valid

  // Update marker position when coordinates change externally
  useEffect(() => {
    const lat = parseFloat(normalizeNumber(latitude));
    const lng = parseFloat(normalizeNumber(longitude));
    const isValid = !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

    if (isValid && googleMapRef.current && markerRef.current) {
      const newPos = new google.maps.LatLng(lat, lng);
      markerRef.current.setPosition(newPos);
      googleMapRef.current.setCenter(newPos);
    }
  }, [latitude, longitude]);

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLatitude(val);
    
    // Normalize: replace comma with dot
    const normalized = normalizeNumber(val);
    const lat = parseFloat(normalized);
    const lng = parseFloat(normalizeNumber(longitude));
    
    // Only update location if both lat and lng are valid
    if (!isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lng) && lng >= -180 && lng <= 180) {
      updateLocation(lat, lng);
    }
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLongitude(val);
    
    // Normalize: replace comma with dot
    const normalized = normalizeNumber(val);
    const lng = parseFloat(normalized);
    const lat = parseFloat(normalizeNumber(latitude));
    
    // Only update location if both lat and lng are valid
    if (!isNaN(lng) && lng >= -180 && lng <= 180 && !isNaN(lat) && lat >= -90 && lat <= 90) {
      updateLocation(lat, lng);
    }
  };

  const handleCoordinateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCoordinateInput(val);
    
    // Try to parse different formats:
    // "48.1499224875299, 11.577564934116047" (English format with dot)
    // "48,1499224875299, 11,577564934116047" (German format with comma)
    // "48.1499224875299,11.577564934116047" (no space)
    // "11.577564934116047, 48.1499224875299" (reversed)
    
    // Strategy: Split by space, comma, or both
    // Then normalize each part (replace comma with dot)
    const parts = val.trim().split(/[\s,]+/).filter(p => p.length > 0);
    
    if (parts.length === 2) {
      // Normalize both parts: replace comma with dot
      const num1 = parseFloat(normalizeNumber(parts[0]));
      const num2 = parseFloat(normalizeNumber(parts[1]));
      
      if (!isNaN(num1) && !isNaN(num2)) {
        let lat: number, lng: number;
        
        // Auto-detect which is latitude (must be -90 to 90)
        if (num1 >= -90 && num1 <= 90) {
          lat = num1;
          lng = num2;
        } else if (num2 >= -90 && num2 <= 90) {
          lat = num2;
          lng = num1;
        } else {
          return; // Invalid coordinates
        }
        
        // Validate longitude range
        if (lng >= -180 && lng <= 180) {
          setLatitude(lat.toString());
          setLongitude(lng.toString());
          updateLocation(lat, lng);
        }
      }
    }
  };

  // Check if we have valid coordinates (normalize comma to dot)
  const currentLat = latitude ? parseFloat(normalizeNumber(latitude)) : null;
  const currentLng = longitude ? parseFloat(normalizeNumber(longitude)) : null;
  const hasValidCoordinates = currentLat !== null && !isNaN(currentLat) && currentLat >= -90 && currentLat <= 90 &&
                              currentLng !== null && !isNaN(currentLng) && currentLng >= -180 && currentLng <= 180;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-brand-text/90 mb-2">
          Café Location {required && '*'}
        </label>
        
        {/* Quick Copy-Paste Input */}
        <div className="mb-4">
          <label className="block text-xs text-brand-text-muted mb-1">
            📋 Paste Coordinates (e.g., "48.1499224875299, 11.577564934116047")
          </label>
          <input
            type="text"
            value={coordinateInput}
            onChange={handleCoordinateInput}
            placeholder="Paste: latitude, longitude or longitude, latitude"
            className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors placeholder:text-brand-text-muted/50"
          />
          <p className="mt-1 text-xs text-brand-text-muted">
            💡 Copy coordinates from Google Maps and paste here for quick input
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 border-t border-brand-accent/20"></div>
          <span className="text-xs text-brand-text-muted">or enter manually</span>
          <div className="flex-1 border-t border-brand-accent/20"></div>
        </div>
        
        {/* Manual Input Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-brand-text-muted mb-1">Latitude</label>
            <input
              type="text"
              inputMode="decimal"
              pattern="[+-]?([0-9]*[.,])?[0-9]+"
              value={latitude}
              onChange={handleLatChange}
              placeholder="48.1351 or 48,1351"
              className={`w-full bg-brand-bg border ${
                error ? 'border-red-500' : 'border-brand-accent/50'
              } rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors`}
              required={required}
            />
            <p className="text-xs text-brand-text-muted/70 mt-1">-90 to 90</p>
          </div>
          <div>
            <label className="block text-xs text-brand-text-muted mb-1">Longitude</label>
            <input
              type="text"
              inputMode="decimal"
              pattern="[+-]?([0-9]*[.,])?[0-9]+"
              value={longitude}
              onChange={handleLngChange}
              placeholder="11.5820 or 11,5820"
              className={`w-full bg-brand-bg border ${
                error ? 'border-red-500' : 'border-brand-accent/50'
              } rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors`}
              required={required}
            />
            <p className="text-xs text-brand-text-muted/70 mt-1">-180 to 180</p>
          </div>
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
        {mapError && (
          <p className="mt-1 text-sm text-yellow-400">
            {mapError}
          </p>
        )}
        {!error && !mapError && (
          <p className="mt-1 text-xs text-brand-text-muted">
            Enter coordinates manually or click/drag on the map below to adjust location.
          </p>
        )}
      </div>

      {/* Google Maps Container - Only show if valid coordinates are entered */}
      {hasValidCoordinates && currentLat !== null && currentLng !== null ? (
        <div className="rounded-xl overflow-hidden border border-brand-accent/30 shadow-lg">
          <div
            ref={mapRef}
            className="w-full h-96"
            style={{ 
              minHeight: '400px',
              background: '#e5e3df', // Google Maps loading background color
            }}
          />

          <div className="bg-brand-surface/50 p-3 border-t border-brand-accent/30">
            <div className="text-sm text-brand-text">
              <div className="font-semibold text-white mb-1">
                {selectedLocation ? selectedLocation.formattedAddress : `${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`}
              </div>
              <div className="text-xs text-brand-text-muted mt-1">
                Coordinates: {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
              </div>
              {mapReady && (
                <div className="text-xs text-green-400 mt-1">
                  ✓ Map loaded - Click or drag marker to adjust
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-brand-accent/30 bg-brand-surface/30 p-12 text-center">
          <div className="text-brand-text-muted">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">Enter latitude and longitude above to see map preview</p>
          </div>
        </div>
      )}

      {/* Quick Location Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setLatitude('48.1351');
            setLongitude('11.5820');
            updateLocation(48.1351, 11.5820);
          }}
          className="px-3 py-1 text-xs bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent rounded-lg transition-colors"
        >
          📍 Munich, Germany
        </button>
        <button
          type="button"
          onClick={() => {
            setLatitude('-6.2088');
            setLongitude('106.8456');
            updateLocation(-6.2088, 106.8456);
          }}
          className="px-3 py-1 text-xs bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent rounded-lg transition-colors"
        >
          📍 Jakarta, Indonesia
        </button>
        <button
          type="button"
          onClick={() => {
            setLatitude('40.7128');
            setLongitude('-74.0060');
            updateLocation(40.7128, -74.0060);
          }}
          className="px-3 py-1 text-xs bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent rounded-lg transition-colors"
        >
          📍 New York, USA
        </button>
      </div>
    </div>
  );
};
