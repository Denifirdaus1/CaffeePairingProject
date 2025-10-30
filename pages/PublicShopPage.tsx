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

  const handleCoffeeSelect = (coffee: Coffee) => {
    window.location.href = `/s/${shop}/coffee/${coffee.slug}`;
  };

  const generateQRCode = () => {
    const url = `${window.location.origin}/s/${shop}`;
    // In a real implementation, you would generate QR code here
    return url;
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
                onClick={() => navigator.clipboard.writeText(generateQRCode())}
                className="flex items-center gap-2 text-sm font-medium text-brand-text hover:text-white transition-colors"
              >
                <QRCodeIcon className="h-4 w-4" />
                Share Shop
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

      {/* Today's Main Shot - Enhanced */}
      {coffees.some(coffee => coffee.is_main_shot) && (
        <section className="py-8 md:py-12 px-4 bg-gradient-to-br from-brand-accent/10 via-transparent to-amber-500/10">
          <div className="max-w-7xl mx-auto">
            {coffees
              .filter(coffee => coffee.is_main_shot)
              .map(coffee => (
                <div 
                  key={coffee.id}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-accent/20 to-amber-500/20 backdrop-blur-sm border-2 border-brand-accent shadow-2xl md:hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                  onClick={() => window.location.href = `/s/${shop}/coffee/${coffee.slug}`}
                >
                  {/* Animated Background Effect - Desktop only */}
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/0 via-brand-accent/10 to-brand-accent/0 hidden md:block md:animate-pulse"></div>
                  
                  {/* Badge */}
                  <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-brand-accent to-amber-400 text-white px-3 py-2 md:px-5 md:py-2.5 rounded-full shadow-lg">
                      <span className="text-base md:text-xl">⭐</span>
                      <span className="font-bold text-xs md:text-sm tracking-wide">TODAY'S MAIN SHOT</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 p-4 md:p-8 lg:p-12">
                    {/* Left: Image */}
                    <div className="flex items-center justify-center">
                      {coffee.image_url ? (
                        <div className="relative group">
                          <div className="absolute inset-0 bg-brand-accent/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all hidden md:block"></div>
                          <OptimizedImage
                            src={coffee.image_url}
                            alt={coffee.name}
                            width={500}
                            height={320}
                            priority={true}
                            className="relative w-full max-w-md h-64 md:h-80 object-cover rounded-2xl shadow-2xl md:transform md:group-hover:scale-105 md:transition-transform md:duration-500"
                          />
                        </div>
                      ) : (
                        <div className="w-full max-w-md h-64 md:h-80 bg-brand-surface rounded-2xl flex items-center justify-center">
                          <CoffeeIcon className="h-24 md:h-32 w-24 md:w-32 text-brand-accent" />
                        </div>
                      )}
                    </div>

                    {/* Right: Details */}
                    <div className="flex flex-col justify-center space-y-4 md:space-y-6">
                      <div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4 tracking-tight">
                          {coffee.name}
                        </h2>
                        
                        {/* Flavor Notes */}
                        {coffee.flavor_notes && (
                          <div className="mb-6">
                            <h3 className="text-sm font-semibold text-brand-accent mb-3 uppercase tracking-wider">
                              Flavor Profile
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {coffee.flavor_notes.split(',').map((note, idx) => (
                                <span 
                                  key={idx} 
                                  className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-base font-medium border border-white/20 hover:bg-white/20 transition-colors"
                                >
                                  {note.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-6 mb-6">
                          <div className="glass-panel px-4 py-3 rounded-xl">
                            <div className="text-xs text-brand-text-muted mb-1">Popularity</div>
                            <div className="text-2xl font-bold text-brand-accent">
                              {Math.round(coffee.popularity_hint * 100)}%
                            </div>
                          </div>
                          {coffee.main_shot_until && (
                            <div className="glass-panel px-4 py-3 rounded-xl">
                              <div className="text-xs text-brand-text-muted mb-1">Available Until</div>
                              <div className="text-sm font-semibold text-white">
                                {new Date(coffee.main_shot_until).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA Buttons */}
                      <div className="flex flex-wrap gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/s/${shop}/coffee/${coffee.slug}`;
                          }}
                          className="flex-1 min-w-[200px] bg-gradient-to-r from-brand-accent to-amber-400 hover:from-brand-accent/90 hover:to-amber-400/90 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                        >
                          View Details →
                        </button>
                        
                        {coffee.online_shop_url && (
                          <a
                            href={coffee.online_shop_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 min-w-[200px] bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-2 border-white/30 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 text-center"
                          >
                            🛒 Order Online
                          </a>
                        )}
                      </div>
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
              {displayCoffees.map((coffee, index) => (
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
                      priority={index < 6}
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
              {pastries.filter(pastry => pastry.slug).map((pastry, index) => (
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
                      priority={index < 3}
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
    </div>
  );
};
