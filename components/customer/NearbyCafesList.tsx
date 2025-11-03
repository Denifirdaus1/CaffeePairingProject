import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CoffeeIcon } from '../icons/CoffeeIcon';
import { formatDistance } from '../../services/googleMapsService';
import { OptimizedImage } from '../OptimizedImage';
import { CafeDirectionsModal } from './CafeDirectionsModal';

interface Cafe {
  id: string;
  cafe_name: string;
  shop_slug: string;
  address?: string;
  city?: string;
  country?: string;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  distance?: number; // in meters
  // Google Places data
  google_rating?: number;
  google_review_count?: number;
  google_photo_url?: string;
  google_opening_hours?: any;
  google_business_status?: string;
  google_price_level?: number;
}

interface NearbyCafesListProps {
  cafes: Cafe[];
  userLocation?: { lat: number; lng: number };
  loading?: boolean;
}

export const NearbyCafesList: React.FC<NearbyCafesListProps> = ({
  cafes,
  userLocation,
  loading = false,
}) => {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [isDirectionsModalOpen, setIsDirectionsModalOpen] = useState(false);

  const handleGetDirections = (cafe: Cafe, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCafe(cafe);
    setIsDirectionsModalOpen(true);
  };

  const handleCloseDirections = () => {
    setIsDirectionsModalOpen(false);
    setSelectedCafe(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
          <p className="text-brand-text">Finding nearby cafés...</p>
        </div>
      </div>
    );
  }

  if (cafes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel rounded-3xl p-8 text-center">
          <CoffeeIcon className="h-16 w-16 text-brand-accent/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No cafés found nearby
          </h3>
          <p className="text-brand-text-muted mb-4">
            No cafés found within 100km of your location. Try searching for a different city or browse all partner cafés.
          </p>
          {userLocation && (
            <p className="text-brand-text-muted/70 text-sm mb-4">
              📍 Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </p>
          )}
          <Link
            to="/business#shops"
            className="inline-flex items-center gap-2 text-brand-accent hover:text-white transition-colors text-sm font-medium"
          >
            View All Partner Cafés
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Cafés Near You
        </h2>
        <p className="text-brand-text/80">
          Discover perfect coffee pairings at these nearby locations
        </p>
        {userLocation && (
          <p className="text-brand-text-muted/70 text-sm mt-2">
            📍 Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {cafes.map((cafe) => (
          <Link
            key={cafe.id}
            to={`/s/${cafe.shop_slug}`}
            className="block glass-panel rounded-2xl p-6 hover:scale-[1.02] transition-transform cursor-pointer border-2 border-transparent hover:border-brand-accent/30"
          >
            <div className="flex items-start gap-4">
              {/* Logo or Icon */}
              <div className="flex-shrink-0">
                {cafe.logo_url ? (
                  <OptimizedImage
                    src={cafe.logo_url}
                    alt={cafe.cafe_name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-brand-accent/20 flex items-center justify-center">
                    <CoffeeIcon className="h-8 w-8 text-brand-accent" />
                  </div>
                )}
              </div>

              {/* Cafe Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-white truncate">
                      {cafe.cafe_name}
                    </h3>
                    
                    {/* Google Rating */}
                    {cafe.google_rating && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(cafe.google_rating!)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-600'
                              }`}
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-white font-semibold">
                          {cafe.google_rating.toFixed(1)}
                        </span>
                        {cafe.google_review_count && (
                          <span className="text-xs text-brand-text-muted">
                            ({cafe.google_review_count.toLocaleString()} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {cafe.distance !== undefined && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1 bg-brand-accent/20 text-brand-accent px-3 py-1 rounded-full text-sm font-semibold">
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {formatDistance(cafe.distance)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Opening Status */}
                {cafe.google_opening_hours && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg
                      className={`w-4 h-4 ${
                        cafe.google_opening_hours.open_now ? 'text-green-500' : 'text-red-500'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span
                      className={`text-sm ${
                        cafe.google_opening_hours.open_now ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {cafe.google_opening_hours.open_now ? 'Open now' : 'Closed'}
                    </span>
                    {cafe.google_price_level !== undefined && (
                      <>
                        <span className="text-brand-text-muted">•</span>
                        <span className="text-sm text-brand-text-muted">
                          {'€'.repeat(cafe.google_price_level || 1)}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {cafe.address && (
                  <p className="text-brand-text-muted text-sm mb-1 line-clamp-1">
                    {cafe.address}
                  </p>
                )}

                {(cafe.city || cafe.country) && (
                  <p className="text-brand-text-muted text-xs">
                    {[cafe.city, cafe.country].filter(Boolean).join(', ')}
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-brand-accent text-sm font-medium">
                      <span>View Menu</span>
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
                    </div>
                    
                    {userLocation && cafe.latitude && cafe.longitude && (
                      <button
                        onClick={(e) => handleGetDirections(cafe, e)}
                        className="inline-flex items-center gap-1.5 bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-brand-accent/30"
                      >
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
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                          />
                        </svg>
                        Get Directions
                      </button>
                    )}
                  </div>
                  
                  {/* Google Attribution */}
                  {cafe.google_rating && (
                    <div className="flex items-center gap-1.5 text-xs text-brand-text-muted/70">
                      <span>Powered by</span>
                      <span className="font-semibold text-brand-text-muted">Google</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>

      {/* Directions Modal */}
      {selectedCafe && userLocation && (
        <CafeDirectionsModal
          isOpen={isDirectionsModalOpen}
          onClose={handleCloseDirections}
          cafeName={selectedCafe.cafe_name}
          userLocation={userLocation}
          cafeLocation={{
            lat: selectedCafe.latitude!,
            lng: selectedCafe.longitude!,
          }}
          cafeAddress={selectedCafe.address}
        />
      )}
    </>
  );
};

