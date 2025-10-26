import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { CoffeeIcon } from '../components/icons/CoffeeIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';

interface Coffee {
  id: string;
  name: string;
  slug: string;
  flavor_notes?: string;
  image_url?: string;
}

interface Pastry {
  id: string;
  name: string;
  flavor_tags?: string;
  texture_tags?: string;
  image_url?: string;
}

interface Pairing {
  id: string;
  coffee_id: string;
  pastry_id: string;
  score: number;
  why: string;
  pairing_slug: string;
  coffees: Coffee;
  pastries: Pastry;
}

interface ShopData {
  id: string;
  cafe_name: string;
  shop_slug: string;
}

export const PublicPairingPage: React.FC = () => {
  const { shop, slug } = useParams<{ shop: string; slug: string }>();
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shop || !slug) return;
    
    console.log('=== FETCHING PAIRING DATA ===');
    console.log('Shop:', shop);
    console.log('Slug:', slug);
    
    const fetchPairingData = async () => {
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

        // Fetch pairing data (simplified - just use slug)
        const { data: pairingData, error: pairingError } = await supabase
          .from('pairings')
          .select('*')
          .eq('pairing_slug', slug)
          .eq('is_published', true)
          .maybeSingle();

        console.log('Pairing query result:', { pairingData, pairingError });

        if (pairingError) {
          console.error('Pairing fetch error:', pairingError);
          setError(`Pairing not found: ${pairingError.message}`);
          return;
        }

        if (!pairingData) {
          console.log('No pairing data found');
          setError('Pairing not found');
          return;
        }
        
        console.log('Pairing found:', pairingData);

        // Fetch coffee data separately
        const { data: coffeeData, error: coffeeError } = await supabase
          .from('coffees')
          .select('id, name, slug, flavor_notes, image_url')
          .eq('id', pairingData.coffee_id)
          .single();

        // Fetch pastry data separately
        const { data: pastryData, error: pastryError } = await supabase
          .from('pastries')
          .select('id, name, flavor_tags, texture_tags, image_url')
          .eq('id', pairingData.pastry_id)
          .single();

        if (coffeeError || pastryError) {
          console.error('Coffee/Pastry fetch error:', coffeeError || pastryError);
          setError('Failed to load coffee or pastry data');
          return;
        }

        // Combine the data
        const pairingWithDetails = {
          ...pairingData,
          coffees: coffeeData,
          pastries: pastryData
        };

        console.log('Pairing data fetched:', pairingWithDetails);
        setPairing(pairingWithDetails as any);
      } catch (error) {
        console.error('Error fetching pairing data:', error);
        setError('Failed to load pairing data');
      } finally {
        setLoading(false);
      }
    };

    fetchPairingData();
  }, [shop, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
          <p className="text-brand-text">Loading pairing details...</p>
        </div>
      </div>
    );
  }

  if (error || !pairing || !shopData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Pairing Not Found</h1>
          <p className="text-brand-text-muted mb-6">
            The pairing you're looking for doesn't exist. {error && <span className="text-red-300">({error})</span>}
          </p>
          {shop && (
            <Link to={`/s/${shop}`} className="button-primary-pulse px-6 py-3 rounded-xl inline-block">
              Back to Shop
            </Link>
          )}
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
            <div className="flex items-center gap-4">
              <Link
                to={`/s/${shop}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-text/70 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to {shopData.cafe_name}
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-text/70 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Pairing Hero Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Pairing Card */}
          <div className="glass-panel rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              {pairing.coffees.image_url && (
                <div className="flex-1">
                  <img
                    src={pairing.coffees.image_url}
                    alt={pairing.coffees.name}
                    className="w-full h-48 object-cover rounded-2xl shadow-lg"
                  />
                  <h2 className="text-2xl font-bold text-white mt-4 text-center">
                    {pairing.coffees.name}
                  </h2>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-4xl text-brand-accent">
                +
              </div>
              
              {pairing.pastries.image_url && (
                <div className="flex-1">
                  <img
                    src={pairing.pastries.image_url}
                    alt={pairing.pastries.name}
                    className="w-full h-48 object-cover rounded-2xl shadow-lg"
                  />
                  <h2 className="text-2xl font-bold text-white mt-4 text-center">
                    {pairing.pastries.name}
                  </h2>
                </div>
              )}
            </div>

            {/* Score */}
            <div className="text-center mb-6">
              <div className="inline-block bg-gradient-to-r from-brand-accent to-amber-400 text-white px-8 py-4 rounded-2xl shadow-xl">
                <div className="text-sm font-semibold mb-1">PERFECT MATCH</div>
                <div className="text-5xl font-bold">
                  {Math.round(pairing.score * 100)}%
                </div>
              </div>
            </div>

            {/* Why */}
            {pairing.why && (
              <div className="glass-panel rounded-2xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">Why This Pairing Works</h3>
                <p className="text-brand-text-muted leading-relaxed">
                  {pairing.why}
                </p>
              </div>
            )}

            {/* Flavor Tags */}
            {pairing.pastries.flavor_tags && (
              <div className="flex flex-wrap gap-2 justify-center">
                {pairing.pastries.flavor_tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="bg-brand-primary/50 text-brand-text px-4 py-2 rounded-full text-sm font-semibold"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Shop Info */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CoffeeIcon className="h-8 w-8 text-brand-accent" />
              <span className="text-xl font-bold text-white">{shopData.cafe_name}</span>
            </div>
            <Link
              to={`/s/${shop}`}
              className="text-brand-accent hover:text-brand-accent/80 transition-colors text-sm inline-flex items-center gap-2"
            >
              View all coffees and pairings →
            </Link>
          </div>
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
              Discover more at <Link to={`/s/${shop}`} className="text-brand-accent hover:underline">our shop</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
