import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { generatePairings } from './services/geminiService';
import type { Coffee, Pastry, PairingResponse } from './types';
import { CoffeeIcon } from './components/icons/CoffeeIcon';
import { PastryIcon } from './components/icons/PastryIcon';
import { supabase, uploadImage, deleteImage } from './services/supabaseClient';
import type { CoffeeInsert, PastryInsert, CoffeeUpdate, PastryUpdate } from './services/supabaseClient';
import { Spinner } from './components/Spinner';
import { InventoryItem } from './components/InventoryItem';
import { LazyImage } from './components/LazyImage';
import { Toast } from './components/Toast';

// Lazy load heavy components
const EditModal = lazy(() => import('./components/EditModal').then(module => ({ default: module.EditModal })));
const AddModal = lazy(() => import('./components/AddModal').then(module => ({ default: module.AddModal })));
const PairingResults = lazy(() => import('./components/PairingResults').then(module => ({ default: module.PairingResults })));

const SparkleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3v3.4a1 1 0 0 0 1 1h3.4M12 21v-3.4a1 1 0 0 0-1-1H7.6M5.6 5.6 7.4 7.4M16.6 16.6l1.8 1.8M19 12h-3.4a1 1 0 0 0-1 1V16.4M5 12h3.4a1 1 0 0 0 1-1V7.6" />
  </svg>
);

