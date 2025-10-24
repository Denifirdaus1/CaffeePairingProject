import React, { useState, useEffect, useRef } from 'react';
import type { Coffee, Pastry } from '../types';
import type { CoffeeUpdate, PastryUpdate } from '../services/supabaseClient';

interface EditModalProps {
  item: Coffee | Pastry | null;
  type: 'coffee' | 'pastry';
  onClose: () => void;
  onSaveCoffee: (id: string, updates: CoffeeUpdate, newImageFile: File | null) => Promise<void>;
  onSavePastry: (id: string, updates: PastryUpdate, newImageFile: File | null) => Promise<void>;
}

export const EditModal: React.FC<EditModalProps> = ({ item, type, onClose, onSaveCoffee, onSavePastry }) => {
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setFormData(item);
      setImagePreview(item.image_url || null);
      setNewImageFile(null); // Reset file on item change
    }
  }, [item]);

  if (!item) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    if (inputType === 'number' && value === '') {
        setFormData((prev: any) => ({ ...prev, [name]: null }));
        return;
    }
    const val = inputType === 'number' ? parseFloat(value) : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev: any) => {
        const newState = { ...prev, [name]: checked };
        if (name === 'is_core' && checked) newState.is_guest = false;
        if (name === 'is_guest' && checked) newState.is_core = false;
        return newState;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      // Create a temporary URL for instant preview
      setImagePreview(URL.createObjectURL(file));
      // Clear the manual image_url field if a file is uploaded
      setFormData((prev: any) => ({...prev, image_url: ''}));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const { id, created_at, updated_at, tenant_id, image_path, ...updates } = formData;
    
    // If a new file is not uploaded, and the user cleared the image_url field manually,
    // prevent sending an empty string. The backend will preserve the existing URL.
    if (!newImageFile && updates.image_url === '') {
        delete updates.image_url;
    }

    if (type === 'coffee') {
      await onSaveCoffee(id, updates as CoffeeUpdate, newImageFile);
    } else {
      await onSavePastry(id, updates as PastryUpdate, newImageFile);
    }
    setIsSaving(false);
  };
  
  const renderCoffeeForm = () => (
    <>
        <div>
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="is_core" checked={formData.is_core || false} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-brand-accent bg-brand-bg border-brand-accent/50 focus:ring-brand-accent" />
                    <span>Is Core</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="is_guest" checked={formData.is_guest || false} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-brand-accent bg-brand-bg border-brand-accent/50 focus:ring-brand-accent" />
                    <span>Is Guest/Seasonal</span>
                </label>
            </div>
            <p className="text-xs text-brand-text/70 mt-1">"Core" items are always available. "Guest" items are seasonal or limited.</p>
        </div>
        <div>
            <label htmlFor="flavor_notes" className="block text-sm font-medium text-brand-text/90 mb-1">Flavor Notes</label>
            <textarea id="flavor_notes" name="flavor_notes" value={formData.flavor_notes || ''} onChange={handleChange} placeholder="e.g., chocolate, nutty, low acidity" required rows={3} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"></textarea>
            <p className="text-xs text-brand-text/70 mt-1">Comma-separated keywords. Used by the AI to find the best pairings.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="season_hint" className="block text-sm font-medium text-brand-text/90 mb-1">Season Hint</label>
                <select id="season_hint" name="season_hint" value={formData.season_hint || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent">
                    <option value="">No Season</option>
                    <option value="fall">Fall</option>
                    <option value="winter">Winter</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                </select>
                <p className="text-xs text-brand-text/70 mt-1">Optional. Helps the AI recommend this during a specific season.</p>
            </div>
            <div>
                <label htmlFor="popularity_hint" className="block text-sm font-medium text-brand-text/90 mb-1">Popularity Hint</label>
                <input id="popularity_hint" type="number" name="popularity_hint" min="0" max="1" step="0.1" value={formData.popularity_hint ?? ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent" />
                <p className="text-xs text-brand-text/70 mt-1">0=rare, 1=bestseller. Used in AI scoring.</p>
            </div>
        </div>
    </>
  );

  const renderPastryForm = () => (
    <>
        <div>
            <label htmlFor="flavor_tags" className="block text-sm font-medium text-brand-text/90 mb-1">Flavor Tags</label>
            <textarea id="flavor_tags" name="flavor_tags" value={formData.flavor_tags || ''} onChange={handleChange} placeholder="e.g., almond, butter, sweet" required className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"></textarea>
            <p className="text-xs text-brand-text/70 mt-1">Comma-separated keywords. Critical for AI analysis.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="texture_tags" className="block text-sm font-medium text-brand-text/90 mb-1">Texture Tags</label>
                <textarea id="texture_tags" name="texture_tags" value={formData.texture_tags || ''} onChange={handleChange} placeholder="e.g., flaky, crispy" required className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"></textarea>
                <p className="text-xs text-brand-text/70 mt-1">Keywords for texture. Used for AI balancing.</p>
            </div>
            <div>
                <label htmlFor="popularity_hint_pastry" className="block text-sm font-medium text-brand-text/90 mb-1">Popularity Hint</label>
                <input id="popularity_hint_pastry" type="number" name="popularity_hint" min="0" max="1" step="0.1" value={formData.popularity_hint ?? ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent" />
                <p className="text-xs text-brand-text/70 mt-1">0=rare, 1=bestseller. Used in AI scoring.</p>
            </div>
        </div>
        <div>
            <label htmlFor="allergen_info" className="block text-sm font-medium text-brand-text/90 mb-1">Allergen Info</label>
            <input id="allergen_info" type="text" name="allergen_info" value={formData.allergen_info || ''} onChange={handleChange} placeholder="e.g., Contains nuts, gluten-free" className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent" />
            <p className="text-xs text-brand-text/70 mt-1">Optional. A short note about allergens.</p>
        </div>
    </>
  );

  return (
    <div 
        className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-brand-primary rounded-lg shadow-2xl p-6 w-full max-w-lg m-4 animate-scale-up flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-4 flex-shrink-0">Edit {item.name}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
            <div className="overflow-y-auto flex-grow space-y-4 pr-3">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-brand-text/90 mb-1">Name</label>
                    <input id="name" type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="Item Name" required className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent" />
                    <p className="text-xs text-brand-text/70 mt-1">The public-facing name of the item.</p>
                </div>
                
                {type === 'coffee' ? renderCoffeeForm() : renderPastryForm()}
                
                <div>
                    <label className="block text-sm font-medium text-brand-text/90 mb-2">Image</label>
                    <div className="flex items-center gap-4">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Current item" className="w-20 h-20 rounded-lg object-cover bg-brand-bg"/>
                        ) : (
                            <div className="w-20 h-20 rounded-lg bg-brand-bg/50 flex items-center justify-center text-xs text-brand-text/50">No Image</div>
                        )}
                        <div>
                            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" className="hidden"/>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-brand-accent/80 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-accent transition-colors">
                                Upload New Image
                            </button>
                            <p className="text-xs text-brand-text/70 mt-1 truncate max-w-[200px]">{newImageFile?.name || "Optional: Upload to replace current image."}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-brand-accent/30 flex-shrink-0">
                <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500 transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={isSaving} className="bg-brand-accent text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-80 disabled:bg-gray-500 disabled:cursor-wait transition-colors">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};