import React from 'react';
import type { PairingResponse } from '../types';
import { CoffeeIcon } from './icons/CoffeeIcon';

interface PrintableViewProps {
  data: PairingResponse;
  qrCodeUrl?: string;
  onBack?: () => void; // Made optional as it's not always needed
}

export const PrintableView: React.FC<PrintableViewProps> = ({ data, qrCodeUrl }) => {

  return (
    <div className="bg-white text-gray-800 min-h-screen p-8 md:p-12 font-sans">
      <div className="printable-area max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between border-b-2 border-gray-200 pb-4 mb-8">
          <div className="flex items-center gap-4">
            <CoffeeIcon className="w-12 h-12 text-gray-700" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pairing Report</h1>
              <p className="text-gray-500">Top Recommendations for {data.coffee.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">My Café</p>
            <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
          </div>
        </header>

        {/* Introduction */}
        <p className="text-gray-600 mb-10 text-center bg-gray-50 p-4 rounded-lg">
          Here are the top {data.pairs.length} AI-generated pastry pairings for <strong>{data.coffee.name}</strong>, based on flavor science, texture balance, and real-time data analysis. Use these insights for menu planning, promotions, and staff training.
        </p>
        
        {/* Pairings Section */}
        <div className="space-y-12">
          {data.pairs.map((pairing, index) => (
            <div key={pairing.pastry.id} className="grid grid-cols-3 gap-8 items-start">
              {/* Image */}
              <div className="col-span-1">
                <img src={pairing.pastry.image} alt={pairing.pastry.name} className="rounded-lg shadow-md object-cover aspect-square w-full" />
              </div>
              
              {/* Details */}
              <div className="col-span-2">
                <h2 className="text-2xl font-bold mb-1">
                  <span className="text-gray-400">#{index + 1}</span> {pairing.pastry.name}
                </h2>
                <p className="text-lg font-medium text-gray-500 italic mb-4">"{pairing.why_marketing}"</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {pairing.flavor_tags_standardized?.map(tag => (
                        <span key={tag} className="text-xs font-semibold bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                    {pairing.allergen_info && <span className="text-xs font-semibold bg-red-100 text-red-800 px-2.5 py-1 rounded-full">{pairing.allergen_info}</span>}
                </div>

                <div className="text-sm text-gray-700 space-y-3">
                    <p><strong>Flavor Synergy:</strong> {pairing.reasoning.flavor}</p>
                    <p><strong>Texture Balance:</strong> {pairing.reasoning.texture}</p>
                </div>
                
                {pairing.facts && pairing.facts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-2">Supporting Facts:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {pairing.facts.map((fact, factIndex) => (
                                <li key={factIndex}>
                                    {fact.summary}
                                    <a href={fact.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                        [source]
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <footer className="mt-12 pt-6 border-t-2 border-gray-200 text-center text-xs text-gray-400">
          {qrCodeUrl && (
            <div className="mb-6 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Scan QR Code to View Pairing Online</h3>
              <div className="bg-white p-4 rounded-lg shadow-lg inline-block">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-600 mt-3 max-w-md">
                Customers can scan this code to see the full pairing details on your public shop page.
              </p>
            </div>
          )}
          <p>This report was generated by the Café Owner AI Dashboard, powered by Google Gemini.</p>
          <p>Scores and recommendations are for internal strategic use. Please verify all information before public use.</p>
        </footer>
      </div>
    </div>
  );
};