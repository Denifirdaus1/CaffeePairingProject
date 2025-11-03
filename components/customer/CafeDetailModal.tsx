import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface CafeDetailModalProps {
  cafe: {
    id: string;
    cafe_name: string;
    address?: string;
    city?: string;
    country?: string;
    latitude?: string;
    longitude?: string;
    distance?: number;
    shop_slug?: string;
    // Google data
    google_place_id?: string;
    google_photo_url?: string;
    google_rating?: number | string;
    google_review_count?: number;
    google_price_level?: number;
    google_opening_hours?: {
      open_now?: boolean;
      weekday_text?: string[];
    };
    google_website?: string;
    google_formatted_phone?: string;
  };
  userLocation?: { lat: number; lng: number };
  onClose: () => void;
  onGetDirections: () => void;
}

export const CafeDetailModal: React.FC<CafeDetailModalProps> = ({
  cafe,
  userLocation,
  onClose,
  onGetDirections,
}) => {
  const [showAllHours, setShowAllHours] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Get current day index (0 = Sunday, 1 = Monday, etc.)
  const currentDayIndex = new Date().getDay();
  const weekdayText = cafe.google_opening_hours?.weekday_text || [];
  const currentDayText = weekdayText[currentDayIndex] || weekdayText[0];

  // Parse rating (handle both number and string)
  const rating = typeof cafe.google_rating === 'string' 
    ? parseFloat(cafe.google_rating) 
    : cafe.google_rating;

  // Format price range
  const getPriceRange = (level?: number) => {
    if (!level) return null;
    const prices = ['€1-5', '€5-10', '€10-20', '€20+'];
    return prices[level - 1] || null;
  };
  const priceRange = getPriceRange(cafe.google_price_level);

  // Generate Google Maps embed URL
  const embedMapUrl = cafe.google_place_id 
    ? `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=place_id:${cafe.google_place_id}&zoom=16`
    : cafe.latitude && cafe.longitude
    ? `https://www.google.com/maps/embed/v1/view?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&center=${cafe.latitude},${cafe.longitude}&zoom=16`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-panel rounded-2xl border-2 border-brand-accent/30">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header with Photo */}
        {cafe.google_photo_url && !photoError ? (
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img
              src={cafe.google_photo_url}
              alt={cafe.cafe_name}
              className="w-full h-full object-cover"
              onError={() => setPhotoError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{cafe.cafe_name}</h2>
                  {priceRange && (
                    <span className="inline-flex items-center bg-green-500/20 border border-green-500/40 px-3 py-1 rounded-full text-sm text-green-300 font-semibold">
                      {priceRange}
                    </span>
                  )}
                </div>
                {cafe.distance !== undefined && (
                  <span className="inline-flex items-center gap-1 bg-brand-accent/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-lg font-bold">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {formatDistance(cafe.distance)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-brand-accent/10 px-6 py-8 border-b border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{cafe.cafe_name}</h2>
                {priceRange && (
                  <span className="inline-flex items-center bg-green-500/20 border border-green-500/40 px-3 py-1 rounded-full text-sm text-green-300 font-semibold">
                    {priceRange}
                  </span>
                )}
              </div>
              {cafe.distance !== undefined && (
                <span className="inline-flex items-center gap-1 bg-brand-accent/30 text-white px-4 py-2 rounded-full text-lg font-bold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {formatDistance(cafe.distance)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rating and Status Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Rating */}
            {rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(rating)
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
                <span className="text-white font-bold text-lg">{rating.toFixed(1)}</span>
                {cafe.google_review_count && (
                  <span className="text-brand-text-muted text-sm">
                    ({cafe.google_review_count.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}

            {/* Opening Status */}
            {cafe.google_opening_hours && (
              <div className="flex items-center gap-2">
                <svg
                  className={`w-5 h-5 ${
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
                  className={`font-semibold ${
                    cafe.google_opening_hours.open_now ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {cafe.google_opening_hours.open_now ? 'Open now' : 'Closed'}
                </span>
              </div>
            )}

            {/* Price Level */}
            {cafe.google_price_level && (
              <span className="text-brand-text-muted">
                {'€'.repeat(cafe.google_price_level)}
              </span>
            )}
          </div>

          {/* Opening Hours */}
          {weekdayText.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4">
              <button
                onClick={() => setShowAllHours(!showAllHours)}
                className="w-full flex items-center justify-between text-left mb-2"
              >
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Opening Hours
                </h3>
                <svg
                  className={`w-5 h-5 text-brand-text-muted transition-transform ${showAllHours ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showAllHours ? (
                <div className="space-y-1">
                  {weekdayText.map((day, index) => (
                    <p
                      key={index}
                      className={`text-sm leading-relaxed ${
                        index === currentDayIndex
                          ? 'text-white font-semibold bg-brand-accent/20 px-2 py-1 rounded'
                          : 'text-brand-text-muted'
                      }`}
                    >
                      {day}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-white font-semibold bg-brand-accent/20 px-2 py-1 rounded inline-block">
                  {currentDayText}
                </p>
              )}
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-3">
            {cafe.address && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-brand-text-muted leading-relaxed">{cafe.address}</p>
              </div>
            )}

            {cafe.google_formatted_phone && (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${cafe.google_formatted_phone}`} className="text-brand-accent hover:text-brand-accent/80 transition-colors">
                  {cafe.google_formatted_phone}
                </a>
              </div>
            )}

            {cafe.google_website && (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <a
                  href={cafe.google_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-accent hover:text-brand-accent/80 transition-colors truncate"
                >
                  {cafe.google_website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </div>
            )}
          </div>

          {/* Map Preview */}
          {embedMapUrl && (
            <div className="rounded-xl overflow-hidden border-2 border-white/10">
              <iframe
                src={embedMapUrl}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Cafe Location"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/s/${cafe.shop_slug}`}
              className="flex-1 btn-primary text-center py-4 rounded-xl font-semibold"
            >
              View Menu & Pairings
            </Link>
            <button
              onClick={onGetDirections}
              className="flex-1 btn-secondary py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Get Directions
            </button>
          </div>

          {/* Google Verification Badge */}
          {cafe.google_rating && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 rounded-lg">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-brand-text-muted">Verified by</span>
              <span className="font-bold text-white">Google</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

