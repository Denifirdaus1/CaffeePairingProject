import React, { useState } from 'react';
import {
  PlaceDetails,
  formatOpeningHours,
  isPlaceOpen,
  formatPriceLevel,
  formatBusinessStatus,
} from '../services/googlePlacesService';

interface PlacePreviewCardProps {
  place: PlaceDetails;
  onConfirm?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export const PlacePreviewCard: React.FC<PlacePreviewCardProps> = ({
  place,
  onConfirm,
  onCancel,
  showActions = true,
}) => {
  const [showAllHours, setShowAllHours] = useState(false);
  
  const openStatus = isPlaceOpen(place.opening_hours);
  const openingHoursText = formatOpeningHours(place.opening_hours);
  const priceLevel = formatPriceLevel(place.price_level);
  const businessStatus = formatBusinessStatus(place.business_status);
  
  // Get current day index (0 = Sunday, 1 = Monday, etc.)
  const currentDayIndex = new Date().getDay();
  const currentDayText = openingHoursText[currentDayIndex] || openingHoursText[0];
  
  // Format price range (€1-10 style)
  const getPriceRange = (level?: number) => {
    if (!level) return null;
    const prices = ['€1-5', '€5-10', '€10-20', '€20+'];
    return prices[level - 1] || null;
  };
  const priceRange = getPriceRange(place.price_level);
  
  // Get main photo
  const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 800 });

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border-2 border-brand-accent/30">
      {/* Header */}
      <div className="bg-brand-accent/10 px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h3 className="text-lg font-semibold text-white">
            Selected Café from Google Maps
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Top Section: Photo, Name, and Map Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Photo and Basic Info */}
          <div className="flex gap-4">
            {/* Photo */}
            {photoUrl && (
              <div className="flex-shrink-0">
                <img
                  src={photoUrl}
                  alt={place.name}
                  className="w-24 h-24 rounded-lg object-cover border-2 border-white/10"
                />
              </div>
            )}

            {/* Name and Type */}
            <div className="flex-1 min-w-0">
            <h4 className="text-xl font-bold text-white mb-1">{place.name}</h4>
            
            {/* Type & Price */}
            {(place.types || priceRange) && (
              <div className="flex items-center gap-2 text-sm text-brand-text-muted mb-2">
                {place.types?.[0] && (
                  <span className="capitalize bg-white/5 px-2 py-0.5 rounded">
                    {place.types[0].replace(/_/g, ' ')}
                  </span>
                )}
                {priceRange && (
                  <span className="text-green-400 font-semibold">{priceRange}</span>
                )}
              </div>
            )}

            {/* Rating */}
            {place.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(place.rating!)
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
                <span className="text-white font-semibold text-sm">{place.rating.toFixed(1)}</span>
                {place.user_ratings_total && (
                  <span className="text-brand-text-muted text-xs">
                    ({place.user_ratings_total.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}
          </div>
          </div>

          {/* Right: Map Preview */}
          {place.geometry?.location && (
            <div className="rounded-lg overflow-hidden border-2 border-white/10 h-48 md:h-auto">
              <iframe
                title="Location Preview"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '200px' }}
                loading="lazy"
                src={`https://www.google.com/maps/embed/v1/place?key=${window.__GOOGLE_MAPS_API_KEY__}&q=place_id:${place.place_id}&zoom=16`}
              />
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="space-y-2.5 pt-3 border-t border-white/10">
          {/* Opening Hours - Top Position with Dropdown */}
          {openingHoursText.length > 0 && (
            <div className="p-3 bg-brand-accent/5 rounded-lg border border-brand-accent/20">
              <button
                onClick={() => setShowAllHours(!showAllHours)}
                className="w-full flex items-center justify-between text-left hover:bg-white/5 transition-colors rounded p-1 -m-1"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-4 h-4 ${openStatus.isOpen ? 'text-green-500' : 'text-red-500'}`}
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
                  <span className={`text-sm font-medium ${openStatus.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                    {openStatus.text}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-brand-text-muted transition-transform ${showAllHours ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="mt-2 space-y-1">
                {/* Current Day - Always Visible */}
                {currentDayText && (
                  <p className="text-brand-text text-xs font-mono leading-relaxed">
                    {currentDayText}
                  </p>
                )}
                
                {/* All Days - Collapsible */}
                {showAllHours && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                    {openingHoursText.filter((_, idx) => idx !== currentDayIndex).map((text, index) => (
                      <p key={index} className="text-brand-text-muted text-xs font-mono leading-relaxed">
                        {text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Address */}
          <div className="flex items-start gap-3">
            <svg
              className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5"
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
            <span className="text-brand-text text-sm leading-relaxed">{place.formatted_address}</span>
          </div>

          {/* Phone */}
          {place.formatted_phone_number && (
            <div className="flex items-center gap-3">
              <svg
                className="w-4 h-4 text-brand-accent flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span className="text-brand-text text-sm">{place.formatted_phone_number}</span>
            </div>
          )}

          {/* Website */}
          {place.website && (
            <div className="flex items-center gap-3">
              <svg
                className="w-4 h-4 text-brand-accent flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent hover:text-white transition-colors truncate text-sm"
              >
                {place.website}
              </a>
            </div>
          )}

          {/* Business Status */}
          {place.business_status && place.business_status !== 'OPERATIONAL' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <svg
                className="w-4 h-4 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-yellow-400 text-sm font-medium">{businessStatus}</span>
            </div>
          )}
        </div>

        {/* Info Badge */}
        <div className="p-3 bg-brand-accent/10 rounded-lg border border-brand-accent/20">
          <p className="text-brand-text text-xs leading-relaxed">
            ✓ All information verified by Google Maps. This data will be saved to your café profile.
          </p>
        </div>
      </div>

      {/* Actions */}
      {showActions && (onConfirm || onCancel) && (
        <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-5 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium text-sm border border-white/10"
            >
              Search Again
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="flex-1 px-5 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-lg transition-colors font-semibold text-sm shadow-lg shadow-brand-accent/20"
            >
              Use This Café
            </button>
          )}
        </div>
      )}

      {/* Google Attribution */}
      <div className="px-6 py-2.5 bg-white/5 border-t border-white/10 flex items-center justify-center gap-1.5">
        <span className="text-brand-text-muted text-xs">Powered by</span>
        <span className="text-white text-xs font-semibold">Google Maps</span>
      </div>
    </div>
  );
};

