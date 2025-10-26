import React, { useState, useEffect, useRef } from 'react';
import type { CoffeeInsert, PastryInsert } from '../services/supabaseClient';

const initialCoffeeState: Omit<CoffeeInsert, 'cafe_id' | 'image_path' | 'image_url'> = {
    name: '',
    is_core: true,
    is_guest: false,
    flavor_notes: '',
    season_hint: '',
    popularity_hint: 0.3
};

const initialPastryState: Omit<PastryInsert, 'cafe_id' | 'image_path' | 'image_url'> = {
    name: '',
    flavor_tags: '',
    texture_tags: '',
    popularity_hint: 0.3,
    allergen_info: '',
};

interface AddModalProps {
  type: 'coffee' | 'pastry' | null;
  onClose: () => void;
  onAddCoffee: (formData: Omit<CoffeeInsert, 'cafe_id' | 'image_path' | 'image_url'>, imageFile: File) => Promise<void>;
  onAddPastry: (formData: Omit<PastryInsert, 'cafe_id' | 'image_path' | 'image_url'>, imageFile: File) => Promise<void>;
}

export const AddModal: React.FC<AddModalProps> = ({ type, onClose, onAddCoffee, onAddPastry }) => {
  const [formData, setFormData] = useState<any>(type === 'coffee' ? initialCoffeeState : initialPastryState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset form when type changes
    setFormData(type === 'coffee' ? initialCoffeeState : initialPastryState);
    setImageFile(null);
    setImagePreview(null);
  }, [type]);

  if (!type) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    // Handle number input returning empty string
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
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
        alert("Please upload an image.");
        return;
    }
    setIsSaving(true);
    
    // The form data state for add doesn't contain image_url, so no need to strip it.
    const formDataToSend = { ...formData };

    if (type === 'coffee') {
      await onAddCoffee(formDataToSend, imageFile);
    } else {
      await onAddPastry(formDataToSend, imageFile);
    }
    setIsSaving(false);
  };
  
  const renderCoffeeForm = () => (
    <>
        <div>
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="is_core" checked={formData.is_core} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-brand-accent bg-brand-bg border-brand-accent/50 focus:ring-brand-accent" />
                    <span>Is Core</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="is_guest" checked={formData.is_guest} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-brand-accent bg-brand-bg border-brand-accent/50 focus:ring-brand-accent" />
                    <span>Is Guest/Seasonal</span>
                </label>
            </div>
            <p className="text-xs text-brand-text/70 mt-1">"Core" items are always available. "Guest" items are seasonal or limited.</p>
        </div>
        <div>
            <label htmlFor="flavor_notes" className="block text-sm font-medium text-brand-text/90 mb-1">Flavor Notes</label>
            <textarea id="flavor_notes" name="flavor_notes" value={formData.flavor_notes} onChange={handleChange} placeholder="e.g., chocolate, nutty, low acidity" required rows={3} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"></textarea>
            <p className="text-xs text-brand-text/70 mt-1">Comma-separated keywords. Used by the AI to find the best pairings.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="season_hint" className="block text-sm font-medium text-brand-text/90 mb-1">Season Hint</label>
                <select id="season_hint" name="season_hint" value={formData.season_hint} onChange={handleChange} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent">
                    <option value="">No Season Hint</option>
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
            <textarea id="flavor_tags" name="flavor_tags" value={formData.flavor_tags} onChange={handleChange} placeholder="e.g., almond, butter, sweet" required className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"></textarea>
            <p className="text-xs text-brand-text/70 mt-1">Comma-separated keywords. Critical for AI analysis.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="texture_tags" className="block text-sm font-medium text-brand-text/90 mb-1">Texture Tags</label>
                <textarea id="texture_tags" name="texture_tags" value={formData.texture_tags} onChange={handleChange} placeholder="e.g., flaky, crispy, buttery" required className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"></textarea>
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
            <input id="allergen_info" type="text" name="allergen_info" value={formData.allergen_info} onChange={handleChange} placeholder="e.g., Contains nuts, gluten-free" className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent" />
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
        <h2 className="text-2xl font-bold text-white mb-4 flex-shrink-0">Add New {type === 'coffee' ? 'Coffee' : 'Pastry'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
            <div className="overflow-y-auto flex-grow space-y-4 pr-3">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-brand-text/90 mb-1">
                        {type === 'coffee' ? 'Coffee Name' : 'Pastry Name'}
                    </label>
                    <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder={type === 'coffee' ? "House Espresso / Ethiopia Yirgacheffe" : "Almond Croissant / Lemon Tart"} required minLength={2} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent" />
                    <p className="text-xs text-brand-text/70 mt-1">The public-facing name of the item.</p>
                </div>
                
                {type === 'coffee' ? renderCoffeeForm() : renderPastryForm()}
                
                <div>
                    <label className="text-sm font-medium text-brand-text/90 block mb-2">Image</label>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 bg-brand-accent/80 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-accent transition-colors">
                            Upload Image
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" className="hidden" required />
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-md object-cover" />
                        ) : <div className="w-16 h-16 rounded-md bg-brand-bg/50 flex items-center justify-center text-xs text-brand-text/50">Preview</div> }
                        <span className="text-xs text-brand-text/70 truncate">{imageFile?.name || "No file chosen"}</span>
                    </div>
                    <p className="text-xs text-brand-text/70 mt-1">A high-quality photo is required. This will be shown to customers and used by the AI.</p>
                </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-brand-accent/30 flex-shrink-0">
                <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500 transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={isSaving || !formData.name || !imageFile} className="bg-brand-accent text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-80 disabled:bg-gray-500 disabled:cursor-wait transition-colors">
                    {isSaving ? 'Saving...' : `Add ${type === 'coffee' ? 'Coffee' : 'Pastry'}`}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};