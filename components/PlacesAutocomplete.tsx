import React, { useState, useEffect, useRef } from 'react';
import { searchPlaces, getPlaceDetails, PlaceDetails } from '../services/googlePlacesService';

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: PlaceDetails) => void;
  placeholder?: string;
  types?: string[];
  className?: string;
}

export const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  onPlaceSelect,
  placeholder = 'Search for your café on Google Maps...',
  types = ['cafe', 'restaurant', 'bakery', 'food'],
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search places with debounce
  useEffect(() => {
    if (query.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce search (300ms)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await searchPlaces(query, types);
        setPredictions(results);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch (err: any) {
        console.error('Error searching places:', err);
        setError(err.message || 'Failed to search places');
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, types]);

  const handleSelectPlace = async (placeId: string, description: string) => {
    try {
      setLoading(true);
      setError(null);
      setQuery(description);
      setShowDropdown(false);
      
      const details = await getPlaceDetails(placeId);
      onPlaceSelect(details);
    } catch (err: any) {
      console.error('Error getting place details:', err);
      setError(err.message || 'Failed to get place details');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          const prediction = predictions[selectedIndex];
          handleSelectPlace(prediction.place_id, prediction.description);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <svg
            className={`w-5 h-5 ${loading ? 'text-brand-accent animate-spin' : 'text-brand-text-muted'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {loading ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            )}
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Dropdown Suggestions */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-brand-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {predictions.map((prediction, index) => (
              <button
                key={prediction.place_id}
                onClick={() => handleSelectPlace(prediction.place_id, prediction.description)}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  index === selectedIndex
                    ? 'bg-brand-accent/20 border-l-2 border-brand-accent'
                    : 'hover:bg-white/5 border-l-2 border-transparent'
                } ${index !== predictions.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg
                      className="w-5 h-5 text-brand-accent"
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {prediction.structured_formatting.main_text}
                    </p>
                    <p className="text-brand-text-muted text-sm mt-0.5 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Powered by Google */}
          <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex items-center justify-end gap-2">
            <span className="text-brand-text-muted text-xs">Powered by</span>
            <span className="text-white text-xs font-semibold">Google</span>
          </div>
        </div>
      )}

      {/* No Results */}
      {showDropdown && !loading && query.length >= 3 && predictions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-brand-surface border border-white/10 rounded-xl shadow-2xl p-4">
          <p className="text-brand-text-muted text-center">
            No places found. Try a different search term.
          </p>
        </div>
      )}

      {/* Helper Text */}
      {!error && query.length === 0 && (
        <p className="mt-2 text-brand-text-muted text-sm">
          💡 Start typing your café name or address to see suggestions from Google Maps
        </p>
      )}
    </div>
  );
};

