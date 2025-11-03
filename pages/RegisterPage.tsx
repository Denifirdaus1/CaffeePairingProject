import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CoffeeIcon } from '../components/icons/CoffeeIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { Spinner } from '../components/Spinner';
import { Toast } from '../components/Toast';
import { LocationPickerManual } from '../components/LocationPickerManual';
import { PlacesAutocomplete } from '../components/PlacesAutocomplete';
import { PlacePreviewCard } from '../components/PlacePreviewCard';
import { PlaceDetails, placeDetailsToDbFormat } from '../services/googlePlacesService';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    cafe_name: '',
    cafe_description: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    website: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  
  // Google Places integration
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [useManualEntry, setUseManualEntry] = useState(false);
  
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLocationSelect = (location: {
    formattedAddress: string;
    location: { lat: number; lng: number };
    city?: string;
    country?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: location.formattedAddress,
      city: location.city || '',
      country: location.country || '',
      latitude: location.location.lat,
      longitude: location.location.lng,
    }));
    setLocationError(null);
  };

  const handlePlaceSelect = (place: PlaceDetails) => {
    console.log('📍 Selected place from Google:', place);
    setSelectedPlace(place);
    setLocationError(null);
  };

  const handleConfirmPlace = () => {
    if (!selectedPlace) return;
    
    const placeData = placeDetailsToDbFormat(selectedPlace);
    
    setFormData(prev => ({
      ...prev,
      cafe_name: placeData.cafe_name,
      address: placeData.address,
      city: placeData.city || '',
      country: placeData.country || '',
      phone: placeData.phone || '',
      website: placeData.website || '',
      latitude: placeData.latitude,
      longitude: placeData.longitude,
      // Pass all Google Places data
      google_place_id: placeData.google_place_id,
      google_rating: placeData.google_rating,
      google_review_count: placeData.google_review_count,
      google_photo_url: placeData.google_photo_url,
      google_formatted_phone: placeData.google_formatted_phone,
      google_international_phone: placeData.google_international_phone,
      google_website: placeData.google_website,
      google_opening_hours: placeData.google_opening_hours,
      google_business_status: placeData.google_business_status,
      google_price_level: placeData.google_price_level,
      google_types: placeData.google_types,
    } as any));
    
    setLocationError(null);
    setToast({
      message: '✓ Café information imported from Google Maps',
      type: 'success',
    });
  };

  const handleCancelPlace = () => {
    setSelectedPlace(null);
  };

  const handleToggleManualEntry = () => {
    setUseManualEntry(!useManualEntry);
    setSelectedPlace(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLocationError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setLocationError('Please select your café location');
      return;
    }

    try {
      await signUp(formData);
      setToast({ message: 'Account created successfully!', type: 'success' });
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      
      // Handle rate limiting
      if (errorMessage.includes('wait') && errorMessage.includes('seconds')) {
        setIsRateLimited(true);
        const waitTime = parseInt(errorMessage.match(/\d+/)?.[0] || '6');
        setCooldownTime(waitTime);
        
        // Start countdown
        const interval = setInterval(() => {
          setCooldownTime(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsRateLimited(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface flex flex-col py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Button */}
      <div className="max-w-2xl w-full mx-auto mb-4">
        <Link
          to="/business"
          className="inline-flex items-center gap-2 text-brand-text/70 hover:text-white transition-colors text-sm"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="max-w-2xl w-full space-y-8 mx-auto">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-3xl bg-brand-primary/80 p-4 text-brand-accent shadow-2xl ring-1 ring-brand-accent/40">
              <CoffeeIcon className="h-12 w-12" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Create Your Account</h2>
          <p className="mt-2 text-brand-text/70">Start your café's AI-powered journey</p>
        </div>

        <div className="glass-panel rounded-3xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-brand-text/90 mb-2">
                  Full Name *
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-brand-text/90 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-brand-text/90 mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-text/90 mb-2">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cafe_name" className="block text-sm font-medium text-brand-text/90 mb-2">
                Café Name *
              </label>
              <input
                id="cafe_name"
                name="cafe_name"
                type="text"
                required
                value={formData.cafe_name}
                onChange={handleChange}
                className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                placeholder="Your café name"
              />
            </div>

            <div>
              <label htmlFor="cafe_description" className="block text-sm font-medium text-brand-text/90 mb-2">
                Café Description
              </label>
              <textarea
                id="cafe_description"
                name="cafe_description"
                rows={3}
                value={formData.cafe_description}
                onChange={handleChange}
                className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                placeholder="Tell us about your café..."
              />
            </div>

            {/* Google Places Search or Manual Entry */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-brand-text/90">
                  Café Location *
                </label>
                <button
                  type="button"
                  onClick={handleToggleManualEntry}
                  className="text-xs text-brand-accent hover:text-white transition-colors"
                >
                  {useManualEntry ? '← Use Google Maps Search' : 'Enter Manually →'}
                </button>
              </div>

              {!useManualEntry && !selectedPlace && (
                <div>
                  <PlacesAutocomplete
                    onPlaceSelect={handlePlaceSelect}
                    placeholder="Search for your café on Google Maps..."
                    types={['cafe', 'restaurant', 'bakery', 'food']}
                  />
                </div>
              )}

              {!useManualEntry && selectedPlace && (
                <div>
                  <PlacePreviewCard
                    place={selectedPlace}
                    onConfirm={handleConfirmPlace}
                    onCancel={handleCancelPlace}
                  />
                </div>
              )}

              {useManualEntry && (
                <LocationPickerManual
                  onLocationSelect={handleLocationSelect}
                  value={
                    formData.latitude && formData.longitude
                      ? {
                          formattedAddress: formData.address || `${formData.latitude}, ${formData.longitude}`,
                          location: { lat: formData.latitude, lng: formData.longitude },
                          city: formData.city || undefined,
                          country: formData.country || undefined,
                        }
                      : null
                  }
                  error={locationError || undefined}
                  required={true}
                />
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-900/40 p-3 text-red-200 text-sm">
                {error}
              </div>
            )}
            {locationError && (
              <div className="rounded-xl bg-red-900/40 p-3 text-red-200 text-sm">
                {locationError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isRateLimited}
              className="button-primary-pulse w-full rounded-xl bg-gradient-to-r from-brand-accent via-brand-accent/90 to-amber-400/70 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-brand-text/50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner />
                  <span>Creating Account...</span>
                </div>
              ) : isRateLimited ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Please wait {cooldownTime}s...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-brand-text/70">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-brand-accent hover:text-brand-accent/80 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
