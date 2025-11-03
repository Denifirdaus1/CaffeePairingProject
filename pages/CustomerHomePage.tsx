import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getCurrentLocation } from '../services/googleMapsService';
import { LocationPermissionPrompt } from '../components/customer/LocationPermissionPrompt';
import { LocationSearchFallback } from '../components/customer/LocationSearchFallback';
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

type Phase = 'permission' | 'fallback' | 'loading' | 'results';

export const CustomerHomePage: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('permission');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyCafes, setNearbyCafes] = useState<NearbyCafe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if geolocation is supported
  useEffect(() => {
    if (!navigator.geolocation) {
      // Browser doesn't support geolocation, go directly to fallback
      setPhase('fallback');
    }
  }, []);

  const handleRequestPermission = async () => {
    setLoading(true);
    setError(null);

    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      setPhase('loading');
      await fetchNearbyCafes(location);
    } catch (err: any) {
      console.error('Error getting location:', err);
      // Permission denied or error occurred
      setPhase('fallback');
      setError('Unable to access your location. Please use the search below.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPermission = () => {
    setPhase('fallback');
  };

  const handleLocationSearch = async (location: { lat: number; lng: number }) => {
    setUserLocation(location);
    setPhase('loading');
    await fetchNearbyCafes(location);
  };

  const fetchNearbyCafes = async (location: { lat: number; lng: number }) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🗺️ Searching for nearby cafes at:', location);

      // Use database function for efficient nearby search (Haversine formula)
      const { data: cafes, error: cafesError } = await supabase.rpc('find_nearby_cafes', {
        user_lat: location.lat,
        user_lng: location.lng,
        radius_km: 100, // Search within 100km radius (increased for better coverage)
        max_results: 50, // Max 50 results
      });

      if (cafesError) {
        console.error('Error calling find_nearby_cafes:', cafesError);
        throw new Error(`Failed to fetch cafés: ${cafesError.message}`);
      }

      console.log(`✅ Found ${cafes?.length || 0} cafes nearby`);

      if (!cafes || cafes.length === 0) {
        setNearbyCafes([]);
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
        distance: cafe.distance_km * 1000, // Convert km to meters
        // Google Places data
        google_rating: cafe.google_rating,
        google_review_count: cafe.google_review_count,
        google_photo_url: cafe.google_photo_url,
        google_opening_hours: cafe.google_opening_hours,
        google_business_status: cafe.google_business_status,
        google_price_level: cafe.google_price_level,
      }));

      setNearbyCafes(cafesWithDistance);
      setPhase('results');
    } catch (err: any) {
      console.error('❌ Error fetching nearby cafés:', err);
      setError(err.message || 'Failed to load nearby cafés');
      setPhase('results');
    } finally {
      setLoading(false);
    }
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
            onSkip={handleSkipPermission}
          />
        )}

        {phase === 'fallback' && (
          <LocationSearchFallback onLocationSelect={handleLocationSearch} />
        )}

        {(phase === 'loading' || phase === 'results') && (
          <NearbyCafesList
            cafes={nearbyCafes}
            userLocation={userLocation || undefined}
            loading={loading}
          />
        )}

        {error && phase === 'results' && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="rounded-xl bg-red-900/40 p-4 text-red-200 text-sm text-center">
              {error}
            </div>
          </div>
        )}

        {/* Try Again Button */}
        {phase === 'results' && (
          <div className="max-w-4xl mx-auto mt-6 text-center">
            <button
              onClick={() => {
                setPhase('permission');
                setUserLocation(null);
                setNearbyCafes([]);
                setError(null);
              }}
              className="text-brand-text hover:text-white font-medium transition-colors"
            >
              Search Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

