import React, { useState } from 'react';
import { Coffee, Pastry } from '../../types';
import { calculateBunamoScore } from '../../services/bunamoService';
import { LoaderIcon } from '../icons/LoaderIcon';
import { CoffeeIcon } from '../icons/CoffeeIcon';
import { PastryIcon } from '../icons/PastryIcon';

interface PublicPairingGeneratorProps {
  coffees: Coffee[];
  pastries: Pastry[];
  shopSlug: string;
}

interface PairingResult {
  pastry: Pastry;
  score: number;
  explanation: string;
}

export const PublicPairingGenerator: React.FC<PublicPairingGeneratorProps> = ({
  coffees,
  pastries,
  shopSlug,
}) => {
  const [selectedType, setSelectedType] = useState<'coffee' | 'pastry'>('coffee');
  const [selectedItem, setSelectedItem] = useState<Coffee | Pastry | null>(null);
  const [pairingResults, setPairingResults] = useState<PairingResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleItemSelect = (item: Coffee | Pastry) => {
    setSelectedItem(item);
    setPairingResults([]);
  };

  const handleGeneratePairing = async () => {
    if (!selectedItem) return;

    setIsGenerating(true);
    
    try {
      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      let results: PairingResult[] = [];

      if (selectedType === 'coffee') {
        // Coffee selected, pair with pastries
        const coffee = selectedItem as Coffee;
        const pairingPromises = pastries.map(async (pastry) => {
          const { score, explanation } = await calculateBunamoScore(coffee, pastry);
          return { pastry, score, explanation };
        });

        const allPairings = await Promise.all(pairingPromises);
        // Sort by score and take top 3
        results = allPairings
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
      } else {
        // Pastry selected, pair with coffees
        const pastry = selectedItem as Pastry;
        const pairingPromises = coffees.map(async (coffee) => {
          const { score, explanation } = await calculateBunamoScore(coffee, pastry);
          return { 
            pastry: { ...coffee, flavor_tags: coffee.flavor_notes, texture_tags: '' } as any as Pastry, 
            score, 
            explanation 
          };
        });

        const allPairings = await Promise.all(pairingPromises);
        // Sort by score and take top 3
        results = allPairings
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
      }

      setPairingResults(results);
    } catch (error) {
      console.error('Error generating pairings:', error);
      alert('Failed to generate pairings. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-brand-accent/5 via-transparent to-purple-500/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🎯 Find Your Perfect Pairing
          </h2>
          <p className="text-lg text-brand-text/80 max-w-2xl mx-auto">
            Select a coffee or pastry, and we'll recommend the perfect match using our AI-powered Bunamo algorithm
          </p>
        </div>

        {/* Type Toggle */}
        <div className="flex justify-center mb-8">
          <div className="glass-panel rounded-2xl p-2 inline-flex gap-2">
            <button
              onClick={() => {
                setSelectedType('coffee');
                setSelectedItem(null);
                setPairingResults([]);
              }}
              className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                selectedType === 'coffee'
                  ? 'bg-brand-accent text-white shadow-lg scale-105'
                  : 'text-brand-text hover:text-white'
              }`}
            >
              <CoffeeIcon className="h-5 w-5" />
              Select Coffee
            </button>
            <button
              onClick={() => {
                setSelectedType('pastry');
                setSelectedItem(null);
                setPairingResults([]);
              }}
              className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                selectedType === 'pastry'
                  ? 'bg-brand-accent text-white shadow-lg scale-105'
                  : 'text-brand-text hover:text-white'
              }`}
            >
              <PastryIcon className="h-5 w-5" />
              Select Pastry
            </button>
          </div>
        </div>

        {/* Item Selection Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            {selectedType === 'coffee' ? '☕ Choose Your Coffee' : '🥐 Choose Your Pastry'}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(selectedType === 'coffee' ? coffees : pastries).map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemSelect(item)}
                className={`glass-panel rounded-xl p-4 hover:scale-105 transition-all text-left ${
                  selectedItem?.id === item.id
                    ? 'ring-4 ring-brand-accent bg-brand-accent/10'
                    : ''
                }`}
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                  {item.name}
                </h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-accent font-medium">
                    {Math.round(item.popularity_hint * 100)}%
                  </span>
                  {selectedItem?.id === item.id && (
                    <span className="text-brand-accent">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        {selectedItem && !pairingResults.length && (
          <div className="text-center mb-12">
            <button
              onClick={handleGeneratePairing}
              disabled={isGenerating}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-brand-accent to-amber-400 hover:from-brand-accent/90 hover:to-amber-400/90 text-white px-12 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <LoaderIcon className="h-6 w-6 animate-spin" />
                  Generating Perfect Pairings...
                </>
              ) : (
                <>
                  ✨ Generate Pairing Recommendations
                </>
              )}
            </button>
          </div>
        )}

        {/* Pairing Results */}
        {pairingResults.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-white text-center mb-8">
              🌟 Top 3 Recommendations for {selectedItem?.name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pairingResults.map((result, index) => (
                <div
                  key={result.pastry.id}
                  className={`glass-panel rounded-2xl p-6 hover:scale-105 transition-all border-2 ${
                    index === 0
                      ? 'border-yellow-400 bg-yellow-400/5'
                      : index === 1
                      ? 'border-gray-300 bg-gray-300/5'
                      : 'border-amber-600 bg-amber-600/5'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`px-4 py-2 rounded-full font-bold text-sm ${
                        index === 0
                          ? 'bg-yellow-400 text-black'
                          : index === 1
                          ? 'bg-gray-300 text-black'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {index === 0 ? '🥇 Best Match' : index === 1 ? '🥈 Great Match' : '🥉 Good Match'}
                    </div>
                  </div>

                  {/* Item Image */}
                  {result.pastry.image_url && (
                    <img
                      src={result.pastry.image_url}
                      alt={result.pastry.name}
                      className="w-full h-48 object-cover rounded-xl mb-4"
                    />
                  )}

                  {/* Item Name */}
                  <h4 className="text-xl font-bold text-white mb-2">
                    {result.pastry.name}
                  </h4>

                  {/* Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-brand-text-muted">Match Score</span>
                      <span className="text-2xl font-bold text-brand-accent">
                        {Math.round(result.score * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-brand-surface rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          index === 0
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-400'
                            : index === 1
                            ? 'bg-gradient-to-r from-gray-300 to-gray-400'
                            : 'bg-gradient-to-r from-amber-600 to-amber-700'
                        }`}
                        style={{ width: `${Math.round(result.score * 100)}%` } as React.CSSProperties}
                      ></div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="bg-brand-surface/50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-brand-text leading-relaxed">
                      {result.explanation}
                    </p>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => {
                      // Navigate to pastry detail or create pairing detail
                      if (selectedType === 'coffee') {
                        window.location.href = `/s/${shopSlug}/pastry/${result.pastry.slug}`;
                      } else {
                        window.location.href = `/s/${shopSlug}/coffee/${result.pastry.slug}`;
                      }
                    }}
                    className="w-full bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent border border-brand-accent/50 px-4 py-3 rounded-xl font-semibold transition-all"
                  >
                    View Details →
                  </button>
                </div>
              ))}
            </div>

            {/* Try Again Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setPairingResults([]);
                }}
                className="text-brand-accent hover:text-white font-semibold transition-colors"
              >
                ← Try Another Pairing
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

