import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { CoffeeIcon } from '../components/icons/CoffeeIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { OptimizedImage } from '../components/OptimizedImage';
import { useCart } from '../contexts/CartContext';
import { ShoppingCart } from '../components/public/ShoppingCart';

// Sanitize URL params to remove hidden characters from QR/PDF scans
const cleanse = (s: string = '') => {
  return decodeURIComponent(s)
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '') // zero-width chars
    .replace(/[\n\r\t]/g, '') // newlines
    .replace(/\s+/g, ' ') // collapse whitespaces
    .trim();
};

interface Coffee {
  id: string;
  name: string;
  slug: string;
  flavor_notes?: string;
  image_url?: string;
  price?: number;
}

interface Pastry {
  id: string;
  name: string;
  flavor_tags?: string;
  texture_tags?: string;
  image_url?: string;
  price?: number;
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
  const { shop: rawShop, slug: rawSlug } = useParams<{ shop: string; slug: string }>();
  
  // Cleanse params to remove hidden characters (newlines, zero-width, etc.)
  const shop = rawShop ? cleanse(rawShop) : undefined;
  const slug = rawSlug ? cleanse(rawSlug) : undefined;
  
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { addToCart, getTotalItems } = useCart();

  useEffect(() => {
    if (!slug) return;
    
    console.log('=== FETCHING PAIRING DATA ===');
    console.log('Raw Shop:', rawShop);
    console.log('Cleaned Shop:', shop);
    console.log('Raw Slug:', rawSlug);
    console.log('Cleaned Slug:', slug);
    console.log('Slug Encoded:', encodeURIComponent(slug));
    console.log('Slug Char Codes:', [...slug].map(c => c.charCodeAt(0)));
    
    const fetchPairingData = async () => {
      try {
        console.log('=== STARTING FETCH ===');
        console.log('Shop:', shop);
        console.log('Slug:', slug);
        
        // Handle legacy URLs with shop='null' - fetch pairing first to get correct shop
        if (!shop || shop === 'null') {
          console.log('Shop is null/undefined, fetching pairing to find correct shop...');
          
          // Find pairing by slug first
          const { data: pairingData, error: pairingError } = await supabase
            .from('pairings')
            .select('cafe_id, pairing_slug')
            .eq('pairing_slug', slug)
            .eq('is_approved', true)
            .eq('is_published', true)
            .maybeSingle();
          
          if (pairingError || !pairingData) {
            console.error('Pairing not found:', pairingError);
            setError('Pairing not found. Please regenerate your QR code.');
            setLoading(false);
            return;
          }
          
          // Get shop slug from cafe_id
          const { data: cafeData, error: cafeError } = await supabase
            .from('cafe_profiles')
            .select('shop_slug')
            .eq('id', pairingData.cafe_id)
            .single();
          
          if (cafeError || !cafeData?.shop_slug) {
            console.error('Cafe not found:', cafeError);
            setError('Cafe not found. Please contact support.');
            setLoading(false);
            return;
          }
          
          // Redirect to correct URL
          console.log('Redirecting to correct shop URL:', cafeData.shop_slug);
          window.location.replace(`/s/${cafeData.shop_slug}/pairing/${slug}`);
          return;
        }
        
        // Normal flow: Fetch shop data first
        console.log('Fetching shop data...');
        const { data: shopData, error: shopError } = await supabase
          .from('cafe_profiles')
          .select('id, cafe_name, shop_slug')
          .eq('shop_slug', shop)
          .single();

        console.log('Shop query result:', { shopData, shopError });

        if (shopError) {
          console.error('Shop fetch error:', shopError);
          setError(`Shop not found: ${shopError.message}`);
          return;
        }

        setShopData(shopData);
        console.log('Shop data set:', shopData);

        // Fetch pairing data - RLS policy now allows public access to approved & published pairings
        console.log('Fetching pairing data...');
        const { data: pairingData, error: pairingError } = await supabase
          .from('pairings')
          .select('*')
          .eq('pairing_slug', slug)
          .eq('cafe_id', shopData.id)
          .eq('is_approved', true)
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
          .select('id, name, slug, flavor_notes, image_url, price')
          .eq('id', pairingData.coffee_id)
          .single();

        // Fetch pastry data separately
        const { data: pastryData, error: pastryError } = await supabase
          .from('pastries')
          .select('id, name, flavor_tags, texture_tags, image_url, price')
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
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4">Pairing Not Found</h1>
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4 text-left">
            <p className="text-red-300 text-sm font-mono break-all">
              <strong>Error:</strong> {error || 'Unknown error'}
            </p>
            {rawSlug && rawSlug !== slug && (
              <div className="bg-orange-900/30 border border-orange-500/50 rounded p-3 mt-3">
                <p className="text-orange-300 text-xs font-mono break-all">
                  ⚠️ Hidden characters detected in URL
                </p>
                <p className="text-orange-300 text-xs font-mono break-all mt-1">
                  Raw: "{rawSlug}"
                </p>
                <p className="text-orange-300 text-xs font-mono break-all">
                  Cleaned: "{slug}"
                </p>
              </div>
            )}
            <p className="text-red-300 text-sm font-mono break-all mt-2">
              <strong>Shop:</strong> {shop || 'N/A'}
            </p>
            <p className="text-red-300 text-sm font-mono break-all">
              <strong>Slug:</strong> {slug || 'N/A'}
            </p>
            <p className="text-red-300 text-sm mt-2">
              Check browser console (F12) for more details
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {shop && (
              <Link to={`/s/${shop}`} className="button-primary-pulse px-6 py-3 rounded-xl inline-block">
                Back to Shop
              </Link>
            )}
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const coffeePrice = pairing?.coffees.price || 0;
  const pastryPrice = pairing?.pastries.price || 0;
  const combinedPrice = coffeePrice + pastryPrice;
  const hasBothPrices = pairing?.coffees.price != null && pairing?.pastries.price != null;

  const handleAddToCart = () => {
    if (!pairing || !hasBothPrices) return;
    
    addToCart({
      type: 'pairing',
      productId: pairing.id,
      name: `${pairing.coffees.name} + ${pairing.pastries.name}`,
      price: combinedPrice,
      image_url: pairing.coffees.image_url,
      coffeeName: pairing.coffees.name,
      pastryName: pairing.pastries.name,
      coffeeId: pairing.coffees.id,
      pastryId: pairing.pastries.id,
      coffeePrice,
      pastryPrice,
    });
    
    // Show success feedback
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface pb-20">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-brand-surface/95 backdrop-blur-sm border-b border-brand-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between py-4">
            <Link
              to={`/s/${shop}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-text/70 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Back to {shopData.cafe_name}</span>
              <span className="sm:hidden">Back</span>
            </Link>
            
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-brand-accent/10 transition-colors"
            >
              <svg className="w-5 h-5 text-brand-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
              <span className="hidden sm:inline text-brand-text">Cart</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Badge */}
          <div className="text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-brand-accent to-amber-400 text-white px-6 py-3 rounded-full shadow-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-bold text-lg">{Math.round(pairing.score * 100)}% Perfect Match</span>
              </div>
            </div>
          </div>

          {/* Pairing Images - Mobile Optimized */}
          <div className="glass-panel rounded-3xl p-4 sm:p-8 mb-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6">
              {/* Coffee */}
              {pairing.coffees.image_url && (
                <div className="space-y-3">
                  <OptimizedImage
                    src={pairing.coffees.image_url}
                    alt={pairing.coffees.name}
                    width={400}
                    height={400}
                    priority={true}
                    className="w-full aspect-square object-cover rounded-2xl shadow-lg"
                  />
                  <div className="text-center">
                    <h2 className="text-lg sm:text-2xl font-bold text-white">
                      {pairing.coffees.name}
                    </h2>
                    {pairing.coffees.flavor_notes && (
                      <p className="text-xs sm:text-sm text-brand-text-muted mt-1">
                        {pairing.coffees.flavor_notes}
                      </p>
                    )}
                    {pairing.coffees.price != null && (
                      <p className="text-brand-accent font-bold text-lg mt-2">
                        €{pairing.coffees.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Pastry */}
              {pairing.pastries.image_url && (
                <div className="space-y-3">
                  <OptimizedImage
                    src={pairing.pastries.image_url}
                    alt={pairing.pastries.name}
                    width={400}
                    height={400}
                    priority={true}
                    className="w-full aspect-square object-cover rounded-2xl shadow-lg"
                  />
                  <div className="text-center">
                    <h2 className="text-lg sm:text-2xl font-bold text-white">
                      {pairing.pastries.name}
                    </h2>
                    {pairing.pastries.texture_tags && (
                      <p className="text-xs sm:text-sm text-brand-text-muted mt-1">
                        {pairing.pastries.texture_tags}
                      </p>
                    )}
                    {pairing.pastries.price != null && (
                      <p className="text-brand-accent font-bold text-lg mt-2">
                        €{pairing.pastries.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Total Price & Actions */}
            {hasBothPrices && (
              <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
                <div className="flex items-center justify-between px-4">
                  <div>
                    <p className="text-sm text-brand-text-muted">Total Price</p>
                    <p className="text-3xl font-bold text-brand-accent">
                      €{combinedPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-brand-text-muted mt-1">
                      Coffee + Pastry Pairing
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-500/30">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">Available</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-accent to-amber-400 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            )}
          </div>

          {/* Why This Pairing Works */}
          {pairing.why && (
            <div className="glass-panel rounded-2xl p-6 sm:p-8 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                    Why This Pairing Works
                  </h3>
                  <p className="text-brand-text leading-relaxed text-sm sm:text-base">
                    {pairing.why}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Flavor Tags */}
          {pairing.pastries.flavor_tags && (
            <div className="glass-panel rounded-2xl p-6 sm:p-8 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Flavor Profile</h3>
              <div className="flex flex-wrap gap-2">
                {pairing.pastries.flavor_tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="bg-brand-accent/20 text-brand-accent px-4 py-2 rounded-full text-sm font-semibold border border-brand-accent/30"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cafe Info */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <CoffeeIcon className="h-10 w-10 text-brand-accent" />
              <div>
                <p className="text-sm text-brand-text-muted">Available at</p>
                <h3 className="text-xl font-bold text-white">{shopData.cafe_name}</h3>
              </div>
            </div>
            <Link
              to={`/s/${shop}`}
              className="inline-flex items-center gap-2 text-brand-accent hover:text-white transition-colors font-semibold"
            >
              View all menu items & pairings
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      {/* Shopping Cart Modal */}
      <ShoppingCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

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
