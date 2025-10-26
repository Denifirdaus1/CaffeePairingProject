import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DownloadIcon } from './icons/DownloadIcon';

export const QRGenerator: React.FC = () => {
  const { user } = useAuth();
  const shopSlug = user?.cafe_profile?.shop_slug;
  const shopName = user?.cafe_profile?.cafe_name || 'Your Café';

  if (!shopSlug) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-2">QR Code Generator</h3>
        <p className="text-brand-text-muted">Your shop slug is not set yet. Please update your café profile.</p>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/s/${shopSlug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(publicUrl)}`;

  const handleDownloadQR = async () => {
    try {
      // Fetch the QR code image
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${shopName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  const handlePrintQR = async () => {
    try {
      // First fetch the QR code image as blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const imageUrl = window.URL.createObjectURL(blob);

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${shopName} - QR Code</title>
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
                margin-bottom: 30px;
                color: #1a1a1a;
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
              <div class="qr-title">${shopName}</div>
              <img src="${imageUrl}" alt="QR Code" class="qr-image" />
              <div class="qr-instruction">Scan to visit our menu and discover perfect coffee pairings</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for image to load
      printWindow.onload = () => {
        printWindow.print();
        // Cleanup after printing
        setTimeout(() => {
          window.URL.revokeObjectURL(imageUrl);
        }, 1000);
      };
    } catch (error) {
      console.error('Error printing QR code:', error);
      alert('Failed to print QR code. Please try again.');
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <h3 className="text-xl font-semibold text-white mb-2">QR Code Generator</h3>
      <p className="text-brand-text-muted text-sm mb-6">
        Generate and print QR codes to place in your café. Customers can scan to visit your public shop page.
      </p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* QR Code Display */}
        <div className="flex-1 flex flex-col items-center">
          <div className="bg-white p-6 rounded-xl shadow-lg mb-4">
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              className="w-64 h-64"
            />
          </div>
          <p className="text-xs text-brand-text-muted text-center max-w-xs">
            {publicUrl}
          </p>
        </div>

        {/* Actions */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-brand-surface/40 rounded-xl p-4">
            <h4 className="font-semibold text-white mb-2">Quick Actions</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDownloadQR}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-accent to-amber-400 hover:from-brand-accent/90 hover:to-amber-400/90 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                <DownloadIcon className="h-5 w-5" />
                Download PNG
              </button>
              <button
                onClick={handlePrintQR}
                className="w-full flex items-center justify-center gap-2 bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent border border-brand-accent px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print QR Code
              </button>
            </div>
          </div>

          <div className="bg-brand-primary/30 rounded-xl p-4">
            <h4 className="font-semibold text-white mb-2">Instructions</h4>
            <ol className="text-sm text-brand-text-muted space-y-2 list-decimal list-inside">
              <li>Download or print the QR code</li>
              <li>Place it at your café entrance or table</li>
              <li>Customers can scan to view your menu and pairings</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
