import React, { useState, useEffect } from 'react';
import { supabase, uploadImage, deleteImage } from '../services/supabaseClient';
import { compressImage, isImageFile, formatFileSize } from '../utils/imageCompression';
import { Spinner } from './Spinner';

interface CafeProfile {
  id: string;
  cafe_name: string;
  cafe_description?: string;
  logo_url?: string;
  logo_path?: string;
}

interface CafeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeProfile: CafeProfile;
  onUpdate: () => void;
}

export const CafeSettingsModal: React.FC<CafeSettingsModalProps> = ({
  isOpen,
  onClose,
  cafeProfile,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    cafe_name: '',
    cafe_description: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (cafeProfile) {
      setFormData({
        cafe_name: cafeProfile.cafe_name || '',
        cafe_description: cafeProfile.cafe_description || '',
      });
      setLogoPreview(cafeProfile.logo_url || null);
    }
  }, [cafeProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file is an image
      if (!isImageFile(file)) {
        setError('Please upload a valid image file (JPG, PNG, WebP)');
        return;
      }

      console.log('📷 Original logo:', formatFileSize(file.size));

      try {
        // Compress image (logo size: 400x400, higher quality for logos)
        const compressedFile = await compressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.9,
          targetFormat: 'webp'
        });

        setLogoFile(compressedFile);
        setLogoPreview(URL.createObjectURL(compressedFile));
        
        setSuccess(`✅ Logo compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error('Logo compression failed:', error);
        // Fallback: use original file if compression fails
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const updates: any = {
        cafe_name: formData.cafe_name,
        cafe_description: formData.cafe_description,
      };

      // Handle logo upload/update
      if (logoFile) {
        console.log('Uploading new logo...');
        
        // Upload new logo
        const { publicUrl, path } = await uploadImage(logoFile, 'cafe-logos');
        updates.logo_url = publicUrl;
        updates.logo_path = path;

        // Delete old logo if exists
        if (cafeProfile.logo_path) {
          await deleteImage('cafe-logos', cafeProfile.logo_path);
          console.log('✅ Old logo deleted');
        }
        
        console.log('✅ New logo uploaded:', publicUrl);
      } else if (logoPreview === null && cafeProfile.logo_url) {
        // User removed logo (no preview, had logo before)
        updates.logo_url = null;
        updates.logo_path = null;

        // Delete old logo
        if (cafeProfile.logo_path) {
          await deleteImage('cafe-logos', cafeProfile.logo_path);
          console.log('✅ Logo deleted');
        }
      }

      // Update cafe profile
      const { error: updateError } = await supabase
        .from('cafe_profiles')
        .update(updates)
        .eq('id', cafeProfile.id);

      if (updateError) throw updateError;

      setSuccess('✅ Settings updated successfully!');
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-2xl border-2 border-brand-accent/30">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-brand-accent/10 px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-white">Café Settings</h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-brand-text/90 mb-2">
              Café Logo
            </label>
            <div className="flex items-start gap-4">
              {logoPreview ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-24 h-24 rounded-xl object-cover border-2 border-brand-accent/30"
                  />
                  {!isSaving && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                      aria-label="Remove logo"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-brand-accent/30 flex items-center justify-center bg-brand-bg/50">
                  <svg className="w-8 h-8 text-brand-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <input
                  id="settings-logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={isSaving}
                  className="hidden"
                />
                <label
                  htmlFor="settings-logo"
                  className={`inline-flex items-center gap-2 bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent px-4 py-2 rounded-lg cursor-pointer transition-colors border border-brand-accent/30 ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </label>
                <p className="mt-2 text-xs text-brand-text-muted">
                  Recommended: Square image, 400x400px. Auto-compressed to WebP format.
                </p>
              </div>
            </div>
          </div>

          {/* Café Name */}
          <div>
            <label htmlFor="cafe_name" className="block text-sm font-medium text-brand-text/90 mb-2">
              Café Name *
            </label>
            <input
              id="cafe_name"
              name="cafe_name"
              type="text"
              required
              value={formData.cafe_name}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Your café name"
            />
          </div>

          {/* Café Description */}
          <div>
            <label htmlFor="cafe_description" className="block text-sm font-medium text-brand-text/90 mb-2">
              Café Description
            </label>
            <textarea
              id="cafe_description"
              name="cafe_description"
              rows={4}
              value={formData.cafe_description}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              placeholder="Tell customers about your café..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-900/40 p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-xl bg-green-900/40 p-3 text-green-200 text-sm">
              {success}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-accent via-brand-accent/90 to-amber-400/70 text-white font-semibold transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

