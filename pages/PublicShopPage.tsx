import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { CoffeeIcon } from '../components/icons/CoffeeIcon';
import { QRCodeIcon } from '../components/icons/QRCodeIcon';
import { CoffeeSearch } from '../components/public/CoffeeSearch';

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

export const PublicShopPage: React.FC = () => {
  const { shop } = useParams<{ shop: string }>();
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [coffees, setCoffees] = useState<Coffee[]>([]);
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
          setCoffees(coffeesData || []);
          setDisplayCoffees(coffeesData || []);
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
            <div className="flex items-center gap-3 text-white">
              <CoffeeIcon className="h-8 w-8 text-brand-accent" />
              <span className="text-xl font-bold">{shopData.cafe_name}</span>
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

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Welcome to
            <span className="block text-brand-accent">{shopData.cafe_name}</span>
          </h1>
          {shopData.cafe_description && (
            <p className="text-xl text-brand-text/80 mb-8 max-w-3xl mx-auto">
              {shopData.cafe_description}
            </p>
          )}
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <CoffeeSearch
              coffees={coffees}
              onCoffeeSelect={handleCoffeeSelect}
              placeholder="Search our coffee collection..."
            />
          </div>
        </div>
      </section>

      {/* Today's Main Shot */}
      {coffees.some(coffee => coffee.is_main_shot) && (
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="glass-panel rounded-2xl p-6 border-2 border-brand-accent">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-brand-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Today's Main Shot
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coffees
                  .filter(coffee => coffee.is_main_shot)
                  .map(coffee => (
                    <div key={coffee.id} className="flex items-center gap-4">
                      {coffee.image_url && (
                        <img
                          src={coffee.image_url}
                          alt={coffee.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-white">{coffee.name}</h3>
                        {coffee.flavor_notes && (
                          <p className="text-brand-text-muted">{coffee.flavor_notes}</p>
                        )}
                        {coffee.online_shop_url && (
                          <a
                            href={coffee.online_shop_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-accent hover:underline text-sm"
                          >
                            Order Online →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
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
              {displayCoffees.map(coffee => (
                <div
                  key={coffee.id}
                  className="glass-panel rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => window.location.href = `/s/${shop}/coffee/${coffee.slug}`}
                >
                  {coffee.image_url && (
                    <img
                      src={coffee.image_url}
                      alt={coffee.name}
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
