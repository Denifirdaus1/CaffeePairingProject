import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getCurrentLocation } from '../services/googleMapsService';
import { LocationPermissionPrompt } from '../components/customer/LocationPermissionPrompt';
import { NearbyCafesList } from '../components/customer/NearbyCafesList';
import { CoffeeIcon } from '../components/icons/CoffeeIcon';

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
  // Google Places data
  google_rating?: number;
  google_review_count?: number;
  google_photo_url?: string;
  google_opening_hours?: any;
  google_business_status?: string;
  google_price_level?: number;
}

interface NearbyCafe extends Cafe {
  distance: number; // in meters
}

type Phase = 'permission' | 'permission_denied' | 'loading' | 'results';

export const CustomerHomePage: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('permission');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyCafes, setNearbyCafes] = useState<NearbyCafe[]>([]);
  const [allCafes, setAllCafes] = useState<NearbyCafe[]>([]); // Store all cafes for filtering
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Check if geolocation is supported
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please use a modern browser with GPS support.');
      setPhase('permission_denied');
    }
  }, []);

  const handleRequestPermission = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🌍 Requesting user GPS location...');
      const location = await getCurrentLocation();
      console.log('✅ Got real user GPS location:', location);
      
      setUserLocation(location);
      setPhase('loading');
      await fetchNearbyCafes(location);
    } catch (err: any) {
      console.error('❌ Error getting real GPS location:', err);
      
      // Provide specific error messages
      let errorMessage = 'Unable to access your GPS location. ';
      
      if (err.code === 1) { // PERMISSION_DENIED
        errorMessage += 'You denied location permission. Please enable location access in your browser settings to find nearby cafés.';
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        errorMessage += 'Your location is currently unavailable. Please check your device GPS settings.';
      } else if (err.code === 3) { // TIMEOUT
        errorMessage += 'Location request timed out. Please try again.';
      } else {
        errorMessage += err.message || 'Please allow location access to continue.';
      }
      
      setPhase('permission_denied');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPermission = () => {
    setPhase('permission');
    setError(null);
    setUserLocation(null);
    setNearbyCafes([]);
    setAllCafes([]);
  };

  const fetchNearbyCafes = async (location: { lat: number; lng: number }, expandedRadius: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const searchRadius = expandedRadius ? 500 : 100; // 100km normal, 500km expanded
      console.log(`🗺️ Searching for cafes within ${searchRadius}km from GPS location:`, location);

      // Search within realistic radius
      const { data: cafes, error: cafesError } = await supabase.rpc('find_nearby_cafes', {
        user_lat: location.lat,
        user_lng: location.lng,
        radius_km: searchRadius,
        max_results: 100,
      });

      if (cafesError) {
        console.error('Error calling find_nearby_cafes:', cafesError);
        throw new Error(`Failed to fetch cafés: ${cafesError.message}`);
      }

      console.log(`✅ Found ${cafes?.length || 0} cafes within ${searchRadius}km`);

      if (!cafes || cafes.length === 0) {
        setNearbyCafes([]);
        setAllCafes([]);
        setPhase('results');
        return;
      }

      // Convert distance_km to meters for compatibility
      const cafesWithDistance: NearbyCafe[] = cafes.map((cafe) => ({
        id: cafe.id,
        cafe_name: cafe.cafe_name,
        shop_slug: cafe.shop_slug,
        address: cafe.address,
        city: cafe.city,
        country: cafe.country,
        logo_url: cafe.logo_url,
        latitude: cafe.latitude,
        longitude: cafe.longitude,
        distance: cafe.distance_km * 1000, // Convert km to meters (REAL distance from user GPS)
        // Google Places data
        google_rating: cafe.google_rating,
        google_review_count: cafe.google_review_count,
        google_photo_url: cafe.google_photo_url,
        google_opening_hours: cafe.google_opening_hours,
        google_business_status: cafe.google_business_status,
        google_price_level: cafe.google_price_level,
      }));

      setAllCafes(cafesWithDistance); // Store all cafes
      setNearbyCafes(cafesWithDistance); // Initially show all
      setPhase('results');
    } catch (err: any) {
      console.error('❌ Error fetching cafés:', err);
      setError(err.message || 'Failed to load cafés');
      setPhase('results');
    } finally {
      setLoading(false);
    }
  };

  const handleExpandSearch = () => {
    if (userLocation) {
      fetchNearbyCafes(userLocation, true);
    }
  };

  // Filter cafes based on search input (city, name, etc.)
  const handleSearchFilter = (searchTerm: string) => {
    setSearchFilter(searchTerm);
    
    if (!searchTerm.trim()) {
      setNearbyCafes(allCafes);
      return;
    }

    const filtered = allCafes.filter(cafe => {
      const searchLower = searchTerm.toLowerCase();
      return (
        cafe.cafe_name.toLowerCase().includes(searchLower) ||
        cafe.city?.toLowerCase().includes(searchLower) ||
        cafe.country?.toLowerCase().includes(searchLower) ||
        cafe.address?.toLowerCase().includes(searchLower)
      );
    });

    setNearbyCafes(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface">
      {/* Header */}
      <header className="relative z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3 text-white">
              <CoffeeIcon className="h-8 w-8 text-brand-accent" />
              <span className="text-xl font-bold">Café Pairing</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/business"
                className="text-sm font-medium text-brand-text hover:text-white transition-colors"
              >
                For Café Owners
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        {phase === 'permission' && (
          <LocationPermissionPrompt
            onRequestPermission={handleRequestPermission}
            onSkip={undefined} // Remove skip option - GPS is required
          />
        )}

        {phase === 'permission_denied' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="glass-panel rounded-3xl p-8">
              <div className="text-center mb-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  GPS Location Required
                </h2>
                <p className="text-brand-text/80 mb-6">
                  {error || 'We need access to your GPS location to show accurate distances to cafés.'}
                </p>
                
                <div className="space-y-4 text-left bg-brand-bg/50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-brand-text font-semibold">How to enable location access:</p>
                  <ol className="text-sm text-brand-text/80 space-y-2 list-decimal list-inside">
                    <li>Click the location icon (🔒 or ⓘ) in your browser's address bar</li>
                    <li>Select "Allow" or "Always allow" for location access</li>
                    <li>Refresh the page and try again</li>
                  </ol>
                </div>

                <button
                  onClick={handleRetryPermission}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {(phase === 'loading' || phase === 'results') && (
          <>
            {/* Search Filter */}
            {phase === 'results' && allCafes.length > 0 && (
              <div className="max-w-4xl mx-auto mb-6">
                <div className="glass-panel rounded-2xl p-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => handleSearchFilter(e.target.value)}
                      placeholder="Filter by café name, city, or country..."
                      className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 pl-12 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                    />
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-accent"
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
                  </div>
                  <p className="text-xs text-brand-text-muted mt-2 text-center">
                    📍 Your GPS: {userLocation ? `(${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})` : ''} • Showing cafés within 100km
                  </p>
                </div>
              </div>
            )}

            {/* No Cafes Found - Show Expand Option */}
            {phase === 'results' && allCafes.length === 0 && !loading && (
              <div className="max-w-2xl mx-auto">
                <div className="glass-panel rounded-3xl p-8 text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-brand-accent/20 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    No Cafés Found Nearby
                  </h3>
                  <p className="text-brand-text/80 mb-2">
                    We couldn't find any partner cafés within 100km of your location.
                  </p>
                  <p className="text-sm text-brand-text-muted mb-6">
                    📍 Your GPS: {userLocation ? `(${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})` : ''}
                  </p>
                  
                  <button
                    onClick={handleExpandSearch}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Expand Search to 500km
                  </button>

                  <p className="text-xs text-brand-text-muted mt-4">
                    💡 Or try refreshing your location if you've moved recently
                  </p>
                </div>
              </div>
            )}

            {allCafes.length > 0 && (
              <NearbyCafesList
                cafes={nearbyCafes}
                userLocation={userLocation || undefined}
                loading={loading}
              />
            )}
          </>
        )}

        {error && phase === 'results' && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="rounded-xl bg-red-900/40 p-4 text-red-200 text-sm text-center">
              {error}
            </div>
          </div>
        )}

        {/* Refresh Location Button */}
        {phase === 'results' && userLocation && (
          <div className="max-w-4xl mx-auto mt-6 text-center">
            <button
              onClick={handleRetryPermission}
              className="inline-flex items-center gap-2 text-brand-text hover:text-white font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Refresh My Location
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

