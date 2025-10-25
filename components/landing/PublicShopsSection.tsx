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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicShops = async () => {
      try {
        const { data, error } = await supabase
          .from('cafe_profiles')
          .select('id, cafe_name, shop_slug, cafe_description, city, country, created_at')
          .not('shop_slug', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) {
          console.error('Error fetching shops:', error);
        } else {
          setShops(data || []);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicShops();
  }, []);

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
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Discover Our Partner Cafés</h2>
          <p className="text-xl text-brand-text/80 max-w-3xl mx-auto">
            Explore coffee collections and perfect pairings from our partner cafés. 
            Each café has their own public page where customers can discover their coffee offerings.
          </p>
        </div>

        {shops.length === 0 ? (
          <div className="text-center py-12">
            <CoffeeIcon className="h-16 w-16 text-brand-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Public Shops Yet</h3>
            <p className="text-brand-text-muted">
              Partner cafés will appear here once they set up their public pages.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {shops.map((shop) => (
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
                <h3 className="text-2xl font-bold text-white mb-4">How to Access Public Shops</h3>
                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="bg-brand-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                    <div>
                      <p className="text-white font-medium">Direct URL Access</p>
                      <p className="text-brand-text-muted text-sm">
                        Use the format: <code className="bg-brand-primary px-2 py-1 rounded text-brand-accent">/s/[shop-slug]</code>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-brand-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                    <div>
                      <p className="text-white font-medium">QR Code Scanning</p>
                      <p className="text-brand-text-muted text-sm">
                        Cafés can generate QR codes that link directly to their public pages
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-brand-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                    <div>
                      <p className="text-white font-medium">Search & Discovery</p>
                      <p className="text-brand-text-muted text-sm">
                        Customers can search for specific coffees and discover perfect pairings
                      </p>
                    </div>
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
