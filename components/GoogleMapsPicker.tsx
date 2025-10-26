import React, { useEffect, useRef, useState } from 'react';

interface GoogleMapsPickerProps {
  onLocationSelect: (location: {
    address: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
  }) => void;
  initialValue?: string;
}

export const GoogleMapsPicker: React.FC<GoogleMapsPickerProps> = ({ 
  onLocationSelect,
  initialValue = ''
}) => {
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteInstanceRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    // Load Google Maps script if not already loaded
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Google Maps API key not found');
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsLoaded(true);
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  useEffect(() => {
    if (!isLoaded || !autocompleteInputRef.current) return;

    // Initialize Autocomplete
    const autocomplete = new google.maps.places.Autocomplete(
      autocompleteInputRef.current,
      {
        types: ['establishment', 'geocode'],
        fields: ['formatted_address', 'geometry', 'address_components', 'name']
      }
    );

    autocompleteInstanceRef.current = autocomplete;

    // Initialize Map
    if (mapRef.current) {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: -6.200000, lng: 106.816666 }, // Default to Jakarta
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: false
      });

      mapInstanceRef.current = map;

      // Initialize Marker
      const marker = new google.maps.Marker({
        map: map,
        draggable: true
      });
      markerRef.current = marker;

      // Handle marker drag end
      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (position) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: position }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              updateLocation(results[0], position.lat(), position.lng());
            }
          });
        }
      });
    }

    // Handle place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        console.error('No geometry found for the selected place');
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      // Update map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat, lng });
        mapInstanceRef.current.setZoom(15);
      }

      // Update marker
      if (markerRef.current) {
        markerRef.current.setPosition({ lat, lng });
        markerRef.current.setTitle(place.name || 'Selected location');
      }

      // Extract address components
      updateLocation(place, lat, lng);
    });

    return () => {
      // Cleanup
      if (autocompleteInstanceRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current);
      }
    };
  }, [isLoaded]);

  const updateLocation = (
    place: google.maps.places.PlaceResult,
    lat: number,
    lng: number
  ) => {
    let address = '';
    let city = '';
    let country = '';

    if (place.formatted_address) {
      address = place.formatted_address;
    }

    // Extract city and country from address_components
    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;

        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          if (!city) city = component.long_name;
        } else if (types.includes('country')) {
          country = component.long_name;
        }
      }
    }

    setSearchValue(address);
    
    onLocationSelect({
      address,
      city,
      country,
      lat,
      lng
    });
  };

  if (!isLoaded) {
    return (
      <div className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-center text-brand-text/50">
        Loading Google Maps...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          ref={autocompleteInputRef}
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search for your café location..."
          className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
        />
        <p className="mt-1 text-xs text-brand-text/50">
          Search for your café location or drag the marker on the map
        </p>
      </div>

      <div className="w-full h-64 rounded-xl overflow-hidden border border-brand-accent/50">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
};
