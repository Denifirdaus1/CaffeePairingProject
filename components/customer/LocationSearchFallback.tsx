import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { initAutocomplete } from '../../services/googleMapsService';

interface LocationSearchFallbackProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
}

export const LocationSearchFallback: React.FC<LocationSearchFallbackProps> = ({
  onLocationSelect,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      if (!inputRef.current || isInitialized) return;

      try {
        setIsLoading(true);
        const autocomplete = await initAutocomplete(
          inputRef.current,
          (place) => {
            onLocationSelect(place.location);
          }
        );
        autocompleteRef.current = autocomplete;
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAutocomplete();
  }, [isInitialized, onLocationSelect]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass-panel rounded-3xl p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-3">
            Search for Cafés
          </h2>
          <p className="text-brand-text/80">
            Enter a city or area to find partner cafés nearby
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search city or area (e.g., Munich, Germany)"
              className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-4 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors pr-12"
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-accent"></div>
              </div>
            )}
            {!isLoading && (
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>

          <div className="text-center">
            <Link
              to="/business#shops"
              className="inline-flex items-center gap-2 text-brand-accent hover:text-white transition-colors text-sm font-medium"
            >
              <span>Or view all partner cafés</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

