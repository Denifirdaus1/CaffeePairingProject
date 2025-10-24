import React, { useState, useEffect, useRef } from 'react';
import type { PairingResponse } from '../types';
import { PairingCard } from './PairingCard';
import { ThinkingIndicator } from './ThinkingIndicator';
import { downloadJSON, downloadCSV, downloadHTML, downloadPDF } from '../services/downloadService';
import { DownloadIcon } from './icons/DownloadIcon';


interface PairingResultsProps {
  result: PairingResponse | null;
  isLoading: boolean;
  error: string | null;
}

export const PairingResults: React.FC<PairingResultsProps> = ({ result, isLoading, error }) => {
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mt-8 bg-brand-primary/50 rounded-lg p-6 shadow-xl text-center animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-2">AI is Thinking...</h2>
        <p className="text-brand-text mb-6">Generating optimal pairings based on your inventory and real-time web data.</p>
        <ThinkingIndicator />
      </div>
    );
  }

  if (error) {
    return (
        <div className="mt-8 bg-red-900/50 border border-red-500 rounded-lg p-6 shadow-xl text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-red-300 mb-2">Error</h2>
            <p className="text-red-300">{error}</p>
        </div>
    )
  }

  if (!result) {
    return (
        <div className="mt-8 bg-brand-primary/50 rounded-lg p-6 shadow-xl text-center">
             <p className="text-brand-text">Your smart pairing recommendations will appear here.</p>
        </div>
    );
  }
  
    if (result.ui.layout === 'error' || result.pairs.length === 0) {
        return (
            <div className="mt-8 bg-red-900/50 border border-red-500 rounded-lg p-6 shadow-xl text-center animate-fade-in">
                <h2 className="text-2xl font-bold text-red-300 mb-2">Pairing Generation Failed</h2>
                <p className="text-red-300">{result.ui.notes || "The AI could not generate any valid pairings. Please try a different coffee or check your inventory data."}</p>
            </div>
        );
    }
  
  const handleDownload = (format: 'pdf' | 'json' | 'csv' | 'html') => {
    setIsDownloadMenuOpen(false);
    if (!result) return;
    switch (format) {
        case 'pdf':
            downloadPDF(result);
            break;
        case 'json':
            downloadJSON(result);
            break;
        case 'csv':
            downloadCSV(result);
            break;
        case 'html':
            downloadHTML(result);
            break;
    }
  }

  return (
    <div className="mt-8 animate-fade-in">
      <div className="bg-brand-primary/50 rounded-lg p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Top {result.pairs.length} Pairings for {result.coffee.name}</h2>
        <p className="text-sm text-brand-text italic mb-6">{result.ui.notes}</p>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {result.pairs.map((pairing, index) => (
            <PairingCard key={pairing.pastry.id} pairing={pairing} rank={index + 1} />
          ))}
        </div>
      </div>
      <div className="mt-6 bg-brand-primary/50 rounded-lg p-4 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-3">Quick Actions</h3>
        <div className="flex items-center gap-4">
            <div className="relative" ref={downloadMenuRef}>
                <button 
                    onClick={() => setIsDownloadMenuOpen(prev => !prev)}
                    className="bg-brand-accent text-white font-bold py-2 px-5 rounded-lg shadow-md hover:bg-opacity-80 transition-colors flex items-center gap-2"
                >
                    <DownloadIcon className="w-5 h-5"/>
                    Download
                </button>
                {isDownloadMenuOpen && (
                    <div className="absolute bottom-full mb-2 w-48 bg-brand-bg border border-brand-accent/50 rounded-lg shadow-2xl z-10 animate-fade-in-up overflow-hidden">
                        <ul className="text-sm text-brand-text">
                            <li onClick={() => handleDownload('pdf')} className="p-3 hover:bg-brand-accent/30 cursor-pointer transition-colors">Export as PDF Report</li>
                            <li onClick={() => handleDownload('html')} className="p-3 hover:bg-brand-accent/30 cursor-pointer transition-colors">Download as HTML</li>
                            <li onClick={() => handleDownload('json')} className="p-3 hover:bg-brand-accent/30 cursor-pointer transition-colors">Download as JSON</li>
                            <li onClick={() => handleDownload('csv')} className="p-3 hover:bg-brand-accent/30 cursor-pointer transition-colors">Download as CSV</li>
                        </ul>
                    </div>
                )}
            </div>
             <button 
                className="bg-brand-bg text-brand-text font-bold py-2 px-5 rounded-lg shadow-md hover:bg-opacity-80 transition-colors border border-brand-accent/50"
            >
                Share
            </button>
             <button 
                className="bg-brand-bg text-brand-text font-bold py-2 px-5 rounded-lg shadow-md hover:bg-opacity-80 transition-colors border border-brand-accent/50"
            >
                Save as Draft
            </button>
        </div>
      </div>
    </div>
  );
};