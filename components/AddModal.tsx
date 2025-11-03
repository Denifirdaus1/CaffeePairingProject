import React, { useState, useEffect, useRef } from 'react';
import type { CoffeeInsert, PastryInsert } from '../services/supabaseClient';
import { Slider } from './Slider';
import { generateCoffeeMetadata, generatePastryMetadata } from '../services/aiMetadataService';
import { compressImage, isImageFile, formatFileSize } from '../utils/imageCompression';

// Suggested keywords based on Bunamo compatibility matrix
const SUGGESTED_FLAVORS = [
  'chocolate', 'vanilla', 'caramel', 'nuts', 'cinnamon', 
  'citrus', 'berry', 'floral', 'spice', 'honey', 'almond', 
  'creamy', 'nutty', 'earthy', 'fruity', 'smoky', 'cocoa', 
  'apple', 'pumpkin', 'lemon', 'orange', 'walnut', 'toffee'
];

const SUGGESTED_TEXTURES = [
  'flaky', 'creamy', 'crispy', 'airy', 'delicate', 'light',
  'moist', 'tender', 'balanced', 'dense', 'rich', 'chewy',
  'substantial', 'buttery', 'crunchy', 'soft'
];

const SUGGESTED_ORIGINS = [
  'Brazil', 'Colombia', 'Ethiopia', 'Kenya', 'Guatemala', 
  'Costa Rica', 'Honduras', 'Peru', 'Tanzania', 'Rwanda',
  'Sumatra', 'Java', 'Mexico', 'Nicaragua', 'El Salvador'
];

const ROAST_TYPES = ['Light', 'Medium', 'Medium-Dark', 'Dark', 'Espresso'];

const initialCoffeeState: Omit<CoffeeInsert, 'cafe_id' | 'image_path' | 'image_url'> = {
    name: '',
    is_core: true,
    is_guest: false,
    flavor_notes: '',
    season_hint: '',
    popularity_hint: 0.3,
    roast_type: '',
    preparation: '',
    sort_blend: '',
    origin: '',
    acidity: 3,
    price: undefined
};

