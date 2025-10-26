import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CoffeeIcon } from '../components/icons/CoffeeIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { Spinner } from '../components/Spinner';
import { Toast } from '../components/Toast';
import { GoogleMapsPicker } from '../components/GoogleMapsPicker';

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
    latitude: '',
    longitude: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLocationSelect = (location: {
    address: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: location.address,
      city: location.city,
      country: location.country,
      latitude: location.lat.toString(),
      longitude: location.lng.toString()
    }));
    setShowLocationPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
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
          to="/"
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

            {/* Location Picker Section */}
            <div>
              <label className="block text-sm font-medium text-brand-text/90 mb-2">
                Café Location *
              </label>
              
              {!showLocationPicker && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    className="w-full bg-gradient-to-r from-brand-accent/20 to-amber-400/20 border border-brand-accent/50 rounded-xl p-4 text-brand-text hover:from-brand-accent/30 hover:to-amber-400/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="text-left">
                          <p className="font-medium text-white">Select Location on Map</p>
                          <p className="text-xs text-brand-text/60">
                            {formData.address || 'Click to pick your café location'}
                          </p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-brand-text/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  
                  {formData.address && (
                    <div className="flex items-center gap-2 text-sm text-brand-text/70">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{formData.address}</span>
                      {formData.city && formData.country && (
                        <span className="text-brand-text/50">• {formData.city}, {formData.country}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {showLocationPicker && (
                <div className="glass-panel rounded-xl p-4 border-2 border-brand-accent/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Pick Your Café Location</h3>
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(false)}
                      className="text-brand-text/50 hover:text-white transition-colors"
                      aria-label="Close location picker"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <GoogleMapsPicker
                    onLocationSelect={handleLocationSelect}
                    initialValue={formData.address}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-900/40 p-3 text-red-200 text-sm">
                {error}
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
