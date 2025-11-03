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
import { compressImage, isImageFile, formatFileSize } from '../utils/imageCompression';

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
  
  // Logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
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

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file is an image
      if (!isImageFile(file)) {
        setToast({ message: 'Please upload a valid image file (JPG, PNG, WebP)', type: 'error' });
        return;
      }

      // Show original size
      console.log('📷 Original logo:', formatFileSize(file.size));

      try {
        // Compress image (logo size: 400x400, higher quality for logos)
        const compressedFile = await compressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.9,
          targetFormat: 'webp'
        });

        setLogoFile(compressedFile);
        setLogoPreview(URL.createObjectURL(compressedFile));
        
        setToast({ 
          message: `✅ Logo compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`, 
          type: 'success' 
        });
      } catch (error) {
        console.error('Logo compression failed:', error);
        // Fallback: use original file if compression fails
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      }
    }
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
      await signUp(formData, logoFile);
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
            {/* Google Places Search or Manual Entry - MOVED TO TOP */}
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
                {selectedPlace && formData.cafe_name && (
                  <span className="ml-2 text-xs text-green-400">✓ Auto-filled from Google Maps</span>
                )}
              </label>
              <input
                id="cafe_name"
                name="cafe_name"
                type="text"
                required
                value={formData.cafe_name}
                onChange={handleChange}
                readOnly={selectedPlace !== null && formData.cafe_name !== ''}
                className={`w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors ${
                  selectedPlace && formData.cafe_name ? 'bg-white/5 cursor-not-allowed' : ''
                }`}
                placeholder="Your café name"
              />
              {selectedPlace && formData.cafe_name && (
                <p className="mt-1.5 text-xs text-brand-text-muted">
                  💡 Café name is auto-filled from Google Maps and cannot be edited
                </p>
              )}
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

            {/* Logo Upload */}
            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-brand-text/90 mb-2">
                Café Logo
                <span className="ml-2 text-xs text-brand-text-muted">(Optional)</span>
              </label>
              <div className="flex items-start gap-4">
                {logoPreview ? (
                  <div className="relative flex-shrink-0">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-24 h-24 rounded-xl object-cover border-2 border-brand-accent/30"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                      aria-label="Remove logo"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-brand-accent/30 flex items-center justify-center bg-brand-bg/50">
                    <svg className="w-8 h-8 text-brand-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo"
                    className="inline-flex items-center gap-2 bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent px-4 py-2 rounded-lg cursor-pointer transition-colors border border-brand-accent/30"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {logoFile ? 'Change Logo' : 'Upload Logo'}
                  </label>
                  <p className="mt-2 text-xs text-brand-text-muted">
                    Recommended: Square image, 400x400px. Auto-compressed to WebP format.
                  </p>
                </div>
              </div>
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