const initialPastryState: Omit<PastryInsert, 'cafe_id' | 'image_path' | 'image_url'> = {
    name: '',
    flavor_tags: '',
    texture_tags: '',
    popularity_hint: 0.3,
    allergen_info: '',
    sweetness: 3,
    richness: 3,
    price: undefined
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
  const [showFlavorSuggestions, setShowFlavorSuggestions] = useState(false);
  const [showTextureSuggestions, setShowTextureSuggestions] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [flavorInputValue, setFlavorInputValue] = useState('');
  const [textureInputValue, setTextureInputValue] = useState('');
  const [originInputValue, setOriginInputValue] = useState('');
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset form when type changes
    setFormData(type === 'coffee' ? initialCoffeeState : initialPastryState);
    setImageFile(null);
    setImagePreview(null);
    setFlavorInputValue('');
    setTextureInputValue('');
    setOriginInputValue('');
  }, [type]);

  if (!type) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    
    // Handle flavor/texture/origin inputs to show suggestions
    if (name === 'flavor_notes' || name === 'flavor_tags') {
      setFlavorInputValue(value);
      setShowFlavorSuggestions(value.length > 0);
    }
    if (name === 'texture_tags') {
      setTextureInputValue(value);
      setShowTextureSuggestions(value.length > 0);
    }
    if (name === 'origin') {
      setOriginInputValue(value);
      setShowOriginSuggestions(value.length > 0);
    }
    
    // Handle number input returning empty string
    if (inputType === 'number' && value === '') {
        setFormData((prev: any) => ({ ...prev, [name]: null }));
        return;
    }
    const val = inputType === 'number' ? parseFloat(value) : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleSliderChange = (name: string, value: number) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSuggestionClick = (suggestion: string, field: string) => {
    const currentValue = formData[field] || '';
    const newValue = currentValue 
      ? `${currentValue}, ${suggestion}`
      : suggestion;
    
    setFormData((prev: any) => ({ ...prev, [field]: newValue }));
    
    if (field === 'flavor_notes' || field === 'flavor_tags') {
      setFlavorInputValue(newValue);
      setShowFlavorSuggestions(false);
    }
    if (field === 'texture_tags') {
      setTextureInputValue(newValue);
      setShowTextureSuggestions(false);
    }
    if (field === 'origin') {
      setOriginInputValue(newValue);
      setShowOriginSuggestions(false);
    }
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file is an image
      if (!isImageFile(file)) {
        alert('Please upload a valid image file (JPG, PNG, WebP)');
        return;
      }

      // Show original size
      console.log('📷 Original image:', formatFileSize(file.size));

      try {
        // Compress image before setting state
        const compressedFile = await compressImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.85,
          targetFormat: 'webp'
        });

        setImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error('Image compression failed:', error);
        // Fallback: use original file if compression fails
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
        alert("Please upload an image.");
        return;
    }
    setIsSaving(true);
    
    const formDataToSend = { ...formData };

    if (type === 'coffee') {
      await onAddCoffee(formDataToSend, imageFile);
    } else {
      await onAddPastry(formDataToSend, imageFile);
    }
    setIsSaving(false);
  };

  const handleAIGenerate = async () => {
    if (!formData.name || formData.name.trim().length < 2) {
      alert("Please enter a name first (at least 2 characters) to generate metadata.");
      return;
    }

    setIsGeneratingMetadata(true);
    try {
      if (type === 'coffee') {
        const metadata = await generateCoffeeMetadata(formData.name);
        setFormData((prev: any) => ({
          ...prev,
          ...metadata,
          name: prev.name // Keep the original name
        }));
      } else {
        const metadata = await generatePastryMetadata(formData.name);
        setFormData((prev: any) => ({
          ...prev,
          ...metadata,
          name: prev.name // Keep the original name
        }));
      }
    } catch (error) {
      console.error('Error generating metadata:', error);
      alert("Failed to generate metadata. Please try again.");
    } finally {
      setIsGeneratingMetadata(false);
    }
  };
  
  const renderSuggestionChips = (suggestions: string[], field: string, visible: boolean) => {
    if (!visible) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2 p-2 bg-brand-bg/50 rounded-lg border border-brand-accent/30">
        <span className="text-xs text-brand-text/50 w-full">Suggested keywords:</span>
        {suggestions.filter(s => 
          !(formData[field] || '').toLowerCase().includes(s.toLowerCase())
        ).map(suggestion => (
          <button
            key={suggestion}
            type="button"
            onClick={() => handleSuggestionClick(suggestion, field)}
            className="px-2 py-1 text-xs bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent rounded-full transition-colors"
            aria-label={`Add ${suggestion} keyword`}
          >
            + {suggestion}
          </button>
        ))}
      </div>
    );
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

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="roast_type" className="block text-sm font-medium text-brand-text/90 mb-1">Roast Type</label>
                <select id="roast_type" name="roast_type" value={formData.roast_type || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent">
                    <option value="">Select roast type</option>
                    {ROAST_TYPES.map(roast => (
                        <option key={roast} value={roast}>{roast}</option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="season_hint" className="block text-sm font-medium text-brand-text/90 mb-1">Season Hint</label>
                <select id="season_hint" name="season_hint" value={formData.season_hint} onChange={handleChange} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent">
                    <option value="">No Season Hint</option>
                    <option value="fall">Fall</option>
                    <option value="winter">Winter</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                </select>
                <p className="text-xs text-brand-text/70 mt-1">Optional. Helps AI recommend during specific seasons.</p>
            </div>
        </div>

        <div>
            <label htmlFor="preparation" className="block text-sm font-medium text-brand-text/90 mb-1">Preparation Method</label>
            <input id="preparation" type="text" name="preparation" value={formData.preparation || ''} onChange={handleChange} placeholder="e.g., Espresso, Moka Pot, French Press" className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent" />
            <p className="text-xs text-brand-text/70 mt-1">How this coffee is typically prepared.</p>
        </div>

        <div>
            <label htmlFor="sort_blend" className="block text-sm font-medium text-brand-text/90 mb-1">Sort / Blend</label>
            <input id="sort_blend" type="text" name="sort_blend" value={formData.sort_blend || ''} onChange={handleChange} placeholder="e.g., 65% Arabica, 35% Robusta" className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent" />
        </div>

        <div className="relative">
            <label htmlFor="origin" className="block text-sm font-medium text-brand-text/90 mb-1">Origin</label>
            <input id="origin" type="text" name="origin" value={formData.origin || ''} onChange={handleChange} placeholder="e.g., Ethiopia, Brazil" className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent" />
            {renderSuggestionChips(SUGGESTED_ORIGINS, 'origin', showOriginSuggestions)}
            <p className="text-xs text-brand-text/70 mt-1">Click to add origin countries. Used for regional pairing logic.</p>
        </div>

        <div className="relative">
            <label htmlFor="flavor_notes" className="block text-sm font-medium text-brand-text/90 mb-1">Flavor Notes</label>
            <textarea 
                id="flavor_notes" 
                name="flavor_notes" 
                value={formData.flavor_notes} 
                onChange={handleChange} 
                placeholder="e.g., chocolate, nutty, low acidity" 
                required 
                rows={3} 
                className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"
            />
            {renderSuggestionChips(SUGGESTED_FLAVORS, 'flavor_notes', showFlavorSuggestions)}
            <p className="text-xs text-brand-text/70 mt-1">Click keywords above to add them. Used by AI to find the best pairings.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
            <div>
                <Slider
                    name="acidity"
                    value={formData.acidity || 3}
                    min={1}
                    max={5}
                    onChange={(value) => handleSliderChange('acidity', value)}
                    label="Acidity Level"
                    description="1=low, 5=high"
                />
            </div>
            <div>
                <Slider
                    name="popularity_hint"
                    value={(formData.popularity_hint || 0.3) * 10}
                    displayValue={formData.popularity_hint || 0.3}
                    min={0}
                    max={10}
                    onChange={(value) => handleSliderChange('popularity_hint', value / 10)}
                    label="Popularity Level"
                    description="0=rare, 10=bestseller"
                />
            </div>
        </div>
    </>
  );

  const renderPastryForm = () => (
    <>
        <div className="relative">
            <label htmlFor="flavor_tags" className="block text-sm font-medium text-brand-text/90 mb-1">Flavor Tags</label>
            <textarea 
                id="flavor_tags" 
                name="flavor_tags" 
                value={formData.flavor_tags} 
                onChange={handleChange} 
                placeholder="e.g., almond, butter, sweet" 
                required 
                className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"
            />
            {renderSuggestionChips(SUGGESTED_FLAVORS, 'flavor_tags', showFlavorSuggestions)}
            <p className="text-xs text-brand-text/70 mt-1">Click keywords above to add them. Critical for AI analysis.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="relative">
                <label htmlFor="texture_tags" className="block text-sm font-medium text-brand-text/90 mb-1">Texture Tags</label>
                <textarea 
                    id="texture_tags" 
                    name="texture_tags" 
                    value={formData.texture_tags} 
                    onChange={handleChange} 
                    placeholder="e.g., flaky, crispy, buttery" 
                    required 
                    className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"
                />
                {renderSuggestionChips(SUGGESTED_TEXTURES, 'texture_tags', showTextureSuggestions)}
                <p className="text-xs text-brand-text/70 mt-1">Click keywords above to add them. Used for AI balancing.</p>
            </div>
            <div>
                <label htmlFor="allergen_info" className="block text-sm font-medium text-brand-text/90 mb-1">Allergen Info</label>
                <input id="allergen_info" type="text" name="allergen_info" value={formData.allergen_info} onChange={handleChange} placeholder="e.g., Contains nuts, gluten-free" className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent" />
                <p className="text-xs text-brand-text/70 mt-1">Optional. A short note about allergens.</p>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Slider
                    name="sweetness"
                    value={formData.sweetness || 3}
                    min={1}
                    max={5}
                    onChange={(value) => handleSliderChange('sweetness', value)}
                    label="Sweetness"
                    description="1=low, 5=very sweet"
                />
            </div>
            <div>
                <Slider
                    name="richness"
                    value={formData.richness || 3}
                    min={1}
                    max={5}
                    onChange={(value) => handleSliderChange('richness', value)}
                    label="Richness"
                    description="1=light, 5=very rich"
                />
            </div>
        </div>
        <div>
            <Slider
                name="popularity_hint_pastry"
                value={formData.popularity_hint ? formData.popularity_hint * 10 : 3}
                displayValue={formData.popularity_hint || 0.3}
                min={0}
                max={10}
                onChange={(value) => handleSliderChange('popularity_hint', value / 10)}
                label="Popularity Level"
                description="0=rare, 10=bestseller"
            />
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
                    <div className="flex gap-2">
                        <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder={type === 'coffee' ? "House Espresso / Ethiopia Yirgacheffe" : "Almond Croissant / Lemon Tart"} required minLength={2} className="flex-1 bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent" />
                        <button 
                            type="button" 
                            onClick={handleAIGenerate}
                            disabled={isGeneratingMetadata || !formData.name || formData.name.length < 2}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-md hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
                            title="AI Auto-Fill: Generate metadata using Google Search"
                        >
                            {isGeneratingMetadata ? (
                                <>
                                    <span className="animate-spin">⟳</span>
                                    <span className="hidden sm:inline">Generating...</span>
                                </>
                            ) : (
                                <>
                                    <span>✨</span>
                                    <span className="hidden sm:inline">AI Auto-Fill</span>
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-brand-text/70 mt-1">
                        Enter the name, then click "AI Auto-Fill" to automatically generate all metadata using Google Search.
                    </p>
                </div>

                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-brand-text/90 mb-1">
                        Harga (Price)
                    </label>
                    <input 
                        id="price" 
                        type="number" 
                        name="price" 
                        value={formData.price ?? ''} 
                        onChange={handleChange} 
                        placeholder="e.g., 45000" 
                        min="0"
                        step="0.01"
                        className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent" 
                    />
                    <p className="text-xs text-brand-text/70 mt-1">Masukkan harga dalam mata uang lokal (opsional).</p>
                </div>
                
                {type === 'coffee' ? renderCoffeeForm() : renderPastryForm()}
                
                <div>
                    <label htmlFor="image-upload" className="text-sm font-medium text-brand-text/90 block mb-2">Image</label>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 bg-brand-accent/80 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-accent transition-colors">
                            Upload Image
                        </button>
                        <input id="image-upload" type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" className="hidden" required aria-label="Upload image" />
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