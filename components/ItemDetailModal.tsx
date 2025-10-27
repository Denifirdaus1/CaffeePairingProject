import React, { useState } from 'react';
import type { Coffee, Pastry } from '../types';
import { QRCodeIcon } from './icons/QRCodeIcon';

interface ItemDetailModalProps {
  item: Coffee | Pastry | null;
  type: 'coffee' | 'pastry';
  shopSlug: string;
  onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, type, shopSlug, onClose }) => {
  const [qrGenerated, setQrGenerated] = useState(false);
  
  if (!item) return null;

  const isCoffee = type === 'coffee';
  const coffee = isCoffee ? (item as Coffee) : null;
  const pastry = !isCoffee ? (item as Pastry) : null;

  const publicUrl = `${window.location.origin}/s/${shopSlug}/${type}/${item.slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(publicUrl)}`;

  const handlePrintQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const imageUrl = window.URL.createObjectURL(blob);

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${item.name} - QR Code</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: white;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                padding: 40px;
              }
              .qr-container { 
                text-align: center;
                max-width: 600px;
              }
              .qr-title { 
                font-size: 32px; 
                font-weight: 700; 
                margin-bottom: 10px;
                color: #1a1a1a;
              }
              .qr-subtitle {
                font-size: 16px;
                color: #666;
                margin-bottom: 30px;
              }
              .qr-image { 
                width: 100%;
                max-width: 400px;
                height: auto;
                margin: 0 auto 30px;
                border: 4px solid #f0f0f0;
                border-radius: 12px;
                padding: 20px;
                background: white;
              }
              .qr-instruction { 
                font-size: 16px; 
                margin-top: 20px;
                color: #666;
                font-weight: 500;
              }
              @media print {
                body { padding: 0; }
                .qr-container { max-width: 100%; }
                .qr-image { border: 2px solid #000; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="qr-title">${item.name}</div>
              <div class="qr-subtitle">${isCoffee ? '☕ Coffee' : '🥐 Pastry'}</div>
              <img src="${imageUrl}" alt="QR Code" class="qr-image" />
              <div class="qr-instruction">Scan to view details and pairings</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => {
          window.URL.revokeObjectURL(imageUrl);
        }, 1000);
      };
    } catch (error) {
      console.error('Error printing QR code:', error);
      alert('Failed to print QR code. Please try again.');
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface rounded-3xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          title="Close"
          className="absolute top-6 right-6 z-10 text-brand-text hover:text-white transition-colors"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {isCoffee ? (
                <span className="text-3xl">☕</span>
              ) : (
                <span className="text-3xl">🥐</span>
              )}
              <h2 className="text-3xl font-bold text-white">{item.name}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Image */}
            <div>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-80 object-cover rounded-2xl shadow-xl"
                />
              ) : (
                <div className="w-full h-80 bg-brand-surface rounded-2xl flex items-center justify-center">
                  <span className="text-brand-text-muted">No Image</span>
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="space-y-6">
              {/* Coffee Details */}
              {coffee && (
                <>
                  {/* Flavor Profile */}
                  {coffee.flavor_notes && (
                    <div>
                      <h3 className="text-sm font-semibold text-brand-text-muted mb-2">🌟 FLAVOR PROFILE</h3>
                      <div className="flex flex-wrap gap-2">
                        {coffee.flavor_notes.split(',').map((note, idx) => (
                          <span key={idx} className="bg-brand-accent/10 text-brand-accent px-3 py-1.5 rounded-full text-sm font-medium">
                            {note.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coffee Specs */}
                  <div className="glass-panel rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Coffee Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {coffee.origin && (
                        <div>
                          <div className="text-xs text-brand-text-muted">Origin</div>
                          <div className="text-white font-semibold">{coffee.origin}</div>
                        </div>
                      )}
                      {coffee.roast_type && (
                        <div>
                          <div className="text-xs text-brand-text-muted">Roast</div>
                          <div className="text-white font-semibold capitalize">{coffee.roast_type}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-brand-text-muted">Popularity</div>
                        <div className="text-brand-accent font-semibold">{Math.round(coffee.popularity_hint * 100)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-brand-text-muted">Season</div>
                        <div className="text-white font-semibold">{coffee.season_hint || 'All Year'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {coffee.is_core && (
                      <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
                        ⭐ Core Selection
                      </span>
                    )}
                    {coffee.is_main_shot && (
                      <span className="bg-brand-accent/20 text-brand-accent px-3 py-1 rounded-full text-xs font-semibold">
                        🔥 Main Shot
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Pastry Details */}
              {pastry && (
                <>
                  {/* Flavor Tags */}
                  {pastry.flavor_tags && (
                    <div>
                      <h3 className="text-sm font-semibold text-brand-text-muted mb-2">🌟 FLAVORS</h3>
                      <div className="flex flex-wrap gap-2">
                        {pastry.flavor_tags.split(',').map((tag, idx) => (
                          <span key={idx} className="bg-brand-accent/10 text-brand-accent px-3 py-1.5 rounded-full text-sm font-medium">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Texture Tags */}
                  {pastry.texture_tags && (
                    <div>
                      <h3 className="text-sm font-semibold text-brand-text-muted mb-2">✨ TEXTURE</h3>
                      <div className="flex flex-wrap gap-2">
                        {pastry.texture_tags.split(',').map((tag, idx) => (
                          <span key={idx} className="bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-full text-sm font-medium">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pastry Specs */}
                  <div className="glass-panel rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Pastry Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-brand-text-muted">Popularity</div>
                        <div className="text-brand-accent font-semibold">{Math.round(pastry.popularity_hint * 100)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-brand-text-muted">Season</div>
                        <div className="text-white font-semibold">{pastry.season_hint || 'All Year'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {pastry.is_core && (
                      <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
                        ⭐ Signature Item
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* QR Code Section */}
              <div className="glass-panel rounded-xl p-4 border-2 border-brand-accent">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <QRCodeIcon className="h-5 w-5 text-brand-accent" />
                  QR Code for Display
                </h3>
                
                {!qrGenerated ? (
                  <button
                    onClick={() => setQrGenerated(true)}
                    className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Generate QR Code
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="text-xs text-brand-text-muted text-center break-all">
                      {publicUrl}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadQR}
                        className="flex-1 bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                      >
                        Download PNG
                      </button>
                      <button
                        onClick={handlePrintQR}
                        className="flex-1 bg-brand-accent hover:bg-brand-accent/90 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                      >
                        Print QR
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Public Link */}
              <div className="text-center">
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-accent hover:underline text-sm"
                >
                  View Public Page →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

