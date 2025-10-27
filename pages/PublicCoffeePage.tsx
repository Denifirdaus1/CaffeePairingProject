import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  roast_type?: string;
  preparation?: string;
  sort_blend?: string;
  origin?: string;
  acidity?: number;
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
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-text/70 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Home
              </Link>
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
                
                {/* Main Shot Badge Inline */}
                {coffee.is_main_shot && (
                  <div className="inline-flex items-center gap-2 bg-brand-accent/20 border border-brand-accent text-brand-accent px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    ⭐ Today's Main Shot
                    {coffee.main_shot_until && (
                      <span className="text-xs opacity-75">
                        until {new Date(coffee.main_shot_until).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
                
                {coffee.flavor_notes && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-brand-text-muted mb-2">🌟 FLAVOR PROFILE</h3>
                    <div className="flex flex-wrap gap-2">
                      {coffee.flavor_notes.split(',').map((note, idx) => (
                        <span key={idx} className="bg-brand-accent/10 text-brand-accent px-4 py-2 rounded-full text-base font-medium">
                          {note.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Description - Generate if we implement it */}
              <div className="glass-panel rounded-xl p-6 bg-gradient-to-br from-brand-surface/50 to-brand-primary/50">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  ☕ About This Coffee
                </h3>
                <p className="text-brand-text leading-relaxed">
                  {coffee.flavor_notes ? (
                    `Experience the rich complexity of ${coffee.name}, featuring delightful notes of ${coffee.flavor_notes}. ${
                      coffee.is_core ? 'A core selection in our lineup, ' : ''
                    }${
                      coffee.is_main_shot ? "featured as today's main shot - " : ''
                    }this coffee offers a ${
                      coffee.popularity_hint > 0.7 ? 'highly popular' : coffee.popularity_hint > 0.5 ? 'well-loved' : 'unique'
                    } taste profile that ${
                      coffee.season_hint ? `pairs perfectly with ${coffee.season_hint} vibes` : 'works beautifully year-round'
                    }.`
                  ) : (
                    `Discover the distinctive character of ${coffee.name}, carefully selected for our collection. ${
                      coffee.is_main_shot ? "Featured as today's main shot, " : ''
                    }this coffee delivers a memorable experience with every cup.`
                  )}
                </p>
              </div>

              {/* Coffee Metadata Grid */}
              <div className="glass-panel rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">📋 Coffee Specifications</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Origin */}
                  {coffee.origin && (
                    <div>
                      <div className="text-xs text-brand-text-muted mb-1">Origin</div>
                      <div className="text-base font-semibold text-white">{coffee.origin}</div>
                    </div>
                  )}
                  
                  {/* Roast Type */}
                  {coffee.roast_type && (
                    <div>
                      <div className="text-xs text-brand-text-muted mb-1">Roast</div>
                      <div className="text-base font-semibold text-white capitalize">{coffee.roast_type}</div>
                    </div>
                  )}
                  
                  {/* Preparation */}
                  {coffee.preparation && (
                    <div>
                      <div className="text-xs text-brand-text-muted mb-1">Preparation</div>
                      <div className="text-base font-semibold text-white capitalize">{coffee.preparation}</div>
                    </div>
                  )}
                  
                  {/* Sort/Blend */}
                  {coffee.sort_blend && (
                    <div>
                      <div className="text-xs text-brand-text-muted mb-1">Type</div>
                      <div className="text-base font-semibold text-white capitalize">{coffee.sort_blend}</div>
                    </div>
                  )}
                  
                  {/* Acidity */}
                  {coffee.acidity !== null && coffee.acidity !== undefined && (
                    <div>
                      <div className="text-xs text-brand-text-muted mb-1">Acidity</div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-6 rounded-sm ${
                                i < coffee.acidity! ? 'bg-brand-accent' : 'bg-brand-surface'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-white">{coffee.acidity}/5</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Popularity */}
                  <div>
                    <div className="text-xs text-brand-text-muted mb-1">Popularity</div>
                    <div className="text-base font-semibold text-brand-accent">
                      {Math.round(coffee.popularity_hint * 100)}%
                    </div>
                  </div>
                  
                  {/* Season */}
                  <div>
                    <div className="text-xs text-brand-text-muted mb-1">Season</div>
                    <div className="text-base font-semibold text-white">
                      {coffee.season_hint || 'All Year'}
                    </div>
                  </div>
                </div>
                
                {/* Additional Badges */}
                <div className="pt-4 border-t border-brand-border/30">
                  <div className="text-xs text-brand-text-muted mb-2">Attributes</div>
                  <div className="flex flex-wrap gap-2">
                    {coffee.is_core && (
                      <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
                        ⭐ Core Selection
                      </span>
                    )}
                    {coffee.is_guest && (
                      <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold">
                        🎁 Guest Feature
                      </span>
                    )}
                    {coffee.popularity_hint > 0.7 && (
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                        🔥 Bestseller
                      </span>
                    )}
                    {coffee.season_hint && (
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                        🌦️ Seasonal
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Online Shop Link */}
              {coffee.online_shop_url && (
                <div className="glass-panel rounded-xl p-6 border-2 border-brand-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">🛒 Order Online</h3>
                  <p className="text-sm text-brand-text-muted mb-4">Get this coffee delivered to your door</p>
                  <a
                    href={coffee.online_shop_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-primary-pulse inline-flex items-center gap-2 w-full justify-center"
                  >
                    Shop Now →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tasting Guide & Tips */}
      <section className="py-8 px-4 bg-brand-primary/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Brewing Tips */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                ☕ Brewing Tips
              </h3>
              <ul className="space-y-3 text-brand-text">
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent mt-1">•</span>
                  <span>Use freshly ground beans for optimal flavor extraction</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent mt-1">•</span>
                  <span>Water temperature: 195-205°F (90-96°C) for best results</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent mt-1">•</span>
                  <span>Recommended ratio: 1:15 to 1:17 coffee to water</span>
                </li>
                {coffee.preparation && (
                  <li className="flex items-start gap-3">
                    <span className="text-brand-accent mt-1">•</span>
                    <span>Best prepared as: {coffee.preparation}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Tasting Notes */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                👃 Tasting Notes
              </h3>
              <div className="space-y-3">
                {coffee.flavor_notes ? (
                  <>
                    <div>
                      <div className="text-sm text-brand-text-muted mb-2">Primary Flavors</div>
                      <div className="flex flex-wrap gap-2">
                        {coffee.flavor_notes.split(',').slice(0, 3).map((note, idx) => (
                          <span key={idx} className="bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-lg text-sm font-medium">
                            {note.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    {coffee.acidity !== null && coffee.acidity !== undefined && (
                      <div>
                        <div className="text-sm text-brand-text-muted mb-2">Acidity Level</div>
                        <div className="text-brand-text">
                          {coffee.acidity <= 2 ? 'Low - Smooth and mellow' : 
                           coffee.acidity <= 3 ? 'Medium - Balanced brightness' : 
                           'High - Bright and vibrant'}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-brand-text">
                    Experience the unique character of this coffee - each cup reveals new dimensions of flavor.
                  </p>
                )}
                <div className="pt-3 border-t border-brand-border/30">
                  <div className="text-sm text-brand-text-muted">
                    💡 Tip: Take time to savor the aroma before your first sip!
                  </div>
                </div>
              </div>
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
