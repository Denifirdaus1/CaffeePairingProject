import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { CoffeeIcon } from './icons/CoffeeIcon';
import { Spinner } from './Spinner';
import { Toast } from './Toast';

interface Coffee {
  id: string;
  name: string;
  flavor_notes?: string;
  image_url?: string;
  is_main_shot: boolean;
  main_shot_until?: string;
}

interface MainShotManagerProps {
  coffees: Coffee[];
  onUpdate: () => void;
}

export const MainShotManager: React.FC<MainShotManagerProps> = ({
  coffees,
  onUpdate
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedCoffee, setSelectedCoffee] = useState<string>('');
  const [mainShotUntil, setMainShotUntil] = useState<string>('');

  // Get current main shot
  const currentMainShot = coffees.find(coffee => coffee.is_main_shot);

  useEffect(() => {
    if (currentMainShot?.main_shot_until) {
      setMainShotUntil(currentMainShot.main_shot_until);
    } else {
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setMainShotUntil(tomorrow.toISOString().split('T')[0]);
    }
  }, [currentMainShot]);

  const handleSetMainShot = async (coffeeId: string) => {
    setLoading(coffeeId);
    try {
      // First, clear any existing main shot
      if (currentMainShot) {
        await supabase
          .from('coffees')
          .update({ is_main_shot: false, main_shot_until: null })
          .eq('id', currentMainShot.id);
      }

      // Set new main shot
      const { error } = await supabase
        .from('coffees')
        .update({
          is_main_shot: true,
          main_shot_until: mainShotUntil
        })
        .eq('id', coffeeId);

      if (error) throw error;

      setToast({ message: 'Main shot updated successfully!', type: 'success' });
      onUpdate();
    } catch (error) {
      console.error('Error setting main shot:', error);
      setToast({ message: 'Failed to update main shot', type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveMainShot = async () => {
    if (!currentMainShot) return;
    
    setLoading(currentMainShot.id);
    try {
      const { error } = await supabase
        .from('coffees')
        .update({
          is_main_shot: false,
          main_shot_until: null
        })
        .eq('id', currentMainShot.id);

      if (error) throw error;

      setToast({ message: 'Main shot removed successfully!', type: 'success' });
      onUpdate();
    } catch (error) {
      console.error('Error removing main shot:', error);
      setToast({ message: 'Failed to remove main shot', type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const isExpired = (untilDate?: string) => {
    if (!untilDate) return false;
    return new Date(untilDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Current Main Shot - Enhanced */}
      {currentMainShot && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-accent/20 to-amber-500/20 backdrop-blur-sm border-2 border-brand-accent shadow-2xl">
          {/* Animated Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/0 via-brand-accent/10 to-brand-accent/0 animate-pulse"></div>
          
          {/* Badge */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 bg-gradient-to-r from-brand-accent to-amber-400 text-white px-4 py-2 rounded-full shadow-lg animate-pulse-glow">
              <span className="text-lg">⭐</span>
              <span className="font-bold text-sm">CURRENT MAIN SHOT</span>
            </div>
          </div>

          {isExpired(currentMainShot.main_shot_until) && (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                ⚠️ Expired
              </div>
            </div>
          )}

          {/* Content */}
          <div className="relative p-8">
            <div className="flex items-center gap-6 mb-6 mt-12">
              {currentMainShot.image_url ? (
                <div className="relative group">
                  <div className="absolute inset-0 bg-brand-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                  <img
                    src={currentMainShot.image_url}
                    alt={currentMainShot.name}
                    className="relative w-32 h-32 rounded-2xl object-cover shadow-xl"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-brand-surface rounded-2xl flex items-center justify-center">
                  <CoffeeIcon className="h-16 w-16 text-brand-accent" />
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-white mb-2">{currentMainShot.name}</h3>
                {currentMainShot.flavor_notes && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {currentMainShot.flavor_notes.split(',').slice(0, 4).map((note, idx) => (
                      <span key={idx} className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium border border-white/20">
                        {note.trim()}
                      </span>
                    ))}
                  </div>
                )}
                {currentMainShot.main_shot_until && (
                  <div className="flex items-center gap-2 text-brand-text">
                    <span className="text-sm font-semibold">Valid until:</span>
                    <span className="text-brand-accent font-bold">
                      {new Date(currentMainShot.main_shot_until).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleRemoveMainShot}
              disabled={loading === currentMainShot.id}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white px-6 py-3 rounded-xl transition-colors font-semibold shadow-lg"
            >
              {loading === currentMainShot.id ? (
                <Spinner />
              ) : (
                <>
                  <span className="text-xl">✕</span>
                  Remove Main Shot
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Set New Main Shot */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Set New Main Shot</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="coffee-select" className="block text-sm font-medium text-brand-text/90 mb-2">
              Select Coffee
            </label>
            <select
              id="coffee-select"
              value={selectedCoffee}
              onChange={(e) => setSelectedCoffee(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-brand-bg border border-brand-border focus:ring-2 focus:ring-brand-accent focus:border-transparent text-white"
              aria-label="Select coffee for main shot"
            >
              <option value="">Choose a coffee...</option>
              {coffees.map(coffee => (
                <option key={coffee.id} value={coffee.id}>
                  {coffee.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="main-shot-until" className="block text-sm font-medium text-brand-text/90 mb-2">
              Main Shot Until
            </label>
            <input
              id="main-shot-until"
              type="date"
              value={mainShotUntil}
              onChange={(e) => setMainShotUntil(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl bg-brand-bg border border-brand-border focus:ring-2 focus:ring-brand-accent focus:border-transparent text-white"
              aria-label="Set expiration date for main shot"
            />
          </div>

          <button
            onClick={() => selectedCoffee && handleSetMainShot(selectedCoffee)}
            disabled={!selectedCoffee || loading !== null}
            className="w-full flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent/90 disabled:bg-brand-accent/50 text-white px-4 py-3 rounded-lg transition-colors"
          >
            {loading ? (
              <Spinner />
            ) : (
              <>
                <CoffeeIcon className="h-4 w-4" />
                Set as Main Shot
              </>
            )}
          </button>
        </div>
      </div>

      {/* Coffee List */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Available Coffees</h3>
        
        {coffees.length === 0 ? (
          <p className="text-brand-text-muted text-center py-8">
            No coffees available. Add some coffees to set a main shot.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coffees.map(coffee => (
              <div
                key={coffee.id}
                className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                  coffee.is_main_shot
                    ? 'border-brand-accent bg-brand-accent/10'
                    : 'border-brand-border bg-brand-surface/40 hover:border-brand-accent/50'
                }`}
                onClick={() => setSelectedCoffee(coffee.id)}
              >
                <div className="flex items-center gap-3">
                  {coffee.image_url && (
                    <img
                      src={coffee.image_url}
                      alt={coffee.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{coffee.name}</h4>
                    {coffee.flavor_notes && (
                      <p className="text-sm text-brand-text-muted line-clamp-1">
                        {coffee.flavor_notes}
                      </p>
                    )}
                    {coffee.is_main_shot && (
                      <span className="text-xs text-brand-accent font-semibold">
                        Current Main Shot
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
