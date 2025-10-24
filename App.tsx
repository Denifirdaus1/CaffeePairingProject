import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { generatePairings } from './services/geminiService';
import type { Coffee, Pastry, PairingResponse, Tenant } from './types';
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
    if (inventoryLoading) return <Spinner/>;
    if (inventoryError) return <p className="text-red-400">{inventoryError}</p>;
    if (coffees.length === 0) return <p className="text-brand-text/70 text-sm italic p-4 text-center">No coffees added yet.</p>;
    
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
    if (inventoryLoading) return <Spinner/>;
    if (inventoryError) return <p className="text-red-400">{inventoryError}</p>;
    if (pastries.length === 0) return <p className="text-brand-text/70 text-sm italic p-4 text-center">No pastries added yet.</p>;
    
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
    if (inventoryLoading) return <Spinner />;
    if (coffees.length === 0) return <p className="text-brand-text/70 text-sm italic p-4 text-center w-full">Add a coffee to your inventory to start pairing.</p>;
    
    return coffees.map(coffee => (
      <div
        key={coffee.id}
        role="button"
        tabIndex={0}
        onClick={() => handleSelectCoffee(coffee)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectCoffee(coffee)}
        className={`flex-shrink-0 w-32 p-2 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
          selectedCoffee?.id === coffee.id 
          ? 'border-brand-accent bg-brand-accent/20 scale-105' 
          : 'border-transparent hover:border-brand-accent/50 hover:bg-brand-bg/10'
        }`}
      >
        <LazyImage 
          src={coffee.image_url} 
          alt={coffee.name} 
          className="w-full h-24 object-cover rounded-md mb-2 shadow-lg" 
        />
        <p className="text-center text-xs font-semibold text-white truncate">{coffee.name}</p>
      </div>
    ));
  }, [coffees, selectedCoffee, inventoryLoading, handleSelectCoffee]);

  return (
    <div className="min-h-screen w-full">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Coffee Management */}
            <div className="bg-brand-primary/50 rounded-lg p-6 shadow-xl flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><CoffeeIcon className="w-6 h-6"/>Coffee Inventory</h2>
                    <button onClick={() => openAddModal('coffee')} className="bg-brand-accent/80 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-brand-accent transition-colors disabled:bg-gray-500">
                        Add Coffee
                    </button>
                 </div>
                <div className="space-y-2 flex-grow flex flex-col">
                    <h3 className="font-semibold text-white border-b border-brand-accent/30 pb-2">Current Coffees: {coffees.length}</h3>
                     <div className="flex-grow overflow-y-auto max-h-60 pr-2 space-y-2">
                         {coffeeList}
                     </div>
                </div>
            </div>

            {/* Pastry Management */}
            <div className="bg-brand-primary/50 rounded-lg p-6 shadow-xl flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><PastryIcon className="w-6 h-6"/>Pastry Inventory</h2>
                    <button onClick={() => openAddModal('pastry')} className="bg-brand-accent/80 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-brand-accent transition-colors disabled:bg-gray-500">
                        Add Pastry
                    </button>
                 </div>
                <div className="space-y-2 flex-grow flex flex-col">
                    <h3 className="font-semibold text-white border-b border-brand-accent/30 pb-2">Current Pastries: {pastries.length}</h3>
                     <div className="flex-grow overflow-y-auto max-h-60 pr-2 space-y-2">
                        {pastryList}
                    </div>
                </div>
            </div>
        </div>

        {/* Pairing Generation */}
        <div className="bg-brand-primary/50 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-1">Generate Smart Pairings</h2>
            <p className="text-sm text-brand-text/80 mb-4">Select a coffee from your inventory to begin.</p>
            
            <div className="flex overflow-x-auto gap-4 py-2 px-2 -mx-2 mb-4">
                {coffeeSelectionList}
            </div>

            <div className="mt-4 flex flex-col items-center">
                <button
                    onClick={handleGeneratePairings}
                    disabled={!selectedCoffee || pastries.length === 0 || isLoading}
                    className="bg-brand-accent text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-opacity-80 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100"
                >
                    {isLoading ? 'Thinking...' : 'Smart Pair with Pastry'}
                </button>
                {!selectedCoffee && pastries.length > 0 && coffees.length > 0 && <p className="text-sm text-brand-accent mt-2 animate-fade-in">Please select a coffee to begin.</p>}
                {pastries.length === 0 && coffees.length > 0 && <p className="text-sm text-red-400 mt-2">Please add at least one pastry to enable pairing.</p>}
            </div>
        </div>


        <Suspense fallback={<div className="mt-8 bg-brand-primary/50 rounded-lg p-6 shadow-xl text-center"><Spinner /></div>}>
          <PairingResults 
            result={pairingResult}
            isLoading={isLoading}
            error={error}
          />
        </Suspense>
        
        {(editingCoffee || editingPastry) && (
            <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><Spinner /></div>}>
                <EditModal
                    item={editingCoffee || editingPastry}
                    type={editingCoffee ? 'coffee' : 'pastry'}
                    onClose={() => { setEditingCoffee(null); setEditingPastry(null); }}
                    onSaveCoffee={handleUpdateCoffee}
                    onSavePastry={handleUpdatePastry}
                />
            </Suspense>
        )}
        
        {isAddModalOpen && (
            <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><Spinner /></div>}>
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

      <footer className="text-center py-6 text-xs text-brand-text/50 no-print">
        <p>Café Owner AI Dashboard | Powered by Gemini & Supabase</p>
      </footer>
    </div>
  );
}

export default App;