import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { CoffeeIcon } from '../icons/CoffeeIcon';
import { ExternalLinkIcon } from '../icons/ExternalLinkIcon';

interface PublicShop {
  id: string;
  cafe_name: string;
  shop_slug: string;
  cafe_description?: string;
  city?: string;
  country?: string;
  created_at: string;
}

export const PublicShopsSection: React.FC = () => {
  const [shops, setShops] = useState<PublicShop[]>([]);
  const [filteredShops, setFilteredShops] = useState<PublicShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [cities, setCities] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchPublicShops = async () => {
      try {
        const { data, error } = await supabase
          .from('cafe_profiles')
          .select('id, cafe_name, shop_slug, cafe_description, city, country, created_at')
          .not('shop_slug', 'is', null)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching shops:', error);
        } else {
          const shopsData = data || [];
          setShops(shopsData);
          setFilteredShops(shopsData);
          
          // Extract unique cities
          const uniqueCities = Array.from(
            new Set(shopsData.map(s => s.city).filter(Boolean))
          ) as string[];
          setCities(uniqueCities.sort());
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicShops();
  }, []);

  // Filter shops based on search and city
  useEffect(() => {
    let result = shops;

    // Filter by city
    if (selectedCity !== 'all') {
      result = result.filter(shop => shop.city === selectedCity);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(shop =>
        shop.cafe_name.toLowerCase().includes(query) ||
        shop.city?.toLowerCase().includes(query) ||
        shop.country?.toLowerCase().includes(query) ||
        shop.cafe_description?.toLowerCase().includes(query)
      );
    }

    setFilteredShops(result);
  }, [searchQuery, selectedCity, shops]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (shopName: string) => {
    setSearchQuery(shopName);
    setShowSuggestions(false);
  };

  const suggestions = searchQuery.trim()
    ? shops
        .filter(shop =>
          shop.cafe_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shop.city?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  if (loading) {
    return (
      <section className="py-20 px-4 bg-brand-surface/30">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
          <p className="text-brand-text">Loading shops...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-brand-surface/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-4">Discover Our Partner Cafés</h2>
          <p className="text-xl text-brand-text/80 max-w-3xl mx-auto mb-8">
            Explore coffee collections and perfect pairings from our partner cafés. 
            Each café has their own public page where customers can discover their coffee offerings.
          </p>

          {/* Search and Filter Section */}
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Search Bar with Autocomplete */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search cafés by name or city..."
                  className="w-full px-6 py-4 bg-brand-surface/60 border-2 border-brand-accent/30 rounded-2xl text-white placeholder-brand-text-muted focus:outline-none focus:border-brand-accent transition-colors pl-14"
                />
                <svg
                  className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-brand-surface border-2 border-brand-accent/30 rounded-xl shadow-2xl overflow-hidden">
                  {suggestions.map((shop) => (
                    <button
                      key={shop.id}
                      onClick={() => handleSuggestionClick(shop.cafe_name)}
                      className="w-full px-6 py-3 text-left hover:bg-brand-accent/20 transition-colors border-b border-brand-accent/10 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-semibold">{shop.cafe_name}</div>
                          {shop.city && (
                            <div className="text-xs text-brand-text-muted">
                              📍 {shop.city}{shop.country ? `, ${shop.country}` : ''}
                            </div>
                          )}
                        </div>
                        <CoffeeIcon className="h-5 w-5 text-brand-accent" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* City Filter - Horizontal Scroll */}
            <div className="relative">
              <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                <button
                  onClick={() => handleCityChange('all')}
                  className={`flex-shrink-0 px-6 py-2 rounded-full font-semibold transition-all snap-start ${
                    selectedCity === 'all'
                      ? 'bg-brand-accent text-white shadow-lg'
                      : 'bg-brand-surface/60 text-brand-text-muted hover:bg-brand-accent/20 hover:text-white'
                  }`}
                >
                  All Cities
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCityChange(city)}
                    className={`flex-shrink-0 px-6 py-2 rounded-full font-semibold transition-all snap-start ${
                      selectedCity === city
                        ? 'bg-brand-accent text-white shadow-lg'
                        : 'bg-brand-surface/60 text-brand-text-muted hover:bg-brand-accent/20 hover:text-white'
                    }`}
                  >
                    📍 {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-brand-text-muted text-center">
              Showing {filteredShops.length} {filteredShops.length === 1 ? 'café' : 'cafés'}
              {selectedCity !== 'all' && ` in ${selectedCity}`}
            </div>
          </div>
        </div>

        {shops.length === 0 ? (
          <div className="text-center py-12">
            <CoffeeIcon className="h-16 w-16 text-brand-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Public Shops Yet</h3>
            <p className="text-brand-text-muted">
              Partner cafés will appear here once they set up their public pages.
            </p>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-12">
            <CoffeeIcon className="h-16 w-16 text-brand-accent/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Cafés Found</h3>
            <p className="text-brand-text-muted">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {filteredShops.map((shop) => (
                <div key={shop.id} className="glass-panel rounded-2xl p-6 hover:scale-105 transition-transform">
                  <div className="flex items-center gap-3 mb-4">
                    <CoffeeIcon className="h-8 w-8 text-brand-accent" />
                    <h3 className="text-xl font-semibold text-white">{shop.cafe_name}</h3>
                  </div>
                  
                  {shop.cafe_description && (
                    <p className="text-brand-text-muted text-sm mb-4 line-clamp-2">
                      {shop.cafe_description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-brand-text-muted">
                      {shop.city && shop.country ? `${shop.city}, ${shop.country}` : 'Location not specified'}
                    </div>
                    <div className="text-xs text-brand-text-muted">
                      {new Date(shop.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <Link
                    to={`/s/${shop.shop_slug}`}
                    className="inline-flex items-center gap-2 text-brand-accent hover:text-white transition-colors text-sm font-medium"
                  >
                    Visit Shop
                    <ExternalLinkIcon className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="text-center">
              <div className="glass-panel rounded-2xl p-8 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-white mb-4">Discover Perfect Coffee Pairings</h3>
                <p className="text-brand-text-muted mb-6">
                  Each café showcases their unique coffee collection with AI-powered pairing recommendations. 
                  Browse, search, and discover your perfect coffee experience.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-brand-text-muted">
                    <span className="w-2 h-2 bg-brand-accent rounded-full"></span>
                    Search & Filter
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brand-text-muted">
                    <span className="w-2 h-2 bg-brand-accent rounded-full"></span>
                    AI Pairing Recommendations
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brand-text-muted">
                    <span className="w-2 h-2 bg-brand-accent rounded-full"></span>
                    Mobile Friendly
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