function App() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [pastries, setPastries] = useState<Pastry[]>([]);
  
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const [editingCoffee, setEditingCoffee] = useState<Coffee | null>(null);
  const [editingPastry, setEditingPastry] = useState<Pastry | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'coffee' | 'pastry' | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [selectedCoffee, setSelectedCoffee] = useState<Coffee | null>(null);
  const [pairingResult, setPairingResult] = useState<PairingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatNumber = useCallback((value: number) => value.toLocaleString('id-ID'), []);

  // Effect to initialize tenant
  useEffect(() => {
    const initializeTenant = async () => {
        const { data: tenants, error } = await supabase.from('tenants').select('id').limit(1);
        if (error) {
            setInventoryError(`Error fetching tenant: ${error.message}`);
            showToast(`Error fetching tenant: ${error.message}`, 'error');
            return;
        }
        if (tenants && tenants.length > 0) {
            setTenantId(tenants[0].id);
        } else {
            const { data: newTenant, error: insertError } = await supabase
                .from('tenants')
                .insert({ name: 'My Café' })
                .select('id')
                .single();
            if (insertError) {
                setInventoryError(`Error creating default tenant: ${insertError.message}`);
                showToast(`Error creating default tenant: ${insertError.message}`, 'error');
            } else if (newTenant) {
                setTenantId(newTenant.id);
            }
        }
    };
    initializeTenant();
  }, []);

  // Effect to fetch inventory when tenantId is set
  useEffect(() => {
    const fetchInventory = async () => {
        if (!tenantId) return;

        try {
            setInventoryLoading(true);
            setInventoryError(null);
            const [coffeeRes, pastryRes] = await Promise.all([
                supabase.from('coffees').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
                supabase.from('pastries').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
            ]);

            if (coffeeRes.error) throw new Error(`Failed to fetch coffees: ${coffeeRes.error.message}`);
            if (pastryRes.error) throw new Error(`Failed to fetch pastries: ${pastryRes.error.message}`);

            setCoffees(coffeeRes.data || []);
            setPastries(pastryRes.data || []);

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An unknown error occurred while fetching inventory.";
            console.error(message);
            setInventoryError(message);
            showToast(message, 'error');
        } finally {
            setInventoryLoading(false);
        }
    };
    fetchInventory();
  }, [tenantId]);

  const handleAddCoffee = async (formData: Omit<CoffeeInsert, 'tenant_id' | 'image_path' | 'image_url'>, imageFile: File) => {
    if (!tenantId) return;

    try {
        const { publicUrl, path } = await uploadImage(imageFile, 'coffee-images');
        const coffeeToInsert: CoffeeInsert = { ...formData, tenant_id: tenantId, image_url: publicUrl, image_path: path };
        const { data, error } = await supabase.from('coffees').insert([coffeeToInsert]).select().single();

        if (error) throw error;
        
        setCoffees(prev => [data, ...prev]);
        setIsAddModalOpen(false);
        showToast(`'${data.name}' was added successfully.`, 'success');
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        console.error("Error adding coffee:", message);
        showToast(`Error adding coffee: ${message}`, 'error');
    }
  };

  const handleAddPastry = async (formData: Omit<PastryInsert, 'tenant_id' | 'image_path' | 'image_url'>, imageFile: File) => {
    if (!tenantId) return;
    
    try {
        const { publicUrl, path } = await uploadImage(imageFile, 'pastry-images');
        const pastryToInsert: PastryInsert = { ...formData, tenant_id: tenantId, image_url: publicUrl, image_path: path };
        const { data, error } = await supabase.from('pastries').insert([pastryToInsert]).select().single();
        
        if (error) throw error;

        setPastries(prev => [data, ...prev]);
        setIsAddModalOpen(false);
        showToast(`'${data.name}' was added successfully.`, 'success');
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        console.error("Error adding pastry:", message);
        showToast(`Error adding pastry: ${message}`, 'error');
    }
  };

  const handleUpdateCoffee = async (id: string, updates: CoffeeUpdate, newImageFile: File | null) => {
    try {
        let oldImagePath: string | undefined;
        if (newImageFile) {
            const currentCoffee = coffees.find(c => c.id === id);
            oldImagePath = currentCoffee?.image_path;

            const { publicUrl, path } = await uploadImage(newImageFile, 'coffee-images');
            updates.image_url = publicUrl;
            updates.image_path = path;
        }

        const { data, error } = await supabase.from('coffees').update(updates).eq('id', id).select().single();
        if (error) throw error;

        if (oldImagePath) {
            await deleteImage('coffee-images', oldImagePath);
        }
        
        setCoffees(prev => prev.map(c => c.id === id ? data : c));
        setEditingCoffee(null);
        showToast(`'${data.name}' updated successfully.`, 'success');
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        console.error("Error updating coffee:", message);
        showToast(`Error updating coffee: ${message}`, 'error');
    }
  };

  const handleUpdatePastry = async (id: string, updates: PastryUpdate, newImageFile: File | null) => {
     try {
        let oldImagePath: string | undefined;
        if (newImageFile) {
            const currentPastry = pastries.find(p => p.id === id);
            oldImagePath = currentPastry?.image_path;

            const { publicUrl, path } = await uploadImage(newImageFile, 'pastry-images');
            updates.image_url = publicUrl;
            updates.image_path = path;
        }

        const { data, error } = await supabase.from('pastries').update(updates).eq('id', id).select().single();
        if (error) throw error;

        if (oldImagePath) {
            await deleteImage('pastry-images', oldImagePath);
        }
        
        setPastries(prev => prev.map(p => p.id === id ? data : p));
        setEditingPastry(null);
        showToast(`'${data.name}' updated successfully.`, 'success');
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        console.error("Error updating pastry:", message);
        showToast(`Error updating pastry: ${message}`, 'error');
    }
  };


  const handleDeleteCoffee = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
        const coffeeToDelete = coffees.find(c => c.id === id);
        const { error } = await supabase.from('coffees').delete().eq('id', id);
        
        if (error) {
            showToast(`Error deleting coffee: ${error.message}`, 'error');
        } else {
            if (coffeeToDelete?.image_path) {
                await deleteImage('coffee-images', coffeeToDelete.image_path);
            }
            setCoffees(prev => prev.filter(c => c.id !== id));
            showToast(`'${name}' deleted successfully.`, 'success');
        }
    }
  };

  const handleDeletePastry = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
        const pastryToDelete = pastries.find(p => p.id === id);
        const { error } = await supabase.from('pastries').delete().eq('id', id);

        if (error) {
            showToast(`Error deleting pastry: ${error.message}`, 'error');
        } else {
            if (pastryToDelete?.image_path) {
                await deleteImage('pastry-images', pastryToDelete.image_path);
            }
            setPastries(prev => prev.filter(p => p.id !== id));
            showToast(`'${name}' deleted successfully.`, 'success');
        }
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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to generate pairings. ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCoffee, pastries]);
  
  const handleSelectCoffee = useCallback((coffee: Coffee) => {
    setSelectedCoffee(prev => (prev?.id === coffee.id ? null : coffee));
    setPairingResult(null);
    setError(null);
  }, []);
  
  const openAddModal = useCallback((type: 'coffee' | 'pastry') => {
    setAddModalType(type);
    setIsAddModalOpen(true);
  }, []);


  // Memoized coffee list untuk performa
  const coffeeList = useMemo(() => {
    if (inventoryLoading) return <div className="flex w-full justify-center py-6"><Spinner /></div>;
    if (inventoryError) return <p className="rounded-2xl bg-red-900/40 p-4 text-sm text-red-200">{inventoryError}</p>;
    if (coffees.length === 0) return <p className="rounded-2xl bg-brand-bg/40 p-4 text-sm text-brand-text/60">Belum ada kopi yang ditambahkan.</p>;
    
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

  // Memoized pastry list untuk performa
  const pastryList = useMemo(() => {
    if (inventoryLoading) return <div className="flex w-full justify-center py-6"><Spinner /></div>;
    if (inventoryError) return <p className="rounded-2xl bg-red-900/40 p-4 text-sm text-red-200">{inventoryError}</p>;
    if (pastries.length === 0) return <p className="rounded-2xl bg-brand-bg/40 p-4 text-sm text-brand-text/60">Belum ada pastry yang ditambahkan.</p>;
    
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
    if (coffees.length === 0) return <p className="w-full rounded-2xl bg-brand-bg/40 p-4 text-center text-sm text-brand-text/60">Tambahkan kopi ke inventori untuk mulai pairing.</p>;
    
    return coffees.map(coffee => {
      const isActive = selectedCoffee?.id === coffee.id;
      const baseClasses = 'group relative flex-shrink-0 snap-center rounded-2xl border px-3 pb-3 pt-3 transition-all duration-200 sm:w-36 w-32';
      const activeClasses = isActive
        ? 'border-brand-accent/70 bg-brand-accent/20 shadow-[0_18px_45px_-18px_rgba(162,123,92,0.9)]'
        : 'border-white/10 bg-white/5 hover:border-brand-accent/40 hover:bg-brand-accent/10';
      return (
        <div
          key={coffee.id}
          role="button"
          tabIndex={0}
          onClick={() => handleSelectCoffee(coffee)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectCoffee(coffee)}
          className={[baseClasses, activeClasses].join(' ')}
        >
          <LazyImage 
            src={coffee.image_url} 
            alt={coffee.name} 
            className="mb-3 h-24 w-full rounded-xl object-cover shadow-lg transition-transform duration-300 group-hover:scale-[1.02]" 
          />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-white line-clamp-2 text-left">{coffee.name}</p>
            <p className="text-[11px] text-brand-text/60 line-clamp-2 text-left">{coffee.flavor_notes}</p>
          </div>
          {isActive && <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />}
        </div>
      );
    });
  }, [coffees, selectedCoffee, inventoryLoading, handleSelectCoffee]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_60%)]" />
      </div>

      <Header />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-3xl p-6 lg:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-bg/70 p-3 text-brand-accent shadow-inner ring-1 ring-brand-accent/20">
                  <CoffeeIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Coffee Inventory</h2>
                  <p className="text-xs text-brand-text/60">Kelola varian kopi kamu lengkap dengan flavor notes.</p>
                </div>
              </div>
              <button
                onClick={() => openAddModal('coffee')}
                className="button-primary-pulse inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-accent via-brand-accent/80 to-amber-400/70 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              >
                <span className="inline-flex h-2 w-2 rounded-full bg-white/70" />
                Add Coffee
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.26em] text-brand-text/50">
                <span>Current Coffees</span>
                <span>{coffees.length}</span>
              </div>
              <div className="flex-grow space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '22rem' }}>
                {coffeeList}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 lg:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-bg/70 p-3 text-brand-accent shadow-inner ring-1 ring-brand-accent/20">
                  <PastryIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Pastry Inventory</h2>
                  <p className="text-xs text-brand-text/60">Tetapkan tekstur & allergen untuk rekomendasi yang tepat.</p>
                </div>
              </div>
              <button
                onClick={() => openAddModal('pastry')}
                className="button-primary-pulse inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-accent via-brand-accent/80 to-amber-400/70 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              >
                <span className="inline-flex h-2 w-2 rounded-full bg-white/70" />
                Add Pastry
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.26em] text-brand-text/50">
                <span>Current Pastries</span>
                <span>{pastries.length}</span>
              </div>
              <div className="flex-grow space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '22rem' }}>
                {pastryList}
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel mt-10 rounded-3xl p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Generate Smart Pairings</h2>
              <p className="text-sm text-brand-text/70">Pilih kopi favoritmu, lalu biarkan AI mencari pastry pendamping terbaik.</p>
            </div>
            <div className="flex flex-col items-start gap-3 text-xs text-brand-text/60 lg:items-end">
              <p>Tip: gunakan foto berkualitas agar tampilan kartu pairing lebih menggoda.</p>
              <p className="rounded-full border border-brand-accent/30 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-brand-text/50">drag untuk melihat semua kopi</p>
            </div>
          </div>

          <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl bg-white/5 p-4">
            {coffeeSelectionList}
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={handleGeneratePairings}
              disabled={!selectedCoffee || pastries.length === 0 || isLoading}
              className="button-primary-pulse inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-accent via-brand-accent/90 to-amber-400/70 px-8 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:shadow-[0_30px_60px_-25px_rgba(162,123,92,0.85)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-brand-text/50"
            >
              {isLoading ? 'Thinking...' : 'Smart Pair with Pastry'}
            </button>
            {!selectedCoffee && pastries.length > 0 && coffees.length > 0 && (
              <p className="text-sm text-brand-accent">Pilih dulu kopi yang mau di-highlight.</p>
            )}
            {pastries.length === 0 && coffees.length > 0 && (
              <p className="text-sm text-red-300">Tambah minimal satu pastry agar pairing bisa jalan.</p>
            )}
          </div>
        </section>

        <Suspense fallback={<div className="mt-10 text-center"><Spinner /></div>}>
          <PairingResults
            result={pairingResult}
            isLoading={isLoading}
            error={error}
          />
        </Suspense>

        {(editingCoffee || editingPastry) && (
          <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur"><Spinner /></div>}>
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
          <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur"><Spinner /></div>}>
            <AddModal
              type={addModalType}
              onClose={() => setIsAddModalOpen(false)}
              onAddCoffee={handleAddCoffee}
              onAddPastry={handleAddPastry}
            />
          </Suspense>
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <footer className="relative z-10 py-8 text-center text-[11px] uppercase tracking-[0.3em] text-brand-text/40">
        <p>Café Owner AI Dashboard | Powered by Gemini & Supabase</p>
      </footer>
    </div>
  );
}

export default App;
