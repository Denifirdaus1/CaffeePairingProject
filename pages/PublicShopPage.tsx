import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { CoffeeIcon } from '../components/icons/CoffeeIcon';
import { QRCodeIcon } from '../components/icons/QRCodeIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { CoffeeSearch } from '../components/public/CoffeeSearch';
import { PublicPairingGenerator } from '../components/public/PublicPairingGenerator';
import { OptimizedImage } from '../components/OptimizedImage';
import { ShoppingCart } from '../components/public/ShoppingCart';
import { useCart } from '../contexts/CartContext';

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

interface Bean {
  id: string;
  cafe_id: string;
  name: string;
  origin?: string;
  roast_type?: string;
  flavor_notes?: string;
  image_url?: string;
}

interface Preparation {
  id: string;
  bean_id: string;
  cafe_id: string;
  method_name: string;
  price: number;
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
  price?: number;
}

interface Pastry {
  id: string;
  name: string;
  slug?: string;
  flavor_tags?: string;
  texture_tags?: string;
  image_url?: string;
  popularity_hint: number;
  price?: number;
}

interface PublishedPairing {
  id: string;
  coffee_id: string;
  pastry_id: string;
  score: number;
  why: string;
  pairing_slug: string;
  beans: Bean;
  pastries: Pastry;
}

