import React, { useState, useRef } from 'react';
import { compressImage, isImageFile, formatFileSize } from '../utils/imageCompression';

interface PreparationDraft {
  id: string;
  method_name: string;
  price: number | '';
}

interface BeanAddModalProps {
  onClose: () => void;
  onSave: (bean: { name: string; origin?: string; roast_type?: string; flavor_notes?: string; imageFile: File | null; }, preparations: { method_name: string; price: number }[]) => Promise<void>;
}

export const BeanAddModal: React.FC<BeanAddModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [roastType, setRoastType] = useState('');
  const [flavorNotes, setFlavorNotes] = useState('');
  const [preparations, setPreparations] = useState<PreparationDraft[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addPreparation = () => {
    setPreparations(prev => [...prev, { id: crypto.randomUUID(), method_name: '', price: '' }]);
  };

  const updatePreparation = (id: string, field: 'method_name' | 'price', value: string) => {
    setPreparations(prev => prev.map(p => p.id === id ? { ...p, [field]: field === 'price' ? (value === '' ? '' : Number(value)) : value } : p));
  };

  const removePreparation = (id: string) => {
    setPreparations(prev => prev.filter(p => p.id !== id));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!isImageFile(file)) {
        alert('Please upload a valid image file (JPG, PNG, WebP)');
        return;
      }
      try {
        const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.85, targetFormat: 'webp' });
        setImageFile(compressed);
        setImagePreview(URL.createObjectURL(compressed));
      } catch {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter bean name');
      return;
    }
    setSaving(true);
    try {
      const prepared = preparations
        .filter(p => p.method_name.trim() && p.price !== '' && !isNaN(Number(p.price)))
        .map(p => ({ method_name: p.method_name.trim(), price: Number(p.price) }));
      await onSave({ name: name.trim(), origin: origin.trim() || undefined, roast_type: roastType || undefined, flavor_notes: flavorNotes.trim() || undefined, imageFile }, prepared);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-brand-primary rounded-lg shadow-2xl p-6 w-full max-w-xl m-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-4">Add New Bean</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text/90 mb-1">Bean Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required minLength={2} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text/90 mb-1">Origin</label>
              <input value={origin} onChange={e => setOrigin(e.target.value)} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text/90 mb-1">Roast Type</label>
              <input value={roastType} onChange={e => setRoastType(e.target.value)} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text/90 mb-1">Flavor Notes</label>
            <textarea value={flavorNotes} onChange={e => setFlavorNotes(e.target.value)} rows={3} className="w-full bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text" />
          </div>

          <div>
            <label className="text-sm font-medium text-brand-text/90 block mb-2">Image</label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-brand-accent/80 text-white font-bold py-2 px-4 rounded-lg">Upload Image</button>
              <input ref={fileInputRef} type="file" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-md object-cover" />
              ) : <div className="w-16 h-16 rounded-md bg-brand-bg/50 flex items-center justify-center text-xs text-brand-text/50">Preview</div>}
              <span className="text-xs text-brand-text/70">{imageFile ? formatFileSize(imageFile.size) : ''}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">Preparation Methods & Prices</label>
              <button type="button" onClick={addPreparation} className="px-3 py-1.5 rounded-md bg-brand-accent text-white text-sm">+ Add Method</button>
            </div>
            <div className="mt-3 space-y-2">
              {preparations.map(p => (
                <div key={p.id} className="grid grid-cols-5 gap-2 items-center">
                  <input placeholder="Method (e.g., Espresso)" value={p.method_name} onChange={e => updatePreparation(p.id, 'method_name', e.target.value)} className="col-span-3 bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text" />
                  <input placeholder="Price" type="number" step="0.01" value={p.price} onChange={e => updatePreparation(p.id, 'price', e.target.value)} className="col-span-1 bg-brand-bg border border-brand-accent/50 rounded-md p-2 text-brand-text" />
                  <button type="button" onClick={() => removePreparation(p.id)} className="col-span-1 text-red-400 hover:text-red-300 text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-brand-accent/30">
            <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500">Cancel</button>
            <button type="submit" disabled={saving || !name} className="bg-brand-accent text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500">{saving ? 'Saving...' : 'Save Bean'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};


