import React from 'react';
import { Link } from 'react-router-dom';
import { CoffeeIcon } from '../icons/CoffeeIcon';
import { formatDistance } from '../../services/googleMapsService';
import { OptimizedImage } from '../OptimizedImage';

interface Cafe {
  id: string;
  cafe_name: string;
  shop_slug: string;
  address?: string;
  city?: string;
  country?: string;
  logo_url?: string;
  distance?: number; // in meters
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
            Try searching for a different location or browse all partner cafés.
          </p>
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Cafés Near You
        </h2>
        <p className="text-brand-text/80">
          Discover perfect coffee pairings at these nearby locations
        </p>
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
                  <h3 className="text-xl font-semibold text-white truncate">
                    {cafe.cafe_name}
                  </h3>
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

                <div className="mt-3 flex items-center gap-2 text-brand-accent text-sm font-medium">
                  <span>Visit Café</span>
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
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

