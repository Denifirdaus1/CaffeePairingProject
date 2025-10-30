import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { CoffeeIcon } from '../components/icons/CoffeeIcon';
import { QRCodeIcon } from '../components/icons/QRCodeIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { CoffeeSearch } from '../components/public/CoffeeSearch';
import { PublicPairingGenerator } from '../components/public/PublicPairingGenerator';
import { OptimizedImage } from '../components/OptimizedImage';

interface ShopData {
  id: string;
  cafe_name: string;
  cafe_description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
}

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
}

interface Pastry {
  id: string;
  name: string;
  slug?: string;
  flavor_tags?: string;
  texture_tags?: string;
  image_url?: string;
  popularity_hint: number;
}

interface PublishedPairing {
  id: string;
  coffee_id: string;
  pastry_id: string;
  score: number;
  why: string;
  pairing_slug: string;
  coffees: Coffee;
  pastries: Pastry;
}

export const PublicShopPage: React.FC = () => {
  const { shop } = useParams<{ shop: string }>();
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [pastries, setPastries] = useState<Pastry[]>([]);
  const [publishedPairings, setPublishedPairings] = useState<PublishedPairing[]>([]);
  const [displayCoffees, setDisplayCoffees] = useState<Coffee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shop) return;
    
    const fetchShopData = async () => {
      try {
        // Set current shop context for RLS
        await supabase.rpc('set_current_shop', { shop_slug: shop });
        
        // Fetch shop data
        const { data: shopData, error: shopError } = await supabase
          .from('cafe_profiles')
          .select('*')
          .eq('shop_slug', shop)
          .single();

        if (shopError) {
          setError('Shop not found');
          return;
        }

        setShopData(shopData);

        // Fetch coffees for this shop
        const { data: coffeesData, error: coffeesError } = await supabase
          .from('coffees')
          .select('*')
          .eq('cafe_id', shopData.id)
          .order('is_main_shot', { ascending: false })
          .order('popularity_hint', { ascending: false });

        if (coffeesError) {
          console.error('Error fetching coffees:', coffeesError);
        } else {
          // Filter out coffees without slugs and log warning
          const validCoffees = (coffeesData || []).filter(coffee => {
            if (!coffee.slug) {
              console.warn('Coffee without slug detected:', coffee.name, coffee.id);
              return false;
            }
            return true;
          });
          setCoffees(validCoffees);
          setDisplayCoffees(validCoffees);
        }

        // Fetch pastries for this shop
        const { data: pastriesData, error: pastriesError } = await supabase
          .from('pastries')
          .select('*')
          .eq('cafe_id', shopData.id)
          .order('popularity_hint', { ascending: false });

        if (pastriesError) {
          console.error('Error fetching pastries:', pastriesError);
        } else {
          setPastries(pastriesData || []);
        }

        // Fetch published pairings for this shop
        const { data: pairingsData, error: pairingsError } = await supabase
          .from('pairings')
          .select(`
            *,
            coffees (*),
            pastries (*)
          `)
          .eq('cafe_id', shopData.id)
          .eq('is_published', true)
          .order('score', { ascending: false });

        if (pairingsError) {
          console.error('Error fetching pairings:', pairingsError);
        } else {
          setPublishedPairings(pairingsData || []);
        }
      } catch (error) {
        console.error('Error fetching shop data:', error);
        setError('Failed to load shop data');
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shop]);

  const [shareToast, setShareToast] = useState<string | null>(null);

  const handleCoffeeSelect = (coffee: Coffee) => {
    window.location.href = `/s/${shop}/coffee/${coffee.slug}`;
  };

  const generateQRCode = () => {
    const url = `${window.location.origin}/s/${shop}`;
    // In a real implementation, you would generate QR code here
    return url;
  };

  const handleShareShop = async () => {
    const shareUrl = `${window.location.origin}/s/${shop}`;
    const shareData = {
      title: `${shopData?.cafe_name || 'Coffee Shop'}`,
      text: `Check out ${shopData?.cafe_name || 'this coffee shop'} - Discover amazing coffee and pairings!`,
      url: shareUrl
    };

    try {
      // Try native share API first (mobile-friendly)
      if (navigator.share) {
        await navigator.share(shareData);
        setShareToast('✅ Shared successfully!');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        setShareToast('✅ Link copied to clipboard!');
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        setShareToast('❌ Failed to share. Please try again.');
      }
    }

    // Auto-hide toast after 3 seconds
    setTimeout(() => setShareToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
          <p className="text-brand-text">Loading shop...</p>
        </div>
      </div>
    );
  }

  if (error || !shopData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Shop Not Found</h1>
          <p className="text-brand-text-muted">The shop you're looking for doesn't exist.</p>
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
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-text/70 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Home
              </Link>
              <div className="flex items-center gap-3 text-white">
                <CoffeeIcon className="h-8 w-8 text-brand-accent" />
                <span className="text-xl font-bold">{shopData.cafe_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleShareShop}
                className="flex items-center gap-2 text-sm font-medium text-brand-text hover:text-white transition-colors hover:bg-brand-accent/10 px-3 py-2 rounded-lg"
              >
                <QRCodeIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Share Shop</span>
                <span className="sm:hidden">Share</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Interactive Pairing Generator - Moved to Top */}
      {coffees.length > 0 && pastries.length > 0 && (
        <PublicPairingGenerator
          coffees={coffees}
          pastries={pastries}
          shopSlug={shop || ''}
        />
      )}

      {/* Search Bar Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto">
            <CoffeeSearch
              coffees={coffees}
              onCoffeeSelect={handleCoffeeSelect}
              placeholder="Search coffees and pastries..."
            />
          </div>
        </div>
      </section>

      {/* Today's Main Shot - Ultra Light */}
      {coffees.some(coffee => coffee.is_main_shot) && (
        <section className="py-4 px-4">
          <div className="max-w-7xl mx-auto">
            {coffees
              .filter(coffee => coffee.is_main_shot)
              .map(coffee => (
                <div 
                  key={coffee.id}
                  className="bg-brand-surface/50 rounded-xl p-3 md:p-4 border border-brand-accent/30 cursor-pointer"
                  onClick={() => window.location.href = `/s/${shop}/coffee/${coffee.slug}`}
                >
                  {/* Compact Badge */}
                  <div className="flex items-center gap-1.5 bg-brand-accent text-white px-2.5 py-1 rounded-md mb-3 w-fit text-xs font-semibold">
                    <span>⭐</span>
                    <span>TODAY'S MAIN SHOT</span>
                  </div>

                  {/* Horizontal Layout */}
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* Image - Smaller */}
                    {coffee.image_url && (
                      <OptimizedImage
                        src={coffee.image_url}
                        alt={coffee.name}
                        width={300}
                        height={180}
                        priority={true}
                        className="w-full md:w-48 h-36 object-cover rounded-lg flex-shrink-0"
                      />
                    )}

                    {/* Details - Compact */}
                    <div className="flex flex-col justify-center space-y-2 flex-1 min-w-0">
                      <h2 className="text-xl md:text-2xl font-bold text-white truncate">
                        {coffee.name}
                      </h2>
                      
                      {/* Flavor Notes - Max 3, smaller */}
                      {coffee.flavor_notes && (
                        <div className="flex flex-wrap gap-1.5">
                          {coffee.flavor_notes.split(',').slice(0, 3).map((note, idx) => (
                            <span 
                              key={idx} 
                              className="bg-brand-accent/15 text-white px-2 py-0.5 rounded text-xs"
                            >
                              {note.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Compact Stats */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-brand-accent font-semibold">
                          {Math.round(coffee.popularity_hint * 100)}%
                        </span>
                        {coffee.main_shot_until && (
                          <span className="text-brand-text-muted">
                            {new Date(coffee.main_shot_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {/* Small Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/s/${shop}/coffee/${coffee.slug}`}}
                        className="bg-brand-accent text-white px-4 py-1.5 rounded-md font-medium text-xs w-fit mt-1"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Coffee Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Our Coffee Collection
          </h2>
          
          {displayCoffees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-brand-text-muted text-lg">
                No coffees available yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayCoffees.map((coffee) => (
                <div
                  key={coffee.id}
                  className="glass-panel rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => window.location.href = `/s/${shop}/coffee/${coffee.slug}`}
                >
                  {coffee.image_url && (
                    <OptimizedImage
                      src={coffee.image_url}
                      alt={coffee.name}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-white">{coffee.name}</h3>
                    {coffee.is_main_shot && (
                      <span className="bg-brand-accent text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Main Shot
                      </span>
                    )}
                  </div>
                  {coffee.flavor_notes && (
                    <p className="text-brand-text-muted text-sm mb-3">{coffee.flavor_notes}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-brand-accent font-semibold">
                      Popularity: {Math.round(coffee.popularity_hint * 100)}%
                    </span>
                    <span className="text-brand-text-muted text-sm">View Pairings →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pastries Section */}
      {pastries.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Our Pastries
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastries.filter(pastry => pastry.slug).map((pastry) => (
                <button
                  key={pastry.id}
                  onClick={() => window.location.href = `/s/${shop}/pastry/${pastry.slug}`}
                  className="glass-panel rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer text-left"
                >
                  {pastry.image_url && (
                    <OptimizedImage
                      src={pastry.image_url}
                      alt={pastry.name}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-xl font-semibold text-white mb-2">{pastry.name}</h3>
                  {pastry.flavor_tags && (
                    <p className="text-brand-text-muted text-sm">{pastry.flavor_tags}</p>
                  )}
                  {pastry.texture_tags && (
                    <p className="text-brand-text-muted text-xs mt-2">Texture: {pastry.texture_tags}</p>
                  )}
                  <div className="mt-4 text-brand-accent text-sm font-semibold">
                    View Details →
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Published Pairings Section */}
      {publishedPairings.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Recommended Pairings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedPairings.map(pairing => (
                <div
                  key={pairing.id}
                  className="glass-panel rounded-2xl p-6 hover:scale-105 transition-transform border-2 border-brand-accent/20"
                  onClick={() => window.location.href = `/s/${shop}/pairing/${pairing.pairing_slug}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    {pairing.coffees.image_url && (
                      <OptimizedImage
                        src={pairing.coffees.image_url}
                        alt={pairing.coffees.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    {pairing.pastries.image_url && (
                      <OptimizedImage
                        src={pairing.pastries.image_url}
                        alt={pairing.pastries.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {pairing.coffees.name} + {pairing.pastries.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-brand-accent font-bold">
                      {Math.round(pairing.score * 100)}% Match
                    </span>
                  </div>
                  {pairing.why && (
                    <p className="text-brand-text-muted text-sm line-clamp-2">{pairing.why}</p>
                  )}
                  <div className="mt-4 flex items-center justify-end">
                    <span className="text-brand-text-muted text-sm">View Details →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-brand-border/30 bg-brand-primary/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 text-white mb-4">
              <CoffeeIcon className="h-8 w-8 text-brand-accent" />
              <span className="text-xl font-bold">{shopData.cafe_name}</span>
            </div>
            {shopData.address && (
              <p className="text-brand-text-muted text-sm mb-2">{shopData.address}</p>
            )}
            {shopData.phone && (
              <p className="text-brand-text-muted text-sm">📞 {shopData.phone}</p>
            )}
          </div>
        </div>
      </footer>

      {/* Share Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-brand-surface/95 backdrop-blur-sm border border-brand-accent/30 text-white px-6 py-3 rounded-lg shadow-xl">
            {shareToast}
          </div>
        </div>
      )}
    </div>
  );
};
