import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { CoffeeIcon } from '../components/icons/CoffeeIcon';
import { QRCodeIcon } from '../components/icons/QRCodeIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';

interface Coffee {
  id: string;
  name: string;
  slug: string;
  flavor_notes?: string;
  season_hint?: string;
  popularity_hint: number;
  image_url?: string;
  is_main_shot: boolean;
  main_shot_until?: string;
  online_shop_url?: string;
  cafe_id: string;
}

interface Pastry {
  id: string;
  name: string;
  slug: string;
  flavor_tags?: string;
  texture_tags?: string;
  popularity_hint: number;
  image_url?: string;
}

interface Pairing {
  id: string;
  coffee_id: string;
  pastry_id: string;
  score: number;
  why: string;
  status: string;
  is_approved: boolean;
  approved_at?: string;
  coffees: Coffee;
  pastries: Pastry;
}

interface ShopData {
  id: string;
  cafe_name: string;
  shop_slug: string;
}

export const PublicCoffeePage: React.FC = () => {
  const { shop, slug } = useParams<{ shop: string; slug: string }>();
  const [coffee, setCoffee] = useState<Coffee | null>(null);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shop || !slug) return;
    
    const fetchCoffeeData = async () => {
      try {
        // Set current shop context for RLS
        await supabase.rpc('set_current_shop', { shop_slug: shop });
        
        // Fetch shop data first
        const { data: shopData, error: shopError } = await supabase
          .from('cafe_profiles')
          .select('id, cafe_name, shop_slug')
          .eq('shop_slug', shop)
          .single();

        if (shopError) {
          setError('Shop not found');
          return;
        }

        setShopData(shopData);

        // Fetch coffee data
        const { data: coffeeData, error: coffeeError } = await supabase
          .from('coffees')
          .select('*')
          .eq('slug', slug)
          .eq('cafe_id', shopData.id)
          .single();

        if (coffeeError) {
          setError('Coffee not found');
          return;
        }

        setCoffee(coffeeData);

        // Fetch approved pairings for this coffee
        const { data: pairingsData, error: pairingsError } = await supabase
          .from('pairings')
          .select(`
            *,
            coffees (*),
            pastries (*)
          `)
          .eq('coffee_id', coffeeData.id)
          .eq('is_approved', true)
          .order('score', { ascending: false });

        if (pairingsError) {
          console.error('Error fetching pairings:', pairingsError);
        } else {
          setPairings(pairingsData || []);
        }
      } catch (error) {
        console.error('Error fetching coffee data:', error);
        setError('Failed to load coffee data');
      } finally {
        setLoading(false);
      }
    };

    fetchCoffeeData();
  }, [shop, slug]);

  const generateQRCode = () => {
    const url = `${window.location.origin}/s/${shop}/coffee/${slug}`;
    // In a real implementation, you would generate QR code here
    return url;
  };

  const goBack = () => {
    window.location.href = `/s/${shop}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
          <p className="text-brand-text">Loading coffee details...</p>
        </div>
      </div>
    );
  }

  if (error || !coffee || !shopData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Coffee Not Found</h1>
          <p className="text-brand-text-muted mb-6">The coffee you're looking for doesn't exist.</p>
          <button
            onClick={goBack}
            className="button-primary-pulse px-6 py-3 rounded-xl"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface">
      {/* Header */}
      <header className="relative z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between py-6">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sm font-medium text-brand-text hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to {shopData.cafe_name}
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigator.clipboard.writeText(generateQRCode())}
                className="flex items-center gap-2 text-sm font-medium text-brand-text hover:text-white transition-colors"
              >
                <QRCodeIcon className="h-4 w-4" />
                Share Coffee
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Coffee Hero Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Coffee Image */}
            <div className="relative">
              {coffee.image_url ? (
                <img
                  src={coffee.image_url}
                  alt={coffee.name}
                  className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                />
              ) : (
                <div className="w-full h-96 bg-brand-surface rounded-2xl flex items-center justify-center">
                  <CoffeeIcon className="h-24 w-24 text-brand-accent" />
                </div>
              )}
              
              {/* Main Shot Badge */}
              {coffee.is_main_shot && (
                <div className="absolute top-4 left-4">
                  <div className="bg-brand-accent text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Today's Main Shot
                  </div>
                </div>
              )}
            </div>

            {/* Coffee Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">{coffee.name}</h1>
                {coffee.flavor_notes && (
                  <p className="text-xl text-brand-text-muted mb-6">{coffee.flavor_notes}</p>
                )}
              </div>

              {/* Coffee Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel rounded-xl p-4">
                  <div className="text-sm text-brand-text-muted mb-1">Popularity</div>
                  <div className="text-2xl font-bold text-brand-accent">
                    {Math.round(coffee.popularity_hint * 100)}%
                  </div>
                </div>
                <div className="glass-panel rounded-xl p-4">
                  <div className="text-sm text-brand-text-muted mb-1">Season</div>
                  <div className="text-2xl font-bold text-white">
                    {coffee.season_hint || 'All Year'}
                  </div>
                </div>
              </div>

              {/* Online Shop Link */}
              {coffee.online_shop_url && (
                <div className="glass-panel rounded-xl p-6 border-2 border-brand-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Order Online</h3>
                  <a
                    href={coffee.online_shop_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-primary-pulse inline-flex items-center gap-2"
                  >
                    Shop Now →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pairings Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Perfect Pairings
          </h2>
          
          {pairings.length === 0 ? (
            <div className="text-center py-12">
              <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto">
                <CoffeeIcon className="h-16 w-16 text-brand-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Pairings Yet</h3>
                <p className="text-brand-text-muted">
                  We're working on finding the perfect pairings for this coffee.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pairings.map((pairing) => (
                <div
                  key={pairing.id}
                  className="glass-panel rounded-2xl p-6 hover:scale-105 transition-transform"
                >
                  {/* Pastry Image */}
                  <div className="mb-4">
                    {pairing.pastries.image_url ? (
                      <img
                        src={pairing.pastries.image_url}
                        alt={pairing.pastries.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-brand-surface rounded-lg flex items-center justify-center">
                        <span className="text-brand-text-muted">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Pastry Name */}
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {pairing.pastries.name}
                  </h3>

                  {/* Score */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-brand-text-muted">Pairing Score</span>
                    <span className="text-2xl font-bold text-brand-accent">
                      {Math.round(pairing.score * 100)}%
                    </span>
                  </div>

                  {/* Why */}
                  {pairing.why && (
                    <p className="text-brand-text-muted text-sm mb-4 line-clamp-3">
                      {pairing.why}
                    </p>
                  )}

                  {/* Flavor Tags */}
                  {pairing.pastries.flavor_tags && (
                    <div className="flex flex-wrap gap-2">
                      {pairing.pastries.flavor_tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="bg-brand-primary/50 text-brand-text px-2 py-1 rounded-full text-xs"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border/30 bg-brand-primary/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 text-white mb-4">
              <CoffeeIcon className="h-8 w-8 text-brand-accent" />
              <span className="text-xl font-bold">{shopData.cafe_name}</span>
            </div>
            <p className="text-brand-text-muted text-sm">
              Discover more at <a href={`/s/${shop}`} className="text-brand-accent hover:underline">our shop</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
