import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { PastryIcon } from '../components/icons/PastryIcon';
import { QRCodeIcon } from '../components/icons/QRCodeIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';

interface Pastry {
  id: string;
  name: string;
  slug: string;
  flavor_tags?: string;
  texture_tags?: string;
  popularity_hint: number;
  image_url?: string;
  cafe_id: string;
  season_hint?: string;
  is_core?: boolean;
  is_guest?: boolean;
}

interface Coffee {
  id: string;
  name: string;
  slug: string;
  flavor_notes?: string;
  image_url?: string;
}

interface Pairing {
  id: string;
  coffee_id: string;
  pastry_id: string;
  score: number;
  why: string;
  pairing_slug?: string;
  coffees: Coffee;
  pastries: Pastry;
}

interface ShopData {
  id: string;
  cafe_name: string;
  shop_slug: string;
}

export const PublicPastryPage: React.FC = () => {
  const { shop, slug } = useParams<{ shop: string; slug: string }>();
  const [pastry, setPastry] = useState<Pastry | null>(null);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shop || !slug) return;
    
    const fetchPastryData = async () => {
      try {
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

        // Fetch pastry data
        const { data: pastryData, error: pastryError } = await supabase
          .from('pastries')
          .select('*')
          .eq('slug', slug)
          .eq('cafe_id', shopData.id)
          .single();

        if (pastryError) {
          setError('Pastry not found');
          return;
        }

        setPastry(pastryData);

        // Fetch approved pairings for this pastry
        const { data: pairingsData, error: pairingsError } = await supabase
          .from('pairings')
          .select(`
            *,
            coffees (*),
            pastries (*)
          `)
          .eq('pastry_id', pastryData.id)
          .eq('is_approved', true)
          .eq('is_published', true)
          .order('score', { ascending: false });

        if (pairingsError) {
          console.error('Error fetching pairings:', pairingsError);
        } else {
          setPairings(pairingsData || []);
        }
      } catch (error) {
        console.error('Error fetching pastry data:', error);
        setError('Failed to load pastry data');
      } finally {
        setLoading(false);
      }
    };

    fetchPastryData();
  }, [shop, slug]);

  const generateQRCode = () => {
    const url = `${window.location.origin}/s/${shop}/pastry/${slug}`;
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
          <p className="text-brand-text">Loading pastry details...</p>
        </div>
      </div>
    );
  }

  if (error || !pastry || !shopData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Pastry Not Found</h1>
          <p className="text-brand-text-muted mb-6">The pastry you're looking for doesn't exist.</p>
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
                Share Pastry
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Pastry Hero Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Pastry Image */}
            <div className="relative">
              {pastry.image_url ? (
                <img
                  src={pastry.image_url}
                  alt={pastry.name}
                  className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                />
              ) : (
                <div className="w-full h-96 bg-brand-surface rounded-2xl flex items-center justify-center">
                  <PastryIcon className="h-24 w-24 text-brand-accent" />
                </div>
              )}
            </div>

            {/* Pastry Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">{pastry.name}</h1>
                
                {/* Flavor Tags */}
                {pastry.flavor_tags && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-brand-text-muted mb-2">🌟 FLAVOR PROFILE</h3>
                    <div className="flex flex-wrap gap-2">
                      {pastry.flavor_tags.split(',').map((tag, idx) => (
                        <span key={idx} className="bg-brand-accent/10 text-brand-accent px-4 py-2 rounded-full text-base font-medium">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Texture Tags */}
                {pastry.texture_tags && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-brand-text-muted mb-2">✨ TEXTURE</h3>
                    <div className="flex flex-wrap gap-2">
                      {pastry.texture_tags.split(',').map((tag, idx) => (
                        <span key={idx} className="bg-purple-500/10 text-purple-400 px-4 py-2 rounded-full text-base font-medium">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Description */}
              <div className="glass-panel rounded-xl p-6 bg-gradient-to-br from-brand-surface/50 to-brand-primary/50">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  🥐 About This Pastry
                </h3>
                <p className="text-brand-text leading-relaxed">
                  {pastry.flavor_tags ? (
                    `Indulge in the delightful ${pastry.name}, featuring ${pastry.flavor_tags}. ${
                      pastry.texture_tags ? `With its ${pastry.texture_tags} texture, ` : ''
                    }this ${
                      pastry.popularity_hint > 0.7 ? 'customer favorite' : pastry.popularity_hint > 0.5 ? 'popular choice' : 'unique offering'
                    } is ${
                      pastry.season_hint ? `perfect for ${pastry.season_hint}` : 'a delicious treat any time of year'
                    }. ${
                      pastry.is_core ? 'A signature item in our collection.' : ''
                    }`
                  ) : (
                    `Discover the exceptional taste of ${pastry.name}, carefully crafted for your enjoyment. Each bite delivers a memorable experience.`
                  )}
                </p>
              </div>

              {/* Pastry Metadata Grid */}
              <div className="glass-panel rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">📋 Pastry Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Popularity */}
                  <div>
                    <div className="text-xs text-brand-text-muted mb-1">Popularity</div>
                    <div className="text-base font-semibold text-brand-accent">
                      {Math.round(pastry.popularity_hint * 100)}%
                    </div>
                  </div>
                  
                  {/* Season */}
                  <div>
                    <div className="text-xs text-brand-text-muted mb-1">Season</div>
                    <div className="text-base font-semibold text-white">
                      {pastry.season_hint || 'All Year'}
                    </div>
                  </div>
                </div>
                
                {/* Additional Badges */}
                <div className="pt-4 border-t border-brand-border/30">
                  <div className="text-xs text-brand-text-muted mb-2">Attributes</div>
                  <div className="flex flex-wrap gap-2">
                    {pastry.is_core && (
                      <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
                        ⭐ Signature Item
                      </span>
                    )}
                    {pastry.is_guest && (
                      <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold">
                        🎁 Special Feature
                      </span>
                    )}
                    {pastry.popularity_hint > 0.7 && (
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                        🔥 Bestseller
                      </span>
                    )}
                    {pastry.season_hint && (
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                        🌦️ Seasonal
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pairing Tips */}
      <section className="py-8 px-4 bg-brand-primary/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Serving Suggestions */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                🍽️ Serving Suggestions
              </h3>
              <ul className="space-y-3 text-brand-text">
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent mt-1">•</span>
                  <span>Best enjoyed fresh, at room temperature</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent mt-1">•</span>
                  <span>Pairs wonderfully with both hot and cold beverages</span>
                </li>
                {pastry.texture_tags && (
                  <li className="flex items-start gap-3">
                    <span className="text-brand-accent mt-1">•</span>
                    <span>Notice the {pastry.texture_tags} texture with each bite</span>
                  </li>
                )}
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent mt-1">•</span>
                  <span>Perfect as a morning treat or afternoon indulgence</span>
                </li>
              </ul>
            </div>

            {/* Tasting Experience */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                👅 Tasting Experience
              </h3>
              <div className="space-y-3">
                {pastry.flavor_tags && (
                  <div>
                    <div className="text-sm text-brand-text-muted mb-2">Key Flavors</div>
                    <div className="flex flex-wrap gap-2">
                      {pastry.flavor_tags.split(',').slice(0, 4).map((tag, idx) => (
                        <span key={idx} className="bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-lg text-sm font-medium">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {pastry.texture_tags && (
                  <div>
                    <div className="text-sm text-brand-text-muted mb-2">Texture Profile</div>
                    <p className="text-brand-text">
                      {pastry.texture_tags.includes('flaky') ? '🥐 Light and flaky layers' :
                       pastry.texture_tags.includes('creamy') ? '🍰 Smooth and creamy' :
                       pastry.texture_tags.includes('crunchy') ? '🍪 Satisfying crunch' :
                       pastry.texture_tags}
                    </p>
                  </div>
                )}
                <div className="pt-3 border-t border-brand-border/30">
                  <div className="text-sm text-brand-text-muted">
                    💡 Tip: Take a moment to appreciate the aroma and appearance!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coffee Pairings Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Perfect Coffee Pairings
          </h2>
          
          {pairings.length === 0 ? (
            <div className="text-center py-12">
              <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto">
                <PastryIcon className="h-16 w-16 text-brand-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Pairings Yet</h3>
                <p className="text-brand-text-muted">
                  We're working on finding the perfect coffee pairings for this pastry.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pairings.map((pairing) => (
                <button
                  key={pairing.id}
                  onClick={() => pairing.pairing_slug && (window.location.href = `/s/${shop}/pairing/${pairing.pairing_slug}`)}
                  className="glass-panel rounded-2xl p-6 hover:scale-105 transition-transform text-left"
                >
                  {/* Coffee Image */}
                  <div className="mb-4">
                    {pairing.coffees.image_url ? (
                      <img
                        src={pairing.coffees.image_url}
                        alt={pairing.coffees.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-brand-surface rounded-lg flex items-center justify-center">
                        <span className="text-brand-text-muted">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Coffee Name */}
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {pairing.coffees.name}
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

                  {/* Coffee Flavor Notes */}
                  {pairing.coffees.flavor_notes && (
                    <div className="flex flex-wrap gap-2">
                      {pairing.coffees.flavor_notes.split(',').slice(0, 3).map((note, index) => (
                        <span
                          key={index}
                          className="bg-brand-primary/50 text-brand-text px-2 py-1 rounded-full text-xs"
                        >
                          {note.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
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
              <PastryIcon className="h-8 w-8 text-brand-accent" />
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