export const PublicShopPage: React.FC = () => {
  const { shop } = useParams<{ shop: string }>();
  const { getTotalItems, addToCart } = useCart();
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [preparationsByBean, setPreparationsByBean] = useState<Record<string, Preparation[]>>({});
  const [pastries, setPastries] = useState<Pastry[]>([]);
  const [publishedPairings, setPublishedPairings] = useState<PublishedPairing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [beanModalOpen, setBeanModalOpen] = useState(false);
  const [beanForModal, setBeanForModal] = useState<Bean | null>(null);
  const [selectedPreparationId, setSelectedPreparationId] = useState<string | null>(null);
  const [autoPairBeanId, setAutoPairBeanId] = useState<string | undefined>(undefined);

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

        // Fetch beans for this shop
        const { data: beansData, error: beansError } = await supabase
          .from('beans')
          .select('*')
          .eq('cafe_id', shopData.id)
          .order('name', { ascending: true });

        if (beansError) {
          console.error('Error fetching beans:', beansError);
        } else {
          setBeans(beansData || []);
        }

        // Fetch preparations for this shop and group by bean
        const { data: prepData, error: prepError } = await supabase
          .from('preparations')
          .select('*')
          .eq('cafe_id', shopData.id);

        if (prepError) {
          console.error('Error fetching preparations:', prepError);
        } else {
          const grouped: Record<string, Preparation[]> = {};
          (prepData || []).forEach((p) => {
            if (!grouped[p.bean_id]) grouped[p.bean_id] = [];
            grouped[p.bean_id].push(p as unknown as Preparation);
          });
          setPreparationsByBean(grouped);
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

        // Fetch published pairings for this shop (beans instead of coffees)
        const { data: pairingsData, error: pairingsError } = await supabase
          .from('pairings')
          .select(`
            *,
            beans (*),
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

  const handleBeanSelect = (bean: Bean) => {
    // For future: navigate to bean detail if needed
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
                {shopData.logo_url ? (
                  <img
                    src={shopData.logo_url}
                    alt={shopData.cafe_name}
                    className="h-8 w-8 object-cover rounded-lg"
                  />
                ) : (
                  <CoffeeIcon className="h-8 w-8 text-brand-accent" />
                )}
                <span className="text-xl font-bold">{shopData.cafe_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Share Button - Icon Only */}
              <button
                onClick={handleShareShop}
                className="relative flex items-center justify-center text-brand-text hover:text-white transition-all hover:bg-brand-accent/10 p-2.5 rounded-lg"
                aria-label="Share Shop"
                title="Share Shop"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              
              {/* Shopping Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 text-sm font-medium text-brand-text hover:text-white transition-all hover:bg-brand-accent/10 px-3 py-2 rounded-lg"
                aria-label="Shopping Cart"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
                <span className="hidden sm:inline">Cart</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Interactive Pairing Generator - Beans-first */}
      {beans.length > 0 && pastries.length > 0 && (
        <PublicPairingGenerator
          beans={beans}
          preparationsByBean={preparationsByBean}
          pastries={pastries}
          shopSlug={shop || ''}
          initialBeanId={autoPairBeanId}
          autoGenerate={!!autoPairBeanId}
        />
      )}

      {/* Recommended Pairings Section - Right After Pairing Generator */}
      {publishedPairings.length > 0 && (
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Recommended Pairings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedPairings.map(pairing => {
                const { addToCart, isInCart } = useCart();
                const coffeePrice = pairing.coffees.price || 0;
                const pastryPrice = pairing.pastries.price || 0;
                const combinedPrice = coffeePrice + pastryPrice;
                const hasBothPrices = pairing.coffees.price != null && pairing.pastries.price != null;
                const inCart = isInCart(pairing.id, 'pairing');
                
                return (
                  <div
                    key={pairing.id}
                    className="glass-panel rounded-2xl p-6 hover:scale-105 transition-transform border-2 border-brand-accent/20"
                  >
                    <div onClick={() => window.location.href = `/s/${shop}/pairing/${pairing.pairing_slug}`} className="cursor-pointer">
                      <div className="flex items-center gap-4 mb-4">
                        {pairing.beans?.image_url && (
                          <OptimizedImage
                            src={pairing.beans.image_url}
                            alt={pairing.beans.name}
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
                        {pairing.beans?.name} + {pairing.pastries.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-brand-accent font-bold">
                          {Math.round(pairing.score * 100)}% Match
                        </span>
                      </div>
                      {pairing.why && (
                        <p className="text-brand-text-muted text-sm line-clamp-2">{pairing.why}</p>
                      )}
                    </div>
                    
                    {/* Price and Add to Cart - Beans-first (uses cheapest preparation) */}
                    {(() => {
                      const beanPreps = preparationsByBean[pairing.beans?.id || ''] || [];
                      const cheapest = [...beanPreps].sort((a, b) => Number(a.price) - Number(b.price))[0];
                      const beanPrice = cheapest ? Number(cheapest.price) : null;
                      const pastryPrice = pairing.pastries.price ?? null;
                      const hasBothPrices = beanPrice != null && pastryPrice != null;
                      const combinedPrice = hasBothPrices ? (beanPrice! + pastryPrice!) : null;
                      const { addToCart, isInCart } = useCart();
                      const inCart = isInCart(pairing.id, 'pairing');

                      return (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          {hasBothPrices ? (
                            <>
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-sm text-brand-text-muted">
                                  <div>Bean: €{beanPrice!.toFixed(2)}{cheapest?.method_name ? ` (${cheapest.method_name})` : ''}</div>
                                  <div>Pastry: €{(pastryPrice as number).toFixed(2)}</div>
                                </div>
                                <div className="text-2xl font-bold text-brand-accent">
                                  €{combinedPrice!.toFixed(2)}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!cheapest) return;
                                  addToCart({
                                    type: 'pairing',
                                    productId: pairing.id,
                                    name: `${pairing.beans?.name} + ${pairing.pastries.name}${cheapest?.method_name ? ` (${cheapest.method_name})` : ''}`,
                                    price: combinedPrice!,
                                    image_url: pairing.beans?.image_url,
                                    coffeeName: pairing.beans?.name, // keep keys for compatibility
                                    pastryName: pairing.pastries.name,
                                    coffeeId: pairing.beans?.id,
                                    pastryId: pairing.pastries.id,
                                    coffeePrice: beanPrice!,
                                    pastryPrice: pastryPrice!,
                                  });
                                }}
                                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                                  inCart
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent border border-brand-accent/30'
                                }`}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {inCart ? 'In Cart' : 'Add Pairing to Cart'}
                              </button>
                            </>
                          ) : (
                            <p className="text-sm text-brand-text-muted text-center">Prices not available</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Beans Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Our Beans & Preparations
          </h2>

          {beans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-brand-text-muted text-lg">
                No beans available yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {beans.map((bean) => (
                <div key={bean.id} className="glass-panel rounded-2xl p-6 hover:scale-105 transition-transform">
                  {bean.image_url && (
                    <OptimizedImage
                      src={bean.image_url}
                      alt={bean.name}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-xl font-semibold text-white mb-1">{bean.name}</h3>
                  <div className="text-brand-text-muted text-sm mb-3">
                    {[bean.origin, bean.roast_type].filter(Boolean).join(' • ')}
                  </div>
                  {bean.flavor_notes && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {bean.flavor_notes.split(',').slice(0, 4).map((note, idx) => (
                        <span key={idx} className="bg-brand-accent/15 text-white px-2 py-0.5 rounded text-xs">
                          {note.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => { setBeanForModal(bean); setSelectedPreparationId(null); setBeanModalOpen(true); }}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent border border-brand-accent/30"
                  >
                    Pilih Biji Ini
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* (Removed legacy Coffee sections in beans-first model) */}

      {/* Pastries Section */}
      {pastries.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Our Pastries
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastries.filter(pastry => pastry.slug).map((pastry) => {
                const { addToCart, isInCart } = useCart();
                const inCart = isInCart(pastry.id, 'pastry');
                
                return (
                  <div
                    key={pastry.id}
                    className="glass-panel rounded-2xl p-6 hover:scale-105 transition-transform"
                  >
                    <div onClick={() => window.location.href = `/s/${shop}/pastry/${pastry.slug}`} className="cursor-pointer">
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
                    </div>
                    
                    {/* Price and Add to Cart */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      {pastry.price != null ? (
                        <span className="text-2xl font-bold text-brand-accent">
                          €{pastry.price.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-brand-text-muted">Price not set</span>
                      )}
                      
                      {pastry.price != null && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart({
                              type: 'pastry',
                              productId: pastry.id,
                              name: pastry.name,
                              price: pastry.price!,
                              image_url: pastry.image_url,
                            });
                          }}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                            inCart
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent border border-brand-accent/30'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {inCart ? 'In Cart' : 'Add to Cart'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-brand-border/30 bg-brand-primary/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 text-white mb-4">
              {shopData.logo_url ? (
                <img
                  src={shopData.logo_url}
                  alt={shopData.cafe_name}
                  className="h-8 w-8 object-cover rounded-lg"
                />
              ) : (
                <CoffeeIcon className="h-8 w-8 text-brand-accent" />
              )}
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
      
      {/* Shopping Cart */}
      <ShoppingCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Bean Preparation Modal */}
      {beanModalOpen && beanForModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50" onClick={() => setBeanModalOpen(false)}>
          <div className="bg-brand-primary rounded-lg shadow-2xl p-6 w-full max-w-xl m-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-2">Pilih Cara Penyajian untuk:</h3>
            <p className="text-brand-accent font-semibold mb-4">{beanForModal.name}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {(preparationsByBean[beanForModal.id] || []).map(prep => (
                <label key={prep.id} className="flex items-center justify-between bg-white/5 rounded-md px-3 py-2 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="prep"
                      checked={selectedPreparationId === prep.id}
                      onChange={() => setSelectedPreparationId(prep.id)}
                      className="accent-brand-accent"
                    />
                    <span className="text-white/90">{prep.method_name}</span>
                  </div>
                  <span className="text-brand-accent font-semibold">€{Number(prep.price).toFixed(2)}</span>
                </label>
              ))}
              {(preparationsByBean[beanForModal.id] || []).length === 0 && (
                <p className="text-sm text-brand-text-muted">No preparation methods yet.</p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-4">
              <button onClick={() => setBeanModalOpen(false)} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500">Cancel</button>
              <button
                disabled={!selectedPreparationId}
                onClick={() => {
                  if (!selectedPreparationId || !beanForModal) return;
                  const prep = (preparationsByBean[beanForModal.id] || []).find(p => p.id === selectedPreparationId);
                  if (!prep) return;
                  addToCart({
                    type: 'coffee',
                    productId: prep.id,
                    name: `${beanForModal.name} - ${prep.method_name}`,
                    price: Number(prep.price),
                    image_url: beanForModal.image_url,
                  });
                  setBeanModalOpen(false);
                  setAutoPairBeanId(beanForModal.id);
                }}
                className={`bg-brand-accent text-white font-bold py-2 px-6 rounded-lg ${!selectedPreparationId ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                Tambahkan ke Pesanan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
