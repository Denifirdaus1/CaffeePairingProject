import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Header } from './Header';
import { generatePairings } from '../services/geminiService';
import type { Coffee, Pastry, PairingResponse } from '../types';
import { CoffeeIcon } from './icons/CoffeeIcon';
import { PastryIcon } from './icons/PastryIcon';
import { supabase, uploadImage, deleteImage } from '../services/supabaseClient';
import type { CoffeeInsert, PastryInsert, CoffeeUpdate, PastryUpdate } from '../services/supabaseClient';
import { Spinner } from './Spinner';
import { InventoryItem } from './InventoryItem';
import { OptimizedImage } from './OptimizedImage';
import { Toast } from './Toast';
import { ApprovalWorkflow } from './ApprovalWorkflow';
import { MainShotManager } from './MainShotManager';
import { QRGenerator } from './QRGenerator';
import { ItemDetailModal } from './ItemDetailModal';
import { CafeSettingsModal } from './CafeSettingsModal';
import { useAuth } from '../contexts/AuthContext';

// Lazy load heavy components
const EditModal = lazy(() => import('./EditModal').then(module => ({ default: module.EditModal })));
const AddModal = lazy(() => import('./AddModal').then(module => ({ default: module.AddModal })));
const PairingResults = lazy(() => import('./PairingResults').then(module => ({ default: module.PairingResults })));

const SparkleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0L9.937 15.5Z"/>
    <path d="M20 3v4"/>
    <path d="M22 5h-4"/>
    <path d="M4 17v2"/>
    <path d="M5 18H3"/>
  </svg>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [pastries, setPastries] = useState<Pastry[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const [editingCoffee, setEditingCoffee] = useState<Coffee | null>(null);
  const [editingPastry, setEditingPastry] = useState<Pastry | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'coffee' | 'pastry' | null>(null);

  const [selectedCoffee, setSelectedCoffee] = useState<Coffee | null>(null);
  const [pairingResult, setPairingResult] = useState<PairingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Approval workflow state
  const [pairings, setPairings] = useState<any[]>([]);
  const [pairingsLoading, setPairingsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'pairings' | 'approvals' | 'mainshot' | 'qrgenerator'>('inventory');
  
  // Item detail modal state
  const [detailModalItem, setDetailModalItem] = useState<Coffee | Pastry | null>(null);
  const [detailModalType, setDetailModalType] = useState<'coffee' | 'pastry' | null>(null);

  // Settings modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Get café ID from user context
  const getCafeId = async () => {
    if (!user?.cafe_profile?.id) {
      throw new Error('Café profile not found');
    }
    return user.cafe_profile.id;
  };

  // Fetch pairings for approval workflow
  const fetchPairings = useCallback(async () => {
    if (!user?.cafe_profile?.id) return;
    
    setPairingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pairings')
        .select(`
          *,
          coffees (id, name, image_url),
          pastries (id, name, image_url)
        `)
        .eq('cafe_id', user.cafe_profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPairings(data || []);
    } catch (error) {
      console.error('Error fetching pairings:', error);
      setToast({ message: 'Failed to load pairings', type: 'error' });
    } finally {
      setPairingsLoading(false);
    }
  }, [user?.cafe_profile?.id]);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const cafeId = await getCafeId();
        if (!cafeId) {
          setInventoryError('Café profile not found');
          setInventoryLoading(false);
          return;
        }
        await fetchPairings();
      } catch (error: any) {
        console.error('Error fetching café:', error);
        setInventoryError(`Error fetching café: ${error.message}`);
        setInventoryLoading(false);
      }
    };

    fetchTenant();
  }, [user, fetchPairings]);

  const fetchInventory = async () => {
    try {
      const cafeId = await getCafeId();
      if (!cafeId) return;

      setInventoryLoading(true);
      setInventoryError(null);

      const [coffeeRes, pastryRes] = await Promise.all([
        supabase.from('coffees').select('*').eq('cafe_id', cafeId),
        supabase.from('pastries').select('*').eq('cafe_id', cafeId)
      ]);

      if (coffeeRes.error) {
        const message = coffeeRes.error.message;
        setInventoryError(message);
        return;
      }

      if (pastryRes.error) {
        const message = pastryRes.error.message;
        setInventoryError(message);
        return;
      }

      setCoffees(coffeeRes.data || []);
      setPastries(pastryRes.data || []);
    } catch (error: any) {
      const message = error.message;
      setInventoryError(message);
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user]);

  const handleAddCoffee = async (formData: Omit<CoffeeInsert, 'cafe_id' | 'image_path' | 'image_url'>, imageFile: File) => {
    try {
      const cafeId = await getCafeId();
      const { publicUrl, path } = await uploadImage(imageFile, 'coffee-images');
      const coffeeToInsert: CoffeeInsert = { ...formData, cafe_id: cafeId, image_url: publicUrl, image_path: path };
      const { data, error } = await supabase.from('coffees').insert(coffeeToInsert).select().single();
      if (error) throw error;
      setCoffees(prev => [data, ...prev]);
      setIsAddModalOpen(false);
      setToast({ message: 'Coffee added successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: `Error adding coffee: ${error.message}`, type: 'error' });
    }
  };

  const handleAddPastry = async (formData: Omit<PastryInsert, 'cafe_id' | 'image_path' | 'image_url'>, imageFile: File) => {
    try {
      const cafeId = await getCafeId();
      const { publicUrl, path } = await uploadImage(imageFile, 'pastry-images');
      const pastryToInsert: PastryInsert = { ...formData, cafe_id: cafeId, image_url: publicUrl, image_path: path };
      const { data, error } = await supabase.from('pastries').insert(pastryToInsert).select().single();
      if (error) throw error;
      setPastries(prev => [data, ...prev]);
      setIsAddModalOpen(false);
      setToast({ message: 'Pastry added successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: `Error adding pastry: ${error.message}`, type: 'error' });
    }
  };

  const handleUpdateCoffee = async (id: string, updates: CoffeeUpdate, newImageFile: File | null) => {
    try {
      const cafeId = await getCafeId();
      let oldImagePath: string | undefined;
      if (newImageFile) {
        const currentCoffee = coffees.find(c => c.id === id);
        oldImagePath = currentCoffee?.image_path;
        const { publicUrl, path } = await uploadImage(newImageFile, 'coffee-images');
        updates.image_url = publicUrl;
        updates.image_path = path;
      }
      const { data, error } = await supabase.from('coffees').update(updates).eq('id', id).eq('cafe_id', cafeId).select().single();
      if (error) throw error;
      if (oldImagePath) {
        await deleteImage('coffee-images', oldImagePath);
      }
      setCoffees(prev => prev.map(c => c.id === id ? data : c));
      setEditingCoffee(null);
      setToast({ message: 'Coffee updated successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: `Error updating coffee: ${error.message}`, type: 'error' });
    }
  };

  const handleUpdatePastry = async (id: string, updates: PastryUpdate, newImageFile: File | null) => {
    try {
      const cafeId = await getCafeId();
      let oldImagePath: string | undefined;
      if (newImageFile) {
        const currentPastry = pastries.find(p => p.id === id);
        oldImagePath = currentPastry?.image_path;
        const { publicUrl, path } = await uploadImage(newImageFile, 'pastry-images');
        updates.image_url = publicUrl;
        updates.image_path = path;
      }
      const { data, error } = await supabase.from('pastries').update(updates).eq('id', id).eq('cafe_id', cafeId).select().single();
      if (error) throw error;
      if (oldImagePath) {
        await deleteImage('pastry-images', oldImagePath);
      }
      setPastries(prev => prev.map(p => p.id === id ? data : p));
      setEditingPastry(null);
      setToast({ message: 'Pastry updated successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: `Error updating pastry: ${error.message}`, type: 'error' });
    }
  };

  const handleDeleteCoffee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const cafeId = await getCafeId();
      const coffeeToDelete = coffees.find(c => c.id === id);
      const { error } = await supabase.from('coffees').delete().eq('id', id).eq('cafe_id', cafeId);
      if (error) throw error;
      if (coffeeToDelete?.image_path) {
        await deleteImage('coffee-images', coffeeToDelete.image_path);
      }
      setCoffees(prev => prev.filter(c => c.id !== id));
      setToast({ message: 'Coffee deleted successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: `Error deleting coffee: ${error.message}`, type: 'error' });
    }
  };

  const handleDeletePastry = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const cafeId = await getCafeId();
      const pastryToDelete = pastries.find(p => p.id === id);
      const { error } = await supabase.from('pastries').delete().eq('id', id).eq('cafe_id', cafeId);
      if (error) throw error;
      if (pastryToDelete?.image_path) {
        await deleteImage('pastry-images', pastryToDelete.image_path);
      }
      setPastries(prev => prev.filter(p => p.id !== id));
      setToast({ message: 'Pastry deleted successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: `Error deleting pastry: ${error.message}`, type: 'error' });
    }
  };

  const handleGeneratePairings = useCallback(async () => {
    if (!selectedCoffee) return;
    setIsLoading(true);
    setError(null);
    setPairingResult(null);
    try {
      const result = await generatePairings(selectedCoffee, pastries);
      setPairingResult(result);
      
      // Save pairings to database for approval workflow
      if (result.pairs && result.pairs.length > 0) {
        const cafeId = await getCafeId();
        
        // Check for existing pairings to avoid duplicates
        const { data: existingPairings } = await supabase
          .from('pairings')
          .select('coffee_id, pastry_id')
          .eq('cafe_id', cafeId)
          .eq('coffee_id', selectedCoffee.id);
        
        const existingKeys = new Set(
          existingPairings?.map(p => `${p.coffee_id}-${p.pastry_id}`) || []
        );
        
        const pairingInserts = result.pairs
          .map(pair => ({
            cafe_id: cafeId,
            coffee_id: selectedCoffee.id,
            pastry_id: pair.pastry.id,
            score: pair.score,
            why: pair.why_marketing,
            status: 'draft',
            is_approved: false,
            is_published: false
          }))
          .filter(pair => !existingKeys.has(`${pair.coffee_id}-${pair.pastry_id}`));

        if (pairingInserts.length > 0) {
          const { error } = await supabase
            .from('pairings')
            .insert(pairingInserts);

          if (error) {
            console.error('Error saving pairings:', error);
            setToast({ message: `Error: ${error.message}`, type: 'error' });
          } else {
            setToast({ message: `Saved ${pairingInserts.length} new pairings`, type: 'success' });
            // Refresh pairings list
            await fetchPairings();
          }
        } else {
          setToast({ message: 'All pairings already exist in database', type: 'info' });
          // Still refresh to show existing pairings
          await fetchPairings();
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCoffee, pastries, getCafeId, fetchPairings]);

  const handleSelectCoffee = useCallback((coffee: Coffee) => {
    setSelectedCoffee(prev => (prev?.id === coffee.id ? null : coffee));
    setPairingResult(null);
  }, []);

  const openAddModal = useCallback((type: 'coffee' | 'pastry') => {
    setAddModalType(type);
    setIsAddModalOpen(true);
  }, []);

  // Memoized coffee list for performance
  const coffeeList = useMemo(() => {
    if (inventoryLoading) return <div className="flex w-full justify-center py-6"><Spinner /></div>;
    if (inventoryError) return <p className="rounded-2xl bg-red-900/40 p-4 text-sm text-red-200">{inventoryError}</p>;
    if (coffees.length === 0) return <p className="rounded-2xl bg-brand-bg/40 p-4 text-sm text-brand-text/60">No coffees added yet.</p>;
    
    return coffees.map(coffee => (
      <InventoryItem 
        key={coffee.id} 
        item={coffee} 
        type="coffee"
        onEdit={() => setEditingCoffee(coffee)}
        onDelete={() => handleDeleteCoffee(coffee.id, coffee.name)}
      />
    ));
  }, [coffees, inventoryLoading, inventoryError]);

  // Memoized pastry list for performance
  const pastryList = useMemo(() => {
    if (inventoryLoading) return <div className="flex w-full justify-center py-6"><Spinner /></div>;
    if (inventoryError) return <p className="rounded-2xl bg-red-900/40 p-4 text-sm text-red-200">{inventoryError}</p>;
    if (pastries.length === 0) return <p className="rounded-2xl bg-brand-bg/40 p-4 text-sm text-brand-text/60">No pastries added yet.</p>;
    
    return pastries.map(pastry => (
      <InventoryItem 
        key={pastry.id} 
        item={pastry} 
        type="pastry"
        onEdit={() => setEditingPastry(pastry)}
        onDelete={() => handleDeletePastry(pastry.id, pastry.name)}
      />
    ));
  }, [pastries, inventoryLoading, inventoryError]);

  // Memoized coffee selection list
  const coffeeSelectionList = useMemo(() => {
    if (inventoryLoading) return <div className="flex w-full justify-center py-6"><Spinner /></div>;
    if (coffees.length === 0) return <p className="w-full rounded-2xl bg-brand-bg/40 p-4 text-center text-sm text-brand-text/60">Add coffee to your inventory to start pairing.</p>;
    
    return coffees.map(coffee => {
      const isActive = selectedCoffee?.id === coffee.id;
      const baseClasses = 'group relative flex-shrink-0 snap-center rounded-2xl border px-3 pb-3 pt-3 transition-all duration-200 sm:w-36 w-32';
      const activeClasses = isActive
        ? 'border-brand-accent bg-brand-accent/10 shadow-lg shadow-brand-accent/20'
        : 'border-brand-border/50 bg-brand-surface/40 hover:border-brand-accent/50 hover:bg-brand-surface/60';
      
      return (
        <div
          key={coffee.id}
          className={`${baseClasses} ${activeClasses} cursor-pointer`}
          onClick={() => handleSelectCoffee(coffee)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectCoffee(coffee)}
          role="button"
          tabIndex={0}
        >
          <div className="relative mb-2 overflow-hidden rounded-xl">
            <OptimizedImage
              src={coffee.image_url || '/placeholder-coffee.jpg'}
              alt={coffee.name}
              width={300}
              height={300}
              className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {isActive && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-brand-accent/20">
                <div className="rounded-full bg-brand-accent p-2 text-white shadow-lg">
                  <SparkleIcon className="h-4 w-4" />
                </div>
              </div>
            )}
          </div>
          <p className="text-center text-xs font-medium text-white truncate">{coffee.name}</p>
          <p className="text-[11px] text-brand-text/60 line-clamp-2 text-left">{coffee.flavor_notes}</p>
        </div>
      );
    });
  }, [coffees, selectedCoffee, inventoryLoading, handleSelectCoffee]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_60%)]" />
      </div>

      <Header />

      {/* Settings Button (Fixed Position) */}
      <button
        onClick={() => setIsSettingsModalOpen(true)}
        className="fixed top-20 right-6 z-40 p-3 bg-brand-accent/20 hover:bg-brand-accent/30 border border-brand-accent/30 rounded-xl transition-all hover:scale-105 group"
        aria-label="Café Settings"
        title="Café Settings"
      >
        <svg className="w-6 h-6 text-brand-accent group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 rounded-xl bg-brand-surface/40 p-1">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'inventory'
                  ? 'bg-brand-accent text-white shadow-lg'
                  : 'text-brand-text-muted hover:text-white hover:bg-brand-surface/60'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('pairings')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'pairings'
                  ? 'bg-brand-accent text-white shadow-lg'
                  : 'text-brand-text-muted hover:text-white hover:bg-brand-surface/60'
              }`}
            >
              Pairings
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'approvals'
                  ? 'bg-brand-accent text-white shadow-lg'
                  : 'text-brand-text-muted hover:text-white hover:bg-brand-surface/60'
              }`}
            >
              Approvals
              {pairings.filter(p => !p.is_approved).length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {pairings.filter(p => !p.is_approved).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('mainshot')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'mainshot'
                  ? 'bg-brand-accent text-white shadow-lg'
                  : 'text-brand-text-muted hover:text-white hover:bg-brand-surface/60'
              }`}
            >
              Main Shot
            </button>
            <button
              onClick={() => setActiveTab('qrgenerator')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'qrgenerator'
                  ? 'bg-brand-accent text-white shadow-lg'
                  : 'text-brand-text-muted hover:text-white hover:bg-brand-surface/60'
              }`}
            >
              Public QR
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'inventory' && (
          <>
            {/* Coffee Inventory */}
            <section className="glass-panel rounded-3xl p-6 lg:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-brand-bg/70 p-3 text-brand-accent shadow-inner ring-1 ring-brand-accent/20">
                    <CoffeeIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Coffee Inventory</h2>
                    <p className="text-sm text-brand-text/70">Click on any coffee to view details and generate QR code</p>
                  </div>
                </div>
                <button
                  onClick={() => openAddModal('coffee')}
                  className="button-primary-pulse inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-accent via-brand-accent/80 to-amber-400/70 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                >
                  <span>+</span>
                  Add Coffee
                </button>
              </div>

              {coffees.length === 0 ? (
                <div className="text-center py-12">
                  <CoffeeIcon className="h-16 w-16 text-brand-accent/30 mx-auto mb-4" />
                  <p className="text-brand-text-muted">No coffees yet. Add your first coffee to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coffees.map(coffee => (
                    <button
                      key={coffee.id}
                      onClick={() => {
                        setDetailModalItem(coffee);
                        setDetailModalType('coffee');
                      }}
                      className="glass-panel rounded-xl p-4 hover:scale-105 transition-transform cursor-pointer text-left group"
                    >
                      {coffee.image_url && (
                        <img
                          src={coffee.image_url}
                          alt={coffee.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-accent transition-colors">
                        {coffee.name}
                      </h3>
                      {coffee.flavor_notes && (
                        <p className="text-brand-text-muted text-xs line-clamp-2">
                          {coffee.flavor_notes}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-brand-accent">{Math.round(coffee.popularity_hint * 100)}% popular</span>
                        {coffee.is_main_shot && (
                          <span className="bg-brand-accent/20 text-brand-accent px-2 py-1 rounded-full">Main Shot</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Pastry Inventory */}
            <section className="glass-panel rounded-3xl p-6 lg:p-8 mt-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-brand-bg/70 p-3 text-brand-accent shadow-inner ring-1 ring-brand-accent/20">
                    <PastryIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Pastry Inventory</h2>
                    <p className="text-sm text-brand-text/70">Click on any pastry to view details and generate QR code</p>
                  </div>
                </div>
                <button
                  onClick={() => openAddModal('pastry')}
                  className="button-primary-pulse inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-accent via-brand-accent/80 to-amber-400/70 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                >
                  <span>+</span>
                  Add Pastry
                </button>
              </div>

              {pastries.length === 0 ? (
                <div className="text-center py-12">
                  <PastryIcon className="h-16 w-16 text-brand-accent/30 mx-auto mb-4" />
                  <p className="text-brand-text-muted">No pastries yet. Add your first pastry to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastries.map(pastry => (
                    <button
                      key={pastry.id}
                      onClick={() => {
                        setDetailModalItem(pastry);
                        setDetailModalType('pastry');
                      }}
                      className="glass-panel rounded-xl p-4 hover:scale-105 transition-transform cursor-pointer text-left group"
                    >
                      {pastry.image_url && (
                        <img
                          src={pastry.image_url}
                          alt={pastry.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-accent transition-colors">
                        {pastry.name}
                      </h3>
                      {pastry.flavor_tags && (
                        <p className="text-brand-text-muted text-xs line-clamp-2">
                          {pastry.flavor_tags}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-brand-accent">{Math.round(pastry.popularity_hint * 100)}% popular</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Pairings Tab */}
        {activeTab === 'pairings' && (
          <>
            {/* Existing Pairings */}
            <section className="glass-panel rounded-3xl p-6 lg:p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">Your Pairings</h2>
                  <p className="text-sm text-brand-text/70">All coffee and pastry pairings generated by AI</p>
                </div>
                <span className="bg-brand-accent/20 text-brand-accent px-4 py-2 rounded-full text-sm font-semibold">
                  {pairings.length} Total
                </span>
              </div>

              {pairingsLoading ? (
                <div className="text-center py-12">
                  <Spinner />
                  <p className="text-brand-text-muted mt-4">Loading pairings...</p>
                </div>
              ) : pairings.length === 0 ? (
                <div className="text-center py-12">
                  <SparkleIcon className="h-16 w-16 text-brand-accent/30 mx-auto mb-4" />
                  <p className="text-brand-text-muted">No pairings yet. Generate your first pairing below!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pairings.map(pairing => (
                    <div
                      key={pairing.id}
                      className="glass-panel rounded-xl p-4 hover:scale-105 transition-transform"
                    >
                      {/* Coffee & Pastry Images */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1">
                          {pairing.coffees?.image_url && (
                            <img
                              src={pairing.coffees.image_url}
                              alt={pairing.coffees.name}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                          )}
                        </div>
                        <span className="text-brand-accent text-2xl">+</span>
                        <div className="flex-1">
                          {pairing.pastries?.image_url && (
                            <img
                              src={pairing.pastries.image_url}
                              alt={pairing.pastries.name}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      </div>

                      {/* Names */}
                      <h3 className="text-sm font-semibold text-white mb-1">
                        {pairing.coffees?.name} × {pairing.pastries?.name}
                      </h3>

                      {/* Score */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-brand-text-muted">Score</span>
                        <span className="text-lg font-bold text-brand-accent">
                          {Math.round(pairing.score * 100)}%
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {pairing.is_approved && (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-semibold">
                            ✓ Approved
                          </span>
                        )}
                        {pairing.is_published && (
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-semibold">
                            📢 Published
                          </span>
                        )}
                        {!pairing.is_approved && (
                          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-semibold">
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Generate New Pairings */}
            <section className="glass-panel rounded-3xl p-6 lg:p-8">
              <h2 className="text-2xl font-semibold text-white mb-2">Generate Smart Pairings</h2>
              <p className="text-sm text-brand-text/70 mb-6">Choose your favorite coffee, then let AI find the best pastry pairings.</p>
              
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl bg-white/5 p-4 mb-6">
                {coffeeSelectionList}
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleGeneratePairings}
                  disabled={!selectedCoffee || pastries.length === 0 || isLoading}
                  className="button-primary-pulse inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-accent via-brand-accent/90 to-amber-400/70 px-8 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:shadow-[0_30px_60px_-25px_rgba(162,123,92,0.85)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-brand-text/50"
                >
                  <SparkleIcon className="h-5 w-5" />
                  {isLoading ? 'Thinking...' : 'Smart Pair with Pastry'}
                </button>
                {!selectedCoffee && pastries.length > 0 && coffees.length > 0 && (
                  <p className="text-sm text-brand-accent">Please select a coffee first.</p>
                )}
                {pastries.length === 0 && coffees.length > 0 && (
                  <p className="text-sm text-red-300">Add at least one pastry to enable pairing.</p>
                )}
              </div>

              <Suspense fallback={<div className="mt-10 text-center"><Spinner /></div>}>
                <PairingResults result={pairingResult} isLoading={isLoading} error={error} />
              </Suspense>
            </section>
          </>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <section className="glass-panel rounded-3xl p-6 lg:p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Pairing Approvals</h2>
            <p className="text-sm text-brand-text/70 mb-6">Review and approve AI-generated pairings before they appear on your public shop.</p>
            
            {pairingsLoading ? (
              <div className="text-center py-12">
                <Spinner />
                <p className="text-brand-text-muted mt-4">Loading pairings...</p>
              </div>
            ) : (
              <ApprovalWorkflow 
                pairings={pairings} 
                onApprovalChange={fetchPairings} 
              />
            )}
          </section>
        )}

        {/* Main Shot Tab */}
        {activeTab === 'mainshot' && (
          <section className="glass-panel rounded-3xl p-6 lg:p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Today's Main Shot</h2>
            <p className="text-sm text-brand-text/70 mb-6">Set your featured coffee for today. This will be highlighted on your public shop page.</p>
            
            <MainShotManager 
              coffees={coffees} 
              onUpdate={fetchInventory} 
            />
          </section>
        )}

        {/* QR Generator Tab */}
        {activeTab === 'qrgenerator' && (
          <section className="glass-panel rounded-3xl p-6 lg:p-8">
            <QRGenerator />
          </section>
        )}

        {/* Item Detail Modal */}
        {detailModalItem && detailModalType && (
          <ItemDetailModal
            item={detailModalItem}
            type={detailModalType}
            shopSlug={user?.cafe_profile?.shop_slug || ''}
            onClose={() => {
              setDetailModalItem(null);
              setDetailModalType(null);
            }}
          />
        )}

        {(editingCoffee || editingPastry) && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><Spinner /></div>}>
            <EditModal
              item={editingCoffee || editingPastry}
              type={editingCoffee ? 'coffee' : 'pastry'}
              onClose={() => {
                setEditingCoffee(null);
                setEditingPastry(null);
              }}
              onSaveCoffee={handleUpdateCoffee}
              onSavePastry={handleUpdatePastry}
            />
          </Suspense>
        )}

        {isAddModalOpen && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><Spinner /></div>}>
            <AddModal
              type={addModalType!}
              onClose={() => setIsAddModalOpen(false)}
              onAddCoffee={handleAddCoffee}
              onAddPastry={handleAddPastry}
            />
          </Suspense>
        )}
      </main>
      
      {/* Settings Modal */}
      {user?.cafe_profile && (
        <CafeSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          cafeProfile={{
            id: user.cafe_profile.id,
            cafe_name: user.cafe_profile.cafe_name,
            cafe_description: user.cafe_profile.cafe_description,
            logo_url: user.cafe_profile.logo_url,
            logo_path: (user.cafe_profile as any).logo_path,
          }}
          onUpdate={() => {
            // Refetch user data to get updated profile
            window.location.reload();
          }}
        />
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <footer className="relative z-10 py-8 text-center text-[11px] uppercase tracking-[0.3em] text-brand-text/40">
        <p>Café Owner AI Dashboard | Powered by Gemini & Supabase</p>
      </footer>
    </div>
  );
};
