import React from 'react';
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
  const openStatus = isPlaceOpen(place.opening_hours);
  const openingHoursText = formatOpeningHours(place.opening_hours);
  const priceLevel = formatPriceLevel(place.price_level);
  const businessStatus = formatBusinessStatus(place.business_status);
  
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
      <div className="p-6">
        <div className="flex gap-6">
          {/* Photo */}
          {photoUrl && (
            <div className="flex-shrink-0">
              <img
                src={photoUrl}
                alt={place.name}
                className="w-32 h-32 rounded-xl object-cover"
              />
            </div>
          )}

          {/* Details */}
          <div className="flex-1 space-y-3">
            {/* Name */}
            <h4 className="text-2xl font-bold text-white">{place.name}</h4>

            {/* Rating */}
            {place.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${
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
                <span className="text-white font-semibold">{place.rating.toFixed(1)}</span>
                {place.user_ratings_total && (
                  <span className="text-brand-text-muted text-sm">
                    ({place.user_ratings_total.toLocaleString()} Google reviews)
                  </span>
                )}
              </div>
            )}

            {/* Type & Price */}
            {(place.types || priceLevel) && (
              <div className="flex items-center gap-2 text-sm text-brand-text-muted">
                {place.types?.[0] && (
                  <span className="capitalize">
                    {place.types[0].replace(/_/g, ' ')}
                  </span>
                )}
                {priceLevel && (
                  <>
                    <span>•</span>
                    <span>{priceLevel}</span>
                  </>
                )}
              </div>
            )}

            {/* Address */}
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5"
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
              <span className="text-brand-text">{place.formatted_address}</span>
            </div>

            {/* Phone */}
            {place.formatted_phone_number && (
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
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="text-brand-text">{place.formatted_phone_number}</span>
              </div>
            )}

            {/* Website */}
            {place.website && (
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
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-accent hover:text-white transition-colors truncate"
                >
                  {place.website}
                </a>
              </div>
            )}

            {/* Opening Status */}
            {place.opening_hours && (
              <div className="flex items-center gap-2">
                <svg
                  className={`w-5 h-5 ${openStatus.isOpen ? 'text-green-500' : 'text-red-500'}`}
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
                <span className={openStatus.isOpen ? 'text-green-400' : 'text-red-400'}>
                  {openStatus.text}
                </span>
              </div>
            )}

            {/* Business Status */}
            {place.business_status && place.business_status !== 'OPERATIONAL' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-lg">
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
        </div>

        {/* Opening Hours Details */}
        {openingHoursText.length > 0 && (
          <div className="mt-6 p-4 bg-white/5 rounded-xl">
            <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-brand-accent"
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
              Opening Hours
            </h5>
            <div className="space-y-1">
              {openingHoursText.map((text, index) => (
                <p key={index} className="text-brand-text text-sm">
                  {text}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Info Badge */}
        <div className="mt-6 p-4 bg-brand-accent/10 rounded-xl border border-brand-accent/20">
          <p className="text-brand-text text-sm">
            ✓ All information verified by Google Maps. This data will be saved to your café profile.
          </p>
        </div>
      </div>

      {/* Actions */}
      {showActions && (onConfirm || onCancel) && (
        <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between gap-4">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors font-medium"
            >
              Search Again
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-brand-accent hover:bg-brand-accent/90 text-brand-bg rounded-xl transition-colors font-semibold"
            >
              Use This Café
            </button>
          )}
        </div>
      )}

      {/* Google Attribution */}
      <div className="px-6 py-2 bg-white/5 border-t border-white/10 flex items-center justify-center gap-2">
        <span className="text-brand-text-muted text-xs">Powered by</span>
        <span className="text-white text-xs font-semibold">Google Maps</span>
      </div>
    </div>
  );
};

